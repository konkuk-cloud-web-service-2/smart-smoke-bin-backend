/**
 * Not Found 미들웨어
 * 존재하지 않는 엔드포인트에 대한 처리
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: '요청하신 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * 전역 에러 핸들러
 * 모든 에러를 처리하는 미들웨어
 */
const errorHandler = (err, req, res, next) => {
  console.error('에러 발생:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // 이미 응답이 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

  // 에러 응답
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};
