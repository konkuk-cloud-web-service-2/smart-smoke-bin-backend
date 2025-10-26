const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 메모리 데이터베이스 초기화
let memoryDatabase;
try {
  memoryDatabase = require('./services/memoryDatabase');
} catch (error) {
  console.error('❌ 메모리 데이터베이스 로드 실패:', error.message);
  process.exit(1);
}

const { notFound, errorHandler } = require('./middleware/errorHandler');

// 라우터 로드
let indexRouter, healthRouter, smokeBinRouter, kpiRouter, datasetsRouter;
try {
  indexRouter = require('./routes/index');
  healthRouter = require('./routes/health');
  smokeBinRouter = require('./routes/smokeBin');
  kpiRouter = require('./routes/kpi');
  datasetsRouter = require('./routes/datasets');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// 전역 에러 핸들러
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRouter);
app.use('/api', healthRouter);
app.use('/api/smoke-bin', smokeBinRouter);
app.use('/api/v1/kpi', kpiRouter);
app.use('/api/v1/datasets', datasetsRouter);

app.use('*', notFound);
app.use(errorHandler);

app.listen(PORT, (error) => {
  if (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    process.exit(1);
  }
  
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`💾 메모리 데이터베이스로 실행 중입니다.`);
  
  try {
    const stats = memoryDatabase.getStats();
    console.log(`📊 현재 상태:`, stats);
  } catch (error) {
    console.error('❌ 메모리 데이터베이스 초기화 오류:', error.message);
  }
});

module.exports = app;
