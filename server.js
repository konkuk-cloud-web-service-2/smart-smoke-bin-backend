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
let indexRouter, healthRouter, smokeBinRouter, kpiRouter, datasetsRouter, analyticsRouter, deviceRouter;
try {
  indexRouter = require('./routes/index');
  healthRouter = require('./routes/health');
  smokeBinRouter = require('./routes/smokeBin');
  kpiRouter = require('./routes/kpi');
  datasetsRouter = require('./routes/datasets');
  analyticsRouter = require('./src/routes/analyticsRoutes');
  deviceRouter = require('./src/routes/deviceRoutes');
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

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 라우터 설정
app.use('/', indexRouter);
app.use('/api', healthRouter);
app.use('/', smokeBinRouter); // smokeBinRouter가 /devices 경로를 처리
app.use('/kpi', kpiRouter);
app.use('/datasets', datasetsRouter);
app.use('/api/smoke-bin', analyticsRouter); // analytics 라우터 추가
app.use('/api/smoke-bin/devices', deviceRouter); // device 라우터 추가

// 에러 핸들러 (라우터보다 나중에 설정)
app.use('*', notFound);
app.use(errorHandler);

// 포트 체크 및 서버 시작 함수
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, (err) => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      reject(false);
    });
  });
};

const startServer = async () => {
  try {
    // 포트 사용 여부 확인
    const isPortAvailable = await checkPort(PORT).catch(() => false);
    
    if (!isPortAvailable) {
      console.error(`❌ 포트 ${PORT}가 이미 사용 중입니다.`);
      console.log(`💡 다음 명령어로 포트를 사용하는 프로세스를 종료하세요:`);
      console.log(`   Windows: netstat -ano | findstr :${PORT}`);
      console.log(`   또는 다른 포트를 설정하세요 (PORT=3001 npm start)`);
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`💾 메모리 데이터베이스로 실행 중입니다.`);
      console.log(`📍 API 엔드포인트: http://localhost:${PORT}`);
      
      try {
        const stats = memoryDatabase.getStats();
        console.log(`📊 현재 상태:`, stats);
      } catch (error) {
        console.error('❌ 메모리 데이터베이스 초기화 오류:', error.message);
      }
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    process.exit(1);
  }
};

// 모듈로 로드될 때는 서버 시작하지 않음
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
