const express = require('express');
const router = express.Router();
const memoryDatabase = require('../services/memoryDatabase');
const moment = require('moment');

// 상수 정의
const VALID_EVENT_TYPES = ['drop', 'full', 'maintenance', 'online', 'offline'];
const VALID_STATUS_TYPES = ['active', 'maintenance', 'offline'];

// ==================== 헬퍼 함수 ====================

/**
 * 요청 유효성 검증
 */
const validateEventRequest = (req, res, next) => {
  const { device_id, event_type } = req.body;

  if (!device_id || !event_type) {
    return res.status(400).json({
      success: false,
      message: 'device_id와 event_type은 필수입니다.',
      error: 'MISSING_REQUIRED_FIELDS'
    });
  }

  if (!VALID_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 이벤트 타입입니다.',
      error: 'INVALID_EVENT_TYPE'
    });
  }

  next();
};

/**
 * 장치 존재 여부 확인
 */
const checkDeviceExists = async (deviceId, res) => {
  const device = await memoryDatabase.getDevice(deviceId);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: '해당 장치를 찾을 수 없습니다.',
      error: 'DEVICE_NOT_FOUND'
    });
  }
  
  return device;
};

/**
 * 이벤트 타입에 따른 장치 상태 업데이트
 */
const updateDeviceByEvent = async (eventType, deviceId) => {
  const device = await memoryDatabase.getDevice(deviceId);
  
  if (!device) return;

  if (eventType === 'drop') {
    await memoryDatabase.saveDevice({
      ...device,
      current_level: Math.min(device.current_level + 1, device.capacity)
    });
  } else if (eventType === 'full') {
    await memoryDatabase.saveDevice({
      ...device,
      current_level: device.capacity
    });
  }
};

/**
 * fill_percentage 계산
 */
const calculateFillPercentage = (currentLevel, capacity) => {
  return Math.round((currentLevel * 100.0 / capacity) * 10) / 10;
};

// ==================== API 엔드포인트 ====================

/**
 * 1. 이벤트 호출 API (하드웨어->서버)
 * POST /api/smoke-bin/events
 */
router.post('/events', validateEventRequest, async (req, res) => {
  const { device_id, event_type, data } = req.body;

  try {
    // 이벤트 저장
    const event = await memoryDatabase.saveEvent({
      device_id,
      event_type,
      data
    });

    // 이벤트 타입에 따른 장치 상태 업데이트
    await updateDeviceByEvent(event_type, device_id);

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
      error: 'DATABASE_ERROR'
    });
  }
});

/**
 * 2. 장치 리스트 조회 API
 * GET /api/smoke-bin/devices
 */
router.get('/devices', async (req, res) => {
  try {
    const devices = await memoryDatabase.getDevices();
    
    // fill_percentage 계산
    const devicesWithPercentage = devices.map(device => ({
      ...device,
      fill_percentage: calculateFillPercentage(device.current_level, device.capacity)
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
      error: 'DATABASE_ERROR'
    });
  }
});

/**
 * 3. 장치 상세 현황 조회 API
 * GET /api/smoke-bin/devices/:device_id
 */
router.get('/devices/:device_id', async (req, res) => {
  const { device_id } = req.params;

  try {
    // 장치 기본 정보 조회
    const device = await checkDeviceExists(device_id, res);
    if (!device) return; // checkDeviceExists에서 이미 응답을 보냄
    
    // 오늘의 투입 수 조회
    const todayDrops = await memoryDatabase.getTodayDrops(device_id);
    
    // 가득참 이력 조회 (최근 10개)
    const fullHistory = await memoryDatabase.getFullHistory(device_id, 10);

    res.json({
      success: true,
      message: '장치 상세 정보를 성공적으로 조회했습니다.',
      data: {
        ...device,
        fill_percentage: calculateFillPercentage(device.current_level, device.capacity),
        today_drops: todayDrops,
        full_history: fullHistory
      }
    });
  } catch (error) {
    console.error('장치 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장치 상세 조회 중 오류가 발생했습니다.',
      error: 'DATABASE_ERROR'
    });
  }
});

/**
 * 4. 30분 사용현황 로그 조회 API
 * GET /api/smoke-bin/devices/:device_id/usage-logs
 */
router.get('/devices/:device_id/usage-logs', async (req, res) => {
  const { device_id } = req.params;
  const { period = '24h' } = req.query; // 24h, 7d, 30d

  try {
    const logs = await memoryDatabase.getUsageLogs(device_id, period);
    
    const now = moment();
    let startTime;
    
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
      error: 'DATABASE_ERROR'
    });
  }
});

/**
 * 5. 장치 상태 업데이트 API (관리용)
 * PUT /api/smoke-bin/devices/:device_id/status
 */
router.put('/devices/:device_id/status', async (req, res) => {
  const { device_id } = req.params;
  const { status } = req.body;

  if (!status || !VALID_STATUS_TYPES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 상태입니다.',
      error: 'INVALID_STATUS'
    });
  }

  try {
    const device = await checkDeviceExists(device_id, res);
    if (!device) return; // checkDeviceExists에서 이미 응답을 보냄

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
      error: 'DATABASE_ERROR'
    });
  }
});

module.exports = router;
