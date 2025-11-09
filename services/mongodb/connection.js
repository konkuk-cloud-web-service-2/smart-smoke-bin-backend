const mongoose = require('mongoose');

/**
 * MongoDB Atlas 연결 관리
 * Lambda 환경에서는 연결을 재사용하기 위해 전역 변수 사용
 */

// 전역 연결 캐시 (Lambda Cold Start 최적화)
let cachedConnection = null;

/**
 * MongoDB 연결 설정
 * @returns {Promise<mongoose.Connection>}
 */
async function connectToDatabase() {
  // 이미 연결되어 있으면 캐시된 연결 반환
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ 기존 MongoDB 연결 재사용');
    return cachedConnection;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
    }

    console.log('🔌 MongoDB Atlas 연결 중...');

    // Mongoose 연결 옵션
    const options = {
      serverSelectionTimeoutMS: 5000, // 5초 타임아웃
      socketTimeoutMS: 45000, // 45초 소켓 타임아웃
      maxPoolSize: 10, // 최대 연결 풀 크기
      minPoolSize: 2, // 최소 연결 풀 크기
    };

    // MongoDB 연결
    await mongoose.connect(MONGODB_URI, options);

    cachedConnection = mongoose.connection;

    console.log('✅ MongoDB Atlas 연결 성공!');
    console.log(`📊 데이터베이스: ${mongoose.connection.name}`);

    // 연결 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 오류:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB 연결이 끊어졌습니다.');
      cachedConnection = null;
    });

    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    cachedConnection = null;
    throw error;
  }
}

/**
 * 연결 상태 확인
 * @returns {boolean}
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * 연결 종료
 */
async function closeConnection() {
  if (cachedConnection) {
    await mongoose.connection.close();
    cachedConnection = null;
    console.log('🔌 MongoDB 연결 종료');
  }
}

module.exports = {
  connectToDatabase,
  isConnected,
  closeConnection
};

