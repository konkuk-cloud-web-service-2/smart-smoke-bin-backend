/**
 * 공통 유틸리티 - 데이터 검증
 */
class ValidationUtils {
  /**
   * 이벤트 타입 검증
   * @param {string} eventType - 이벤트 타입
   * @returns {boolean} 유효성
   */
  static isValidEventType(eventType) {
    const validTypes = ['drop', 'full', 'maintenance', 'online', 'offline'];
    return validTypes.includes(eventType);
  }

  /**
   * 장치 상태 검증
   * @param {string} status - 장치 상태
   * @returns {boolean} 유효성
   */
  static isValidDeviceStatus(status) {
    const validStatuses = ['active', 'maintenance', 'offline'];
    return validStatuses.includes(status);
  }

  /**
   * 기간 검증
   * @param {string} period - 기간
   * @returns {boolean} 유효성
   */
  static isValidPeriod(period) {
    const validPeriods = ['24h', '7d', '30d'];
    return validPeriods.includes(period);
  }

  /**
   * 장치 ID 검증
   * @param {string} deviceId - 장치 ID
   * @returns {boolean} 유효성
   */
  static isValidDeviceId(deviceId) {
    return deviceId && typeof deviceId === 'string' && deviceId.trim().length > 0;
  }

  /**
   * 좌표 검증
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @returns {boolean} 유효성
   */
  static isValidCoordinates(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  }

  /**
   * 필수 필드 검증
   * @param {Object} data - 검증할 데이터
   * @param {Array} requiredFields - 필수 필드 목록
   * @returns {Object} 검증 결과
   */
  static validateRequiredFields(data, requiredFields) {
    const missing = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    });

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  }
}

module.exports = ValidationUtils;
