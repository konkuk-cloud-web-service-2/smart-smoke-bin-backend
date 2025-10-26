const memoryDatabase = require('../../../services/memoryDatabase');

/**
 * 이벤트 처리 서비스
 * 하드웨어 이벤트 수신, 처리, 저장 기능 제공
 */
class EventService {
  /**
   * 이벤트 저장
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Promise<Object>} 저장된 이벤트
   */
  async saveEvent(eventData) {
    try {
      const { device_id, event_type, data } = eventData;

      // 이벤트 저장
      const event = await memoryDatabase.saveEvent({
        device_id,
        event_type,
        data
      });

      // 이벤트 타입별 후처리
      await this._handleEventPostProcessing(device_id, event_type);

      return event;
    } catch (error) {
      console.error('이벤트 저장 오류:', error);
      throw new Error('이벤트 저장 중 오류가 발생했습니다.');
    }
  }

  /**
   * 이벤트 타입별 후처리
   * @param {string} deviceId - 장치 ID
   * @param {string} eventType - 이벤트 타입
   */
  async _handleEventPostProcessing(deviceId, eventType) {
    try {
      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        console.warn(`장치 ${deviceId}를 찾을 수 없습니다.`);
        return;
      }

      switch (eventType) {
        case 'drop':
          // drop 이벤트인 경우 장치 레벨 증가
          await memoryDatabase.saveDevice({
            ...device,
            current_level: Math.min(device.current_level + 1, device.capacity)
          });
          break;
          
        case 'full':
          // full 이벤트인 경우 장치 레벨을 capacity로 설정
          await memoryDatabase.saveDevice({
            ...device,
            current_level: device.capacity
          });
          break;
          
        case 'maintenance':
          // maintenance 이벤트인 경우 상태 변경
          await memoryDatabase.saveDevice({
            ...device,
            status: 'maintenance'
          });
          break;
          
        case 'offline':
          // offline 이벤트인 경우 상태 변경
          await memoryDatabase.saveDevice({
            ...device,
            status: 'offline'
          });
          break;
          
        case 'online':
          // online 이벤트인 경우 상태를 active로 변경
          await memoryDatabase.saveDevice({
            ...device,
            status: 'active'
          });
          break;
      }
    } catch (error) {
      console.error('이벤트 후처리 오류:', error);
    }
  }

  /**
   * 장치 이벤트 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} startDate - 시작 날짜
   * @param {string} endDate - 종료 날짜
   * @returns {Promise<Array>} 이벤트 목록
   */
  async getDeviceEvents(deviceId, startDate = null, endDate = null) {
    try {
      return await memoryDatabase.getDeviceEvents(deviceId, startDate, endDate);
    } catch (error) {
      console.error('장치 이벤트 조회 오류:', error);
      throw new Error('장치 이벤트를 조회할 수 없습니다.');
    }
  }

  /**
   * 이벤트 통계 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간 (24h, 7d, 30d)
   * @returns {Promise<Object>} 이벤트 통계
   */
  async getEventStats(deviceId, period = '24h') {
    try {
      const events = await this.getDeviceEvents(deviceId);
      
      const stats = {
        total_events: events.length,
        drop_events: events.filter(e => e.event_type === 'drop').length,
        full_events: events.filter(e => e.event_type === 'full').length,
        maintenance_events: events.filter(e => e.event_type === 'maintenance').length,
        offline_events: events.filter(e => e.event_type === 'offline').length,
        online_events: events.filter(e => e.event_type === 'online').length
      };

      return stats;
    } catch (error) {
      console.error('이벤트 통계 조회 오류:', error);
      throw new Error('이벤트 통계를 조회할 수 없습니다.');
    }
  }
}

module.exports = new EventService();
