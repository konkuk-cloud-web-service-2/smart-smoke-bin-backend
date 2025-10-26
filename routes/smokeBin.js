const express = require('express');
const router = express.Router();
const memoryDatabase = require('../services/memoryDatabase');
const moment = require('moment');

// 1. 이벤트 호출 API (하드웨어->서버)
router.post('/events', async (req, res) => {
  const { device_id, event_type, data } = req.body;

  // 필수 필드 검증
  if (!device_id || !event_type) {
    return res.status(400).json({
      success: false,
      message: 'device_id와 event_type은 필수입니다.',
      error: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // 이벤트 타입 검증
  const validEventTypes = ['drop', 'full', 'maintenance', 'online', 'offline'];
  if (!validEventTypes.includes(event_type)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 이벤트 타입입니다.',
      error: 'INVALID_EVENT_TYPE'
    });
  }

  try {
    // 이벤트 저장
    const event = await memoryDatabase.saveEvent({
      device_id,
      event_type,
      data
    });

    // drop 이벤트인 경우 장치 레벨 업데이트
    if (event_type === 'drop') {
      const device = await memoryDatabase.getDevice(device_id);
      if (device) {
        await memoryDatabase.saveDevice({
          ...device,
          current_level: Math.min(device.current_level + 1, device.capacity)
        });
      }
    }

    // full 이벤트인 경우 장치 레벨을 capacity로 설정
    if (event_type === 'full') {
      const device = await memoryDatabase.getDevice(device_id);
      if (device) {
        await memoryDatabase.saveDevice({
          ...device,
          current_level: device.capacity
        });
      }
    }

    res.json({
      success: true,
      message: '이벤트가 성공적으로 저장되었습니다.',
      data: event
    });
  } catch (error) {
    console.error('이벤트 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 저장 중 오류가 발생했습니다.',
      error: 'S3_ERROR'
    });
  }
});

// 2. 장치 리스트 조회 API
router.get('/devices', async (req, res) => {
  try {
    const devices = await memoryDatabase.getDevices();
    
    // fill_percentage 계산
    const devicesWithPercentage = devices.map(device => ({
      ...device,
      fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10
    }));

    res.json({
      success: true,
      message: '장치 목록을 성공적으로 조회했습니다.',
      data: devicesWithPercentage
    });
  } catch (error) {
    console.error('장치 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장치 목록 조회 중 오류가 발생했습니다.',
      error: 'S3_ERROR'
    });
  }
});

// 3. 장치 상세 현황 조회 API
router.get('/devices/:device_id', async (req, res) => {
  const { device_id } = req.params;

  try {
    // 장치 기본 정보 조회
    const device = await memoryDatabase.getDevice(device_id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: '해당 장치를 찾을 수 없습니다.',
        error: 'DEVICE_NOT_FOUND'
      });
    }

    // 오늘의 투입 수 조회
    const todayDrops = await memoryDatabase.getTodayDrops(device_id);
    
    // 가득참 이력 조회 (최근 10개)
    const fullHistory = await memoryDatabase.getFullHistory(device_id, 10);

    res.json({
      success: true,
      message: '장치 상세 정보를 성공적으로 조회했습니다.',
      data: {
        ...device,
        fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10,
        today_drops: todayDrops,
        full_history: fullHistory
      }
    });
  } catch (error) {
    console.error('장치 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장치 상세 조회 중 오류가 발생했습니다.',
      error: 'S3_ERROR'
    });
  }
});

// 4. 30분 사용현황 로그 조회 API
router.get('/devices/:device_id/usage-logs', async (req, res) => {
  const { device_id } = req.params;
  const { period = '24h' } = req.query; // 24h, 7d, 30d

  try {
    const logs = await memoryDatabase.getUsageLogs(device_id, period);
    
    let startTime;
    const now = moment();
    
    switch (period) {
      case '24h':
        startTime = now.clone().subtract(24, 'hours');
        break;
      case '7d':
        startTime = now.clone().subtract(7, 'days');
        break;
      case '30d':
        startTime = now.clone().subtract(30, 'days');
        break;
      default:
        startTime = now.clone().subtract(24, 'hours');
    }

    res.json({
      success: true,
      message: '사용현황 로그를 성공적으로 조회했습니다.',
      data: {
        device_id,
        period,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        logs
      }
    });
  } catch (error) {
    console.error('사용현황 로그 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용현황 로그 조회 중 오류가 발생했습니다.',
      error: 'S3_ERROR'
    });
  }
});

// 장치 상태 업데이트 API (관리용)
router.put('/devices/:device_id/status', async (req, res) => {
  const { device_id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'maintenance', 'offline'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 상태입니다.',
      error: 'INVALID_STATUS'
    });
  }

  try {
    const device = await memoryDatabase.getDevice(device_id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: '해당 장치를 찾을 수 없습니다.',
        error: 'DEVICE_NOT_FOUND'
      });
    }

    const updatedDevice = await memoryDatabase.saveDevice({
      ...device,
      status
    });

    res.json({
      success: true,
      message: '장치 상태가 성공적으로 업데이트되었습니다.',
      data: {
        device_id,
        status,
        updated_at: updatedDevice.updated_at
      }
    });
  } catch (error) {
    console.error('장치 상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '장치 상태 업데이트 중 오류가 발생했습니다.',
      error: 'S3_ERROR'
    });
  }
});

module.exports = router;
