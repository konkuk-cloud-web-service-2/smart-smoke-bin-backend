const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청하신 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '서버 내부 오류가 발생했습니다.'
  });
};

module.exports = {
  notFound,
  errorHandler
};
