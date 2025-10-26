/**
 * 공통 유틸리티 - 응답 처리
 */
class ResponseUtils {
  /**
   * 성공 응답 생성
   * @param {Object} res - Express 응답 객체
   * @param {string} message - 메시지
   * @param {*} data - 데이터
   * @param {number} statusCode - 상태 코드
   */
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 에러 응답 생성
   * @param {Object} res - Express 응답 객체
   * @param {string} message - 에러 메시지
   * @param {string} errorCode - 에러 코드
   * @param {number} statusCode - 상태 코드
   */
  static error(res, message, errorCode = 'UNKNOWN_ERROR', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: errorCode,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 유효성 검사 실패 응답
   * @param {Object} res - Express 응답 객체
   * @param {string} message - 에러 메시지
   * @param {string} errorCode - 에러 코드
   */
  static validationError(res, message, errorCode = 'VALIDATION_ERROR') {
    return this.error(res, message, errorCode, 400);
  }

  /**
   * 리소스 없음 응답
   * @param {Object} res - Express 응답 객체
   * @param {string} message - 에러 메시지
   * @param {string} errorCode - 에러 코드
   */
  static notFound(res, message, errorCode = 'NOT_FOUND') {
    return this.error(res, message, errorCode, 404);
  }

  /**
   * 서버 에러 응답
   * @param {Object} res - Express 응답 객체
   * @param {string} message - 에러 메시지
   * @param {string} errorCode - 에러 코드
   */
  static serverError(res, message, errorCode = 'SERVER_ERROR') {
    return this.error(res, message, errorCode, 500);
  }
}

module.exports = ResponseUtils;
