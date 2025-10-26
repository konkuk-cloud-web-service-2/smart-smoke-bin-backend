const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 메모리 데이터베이스 초기화
const memoryDatabase = require('./services/memoryDatabase');

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

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`💾 메모리 데이터베이스로 실행 중입니다.`);
  console.log(`📊 현재 상태:`, memoryDatabase.getStats());
});

module.exports = app;
