const memoryDatabase = require('../../../services/memoryDatabase');

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
      const devices = memoryDatabase.getAllDevices();
      
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
      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      // 오늘의 투입 수 조회
      const todayDrops = await memoryDatabase.getTodayDrops(deviceId);
      
      // 가득참 이력 조회 (최근 10개)
      const fullHistory = await memoryDatabase.getFullHistory(deviceId, 10);

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

      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      const updatedDevice = await memoryDatabase.saveDevice({
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
      const todayDrops = await memoryDatabase.getTodayDrops(deviceId);
      const fullHistory = await memoryDatabase.getFullHistory(deviceId, 5);

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

  /**
   * 꽁초 투입 시뮬레이션
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 시뮬레이션 결과
   */
  async simulateDrop(deviceId) {
    try {
      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      if (device.status === 'offline') {
        throw new Error('오프라인 상태의 장치입니다.');
      }

      // 투입 수 증가
      const newLevel = Math.min(device.current_level + 1, device.capacity);
      const isFull = newLevel >= device.capacity;
      
      const updatedDevice = await memoryDatabase.saveDevice({
        ...device,
        current_level: newLevel,
        status: isFull ? 'full' : device.status
      });

      // 이벤트 기록
      await memoryDatabase.addEvent({
        device_id: deviceId,
        event_type: 'drop',
        data: JSON.stringify({ simulated: true }),
        timestamp: new Date().toISOString()
      });

      // 포화 상태인 경우 포화 이벤트도 기록
      if (isFull) {
        await memoryDatabase.addEvent({
          device_id: deviceId,
          event_type: 'full',
          data: JSON.stringify({ simulated: true }),
          timestamp: new Date().toISOString()
        });
      }

      return {
        device_id: deviceId,
        previous_level: device.current_level,
        current_level: newLevel,
        fill_percentage: Math.round((newLevel * 100.0 / device.capacity) * 10) / 10,
        is_full: isFull,
        status: updatedDevice.status,
        simulated: true
      };
    } catch (error) {
      console.error('꽁초 투입 시뮬레이션 오류:', error);
      throw error;
    }
  }

  /**
   * 장치 초기화 시뮬레이션
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 시뮬레이션 결과
   */
  async simulateReset(deviceId) {
    try {
      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      const updatedDevice = await memoryDatabase.saveDevice({
        ...device,
        current_level: 0,
        status: 'active'
      });

      // 초기화 이벤트 기록
      await memoryDatabase.addEvent({
        device_id: deviceId,
        event_type: 'reset',
        data: JSON.stringify({ simulated: true }),
        timestamp: new Date().toISOString()
      });

      return {
        device_id: deviceId,
        previous_level: device.current_level,
        current_level: 0,
        fill_percentage: 0,
        status: 'active',
        simulated: true
      };
    } catch (error) {
      console.error('장치 초기화 시뮬레이션 오류:', error);
      throw error;
    }
  }

  /**
   * 포화 상태 설정 시뮬레이션
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 시뮬레이션 결과
   */
  async simulateFull(deviceId) {
    try {
      const device = await memoryDatabase.getDevice(deviceId);
      
      if (!device) {
        throw new Error('해당 장치를 찾을 수 없습니다.');
      }

      const updatedDevice = await memoryDatabase.saveDevice({
        ...device,
        current_level: device.capacity,
        status: 'full'
      });

      // 포화 이벤트 기록
      await memoryDatabase.addEvent({
        device_id: deviceId,
        event_type: 'full',
        data: JSON.stringify({ simulated: true }),
        timestamp: new Date().toISOString()
      });

      return {
        device_id: deviceId,
        previous_level: device.current_level,
        current_level: device.capacity,
        fill_percentage: 100,
        status: 'full',
        simulated: true
      };
    } catch (error) {
      console.error('포화 상태 설정 시뮬레이션 오류:', error);
      throw error;
    }
  }
}

module.exports = new DeviceService();
