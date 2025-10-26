const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');

const indexRouter = require('./routes/index');
const healthRouter = require('./routes/health');
const smokeBinRouter = require('./routes/smokeBin');
const kpiRouter = require('./routes/kpi');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRouter);
app.use('/api', healthRouter);
app.use('/api/smoke-bin', smokeBinRouter);
app.use('/api/v1/kpi', kpiRouter);

app.use('*', notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
