const s3Database = require('../../../services/s3Database');

/**
 * 장치 관리 서비스
 * 장치 CRUD, 상태 관리, 통계 조회 기능 제공
 */
class DeviceService {
  /**
   * 모든 장치 목록 조회
   * @returns {Promise<Array>} 장치 목록
   */
  async getAllDevices() {
    try {
      const devices = await s3Database.getDevices();
      
      // 채움률 계산하여 반환
      return devices.map(device => ({
        ...device,
        fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10
      }));
    } catch (error) {
      console.error('장치 목록 조회 오류:', error);
      throw new Error('장치 목록을 조회할 수 없습니다.');
    }
  }

  /**
   * 특정 장치 상세 정보 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 장치 상세 정보
   */
  async getDeviceById(deviceId) {
    try {
      const device = await s3Database.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      // 오늘의 투입 수 조회
      const todayDrops = await s3Database.getTodayDrops(deviceId);
      
      // 가득참 이력 조회 (최근 10개)
      const fullHistory = await s3Database.getFullHistory(deviceId, 10);

      return {
        ...device,
        fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10,
        today_drops: todayDrops,
        full_history: fullHistory
      };
    } catch (error) {
      console.error('장치 상세 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 장치 상태 업데이트
   * @param {string} deviceId - 장치 ID
   * @param {string} status - 새로운 상태
   * @returns {Promise<Object>} 업데이트된 장치 정보
   */
  async updateDeviceStatus(deviceId, status) {
    try {
      const validStatuses = ['active', 'maintenance', 'offline'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.');
      }

      const device = await s3Database.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      const updatedDevice = await s3Database.saveDevice({
        ...device,
        status
      });

      return {
        device_id: deviceId,
        status,
        updated_at: updatedDevice.updated_at
      };
    } catch (error) {
      console.error('장치 상태 업데이트 오류:', error);
      throw error;
    }
  }

  /**
   * 장치 통계 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 장치 통계
   */
  async getDeviceStats(deviceId) {
    try {
      const device = await this.getDeviceById(deviceId);
      const todayDrops = await s3Database.getTodayDrops(deviceId);
      const fullHistory = await s3Database.getFullHistory(deviceId, 5);

      return {
        device_id: deviceId,
        today_drops: todayDrops,
        recent_full_events: fullHistory.length,
        fill_percentage: device.fill_percentage,
        status: device.status
      };
    } catch (error) {
      console.error('장치 통계 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = new DeviceService();
