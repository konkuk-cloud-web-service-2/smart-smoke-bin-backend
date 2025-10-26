const express = require('express');
const cors = require('cors');
require('dotenv').config();

// S3 데이터베이스 초기화 (실제 AWS S3 사용)
const s3Database = require('../services/s3Database');

const { notFound, errorHandler } = require('../middleware/errorHandler');

// 기존 라우터 (호환성 유지)
const indexRouter = require('../routes/index');
const healthRouter = require('../routes/health');

// 새로운 모듈화된 라우터
const deviceRoutes = require('./routes/deviceRoutes');
const eventRoutes = require('./routes/eventRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우터
app.use('/', indexRouter);
app.use('/api', healthRouter);

// 새로운 모듈화된 API 라우터
app.use('/api/smoke-bin/devices', deviceRoutes);
app.use('/api/smoke-bin', eventRoutes);
app.use('/api/smoke-bin', analyticsRoutes);

// 에러 처리
app.use('*', notFound);
app.use(errorHandler);

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📁 모듈화된 구조로 실행 중입니다.`);
  
  // S3 샘플 데이터 초기화
  try {
    await s3Database.initializeSampleData();
    console.log('✅ S3 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ S3 데이터베이스 초기화 오류:', error.message);
    console.log('⚠️  AWS 자격 증명을 확인해주세요.');
  }
});

module.exports = app;
