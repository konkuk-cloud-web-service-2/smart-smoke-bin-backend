const deviceService = require('./deviceService');

/**
 * 장치 관리 컨트롤러
 * HTTP 요청/응답 처리
 */
class DeviceController {
  /**
   * 장치 목록 조회
   * GET /api/smoke-bin/devices
   */
  async getDevices(req, res) {
    try {
      const devices = await deviceService.getAllDevices();
      
      res.json({
        success: true,
        message: '장치 목록을 성공적으로 조회했습니다.',
        data: devices
      });
    } catch (error) {
      console.error('장치 목록 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '장치 목록 조회 중 오류가 발생했습니다.',
        error: 'DEVICE_LIST_ERROR'
      });
    }
  }

  /**
   * 특정 장치 상세 조회
   * GET /api/smoke-bin/devices/:device_id
   */
  async getDeviceById(req, res) {
    try {
      const { device_id } = req.params;
      const device = await deviceService.getDeviceById(device_id);
      
      res.json({
        success: true,
        message: '장치 상세 정보를 성공적으로 조회했습니다.',
        data: device
      });
    } catch (error) {
      console.error('장치 상세 조회 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '장치 상세 조회 중 오류가 발생했습니다.',
        error: 'DEVICE_DETAIL_ERROR'
      });
    }
  }

  /**
   * 장치 상태 업데이트
   * PUT /api/smoke-bin/devices/:device_id/status
   */
  async updateDeviceStatus(req, res) {
    try {
      const { device_id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: '상태 값이 필요합니다.',
          error: 'MISSING_STATUS'
        });
      }

      const result = await deviceService.updateDeviceStatus(device_id, status);
      
      res.json({
        success: true,
        message: '장치 상태가 성공적으로 업데이트되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('장치 상태 업데이트 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      if (error.message === '유효하지 않은 상태입니다.') {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_STATUS'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '장치 상태 업데이트 중 오류가 발생했습니다.',
        error: 'DEVICE_STATUS_UPDATE_ERROR'
      });
    }
  }

  /**
   * 장치 통계 조회
   * GET /api/smoke-bin/devices/:device_id/stats
   */
  async getDeviceStats(req, res) {
    try {
      const { device_id } = req.params;
      const stats = await deviceService.getDeviceStats(device_id);
      
      res.json({
        success: true,
        message: '장치 통계를 성공적으로 조회했습니다.',
        data: stats
      });
    } catch (error) {
      console.error('장치 통계 조회 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '장치 통계 조회 중 오류가 발생했습니다.',
        error: 'DEVICE_STATS_ERROR'
      });
    }
  }

  /**
   * 꽁초 투입 시뮬레이션
   * POST /api/smoke-bin/devices/:device_id/simulate/drop
   */
  async simulateDrop(req, res) {
    try {
      const { device_id } = req.params;
      const result = await deviceService.simulateDrop(device_id);
      
      res.json({
        success: true,
        message: '꽁초 투입 시뮬레이션이 성공적으로 실행되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('꽁초 투입 시뮬레이션 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      if (error.message === '오프라인 상태의 장치입니다.') {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'DEVICE_OFFLINE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '꽁초 투입 시뮬레이션 중 오류가 발생했습니다.',
        error: 'SIMULATE_DROP_ERROR'
      });
    }
  }

  /**
   * 장치 초기화 시뮬레이션
   * POST /api/smoke-bin/devices/:device_id/simulate/reset
   */
  async simulateReset(req, res) {
    try {
      const { device_id } = req.params;
      const result = await deviceService.simulateReset(device_id);
      
      res.json({
        success: true,
        message: '장치 초기화 시뮬레이션이 성공적으로 실행되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('장치 초기화 시뮬레이션 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '장치 초기화 시뮬레이션 중 오류가 발생했습니다.',
        error: 'SIMULATE_RESET_ERROR'
      });
    }
  }

  /**
   * 포화 상태 설정 시뮬레이션
   * POST /api/smoke-bin/devices/:device_id/simulate/full
   */
  async simulateFull(req, res) {
    try {
      const { device_id } = req.params;
      const result = await deviceService.simulateFull(device_id);
      
      res.json({
        success: true,
        message: '포화 상태 설정 시뮬레이션이 성공적으로 실행되었습니다.',
        data: result
      });
    } catch (error) {
      console.error('포화 상태 설정 시뮬레이션 오류:', error);
      
      if (error.message === '해당 장치를 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'DEVICE_NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '포화 상태 설정 시뮬레이션 중 오류가 발생했습니다.',
        error: 'SIMULATE_FULL_ERROR'
      });
    }
  }
}

module.exports = new DeviceController();
