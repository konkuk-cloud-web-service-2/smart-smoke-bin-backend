const eventService = require('./eventService');

/**
 * 이벤트 처리 컨트롤러
 * HTTP 요청/응답 처리
 */
class EventController {
  /**
   * 이벤트 생성 (하드웨어→서버)
   * POST /api/smoke-bin/events
   */
  async createEvent(req, res) {
    try {
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

      // 이벤트 저장
      const event = await eventService.saveEvent({
        device_id,
        event_type,
        data
      });

      res.json({
        success: true,
        message: '이벤트가 성공적으로 저장되었습니다.',
        data: event
      });
    } catch (error) {
      console.error('이벤트 생성 오류:', error);
      res.status(500).json({
        success: false,
        message: '이벤트 저장 중 오류가 발생했습니다.',
        error: 'EVENT_CREATE_ERROR'
      });
    }
  }

  /**
   * 장치 이벤트 조회
   * GET /api/smoke-bin/devices/:device_id/events
   */
  async getDeviceEvents(req, res) {
    try {
      const { device_id } = req.params;
      const { start_date, end_date } = req.query;

      const events = await eventService.getDeviceEvents(device_id, start_date, end_date);
      
      res.json({
        success: true,
        message: '장치 이벤트를 성공적으로 조회했습니다.',
        data: {
          device_id,
          events,
          total_count: events.length
        }
      });
    } catch (error) {
      console.error('장치 이벤트 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '장치 이벤트 조회 중 오류가 발생했습니다.',
        error: 'DEVICE_EVENTS_ERROR'
      });
    }
  }

  /**
   * 이벤트 통계 조회
   * GET /api/smoke-bin/devices/:device_id/event-stats
   */
  async getEventStats(req, res) {
    try {
      const { device_id } = req.params;
      const { period = '24h' } = req.query;

      const stats = await eventService.getEventStats(device_id, period);
      
      res.json({
        success: true,
        message: '이벤트 통계를 성공적으로 조회했습니다.',
        data: {
          device_id,
          period,
          stats
        }
      });
    } catch (error) {
      console.error('이벤트 통계 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '이벤트 통계 조회 중 오류가 발생했습니다.',
        error: 'EVENT_STATS_ERROR'
      });
    }
  }
}

module.exports = new EventController();
