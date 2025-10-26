const express = require('express');
const cors = require('cors');
require('dotenv').config();

// S3 데이터베이스 초기화 (실제 AWS S3 사용)
const s3Database = require('./services/s3Database');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const indexRouter = require('./routes/index');
const healthRouter = require('./routes/health');
const smokeBinRouter = require('./routes/smokeBin');
const kpiRouter = require('./routes/kpi');
const datasetsRouter = require('./routes/datasets');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, async () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  
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
