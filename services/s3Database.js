const memoryDatabase = require('./memoryDatabase');

/**
 * AWS S3 대체용 인메모리 데이터베이스 어댑터
 * 기존 코드에서 사용하던 비동기 인터페이스를 유지하면서
 * 내부적으로는 동기 메서드를 사용하는 memoryDatabase를 호출합니다.
 */
module.exports = {
  async saveEvent(eventData) {
    return memoryDatabase.saveEvent(eventData);
  },

  async getDevice(deviceId) {
    return memoryDatabase.getDevice(deviceId);
  },

  async saveDevice(deviceData) {
    return memoryDatabase.saveDevice(deviceData);
  },

  async getDevices() {
    return memoryDatabase.getAllDevices();
  },

  async getTodayDrops(deviceId) {
    return memoryDatabase.getTodayDrops(deviceId);
  },

  async getFullHistory(deviceId, limit = 10) {
    return memoryDatabase.getFullHistory(deviceId, limit);
  },

  async getUsageLogs(deviceId, period = 'today') {
    return memoryDatabase.getUsageLogs(deviceId, period);
  },

  async getStats() {
    return memoryDatabase.getStats();
  }
};