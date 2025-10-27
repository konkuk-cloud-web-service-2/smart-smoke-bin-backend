const axios = require('axios');

// 환경에 따른 URL 설정
const ENVIRONMENT = process.env.TEST_ENV || 'local';
const BASE_URLS = {
  local: 'http://localhost:3000',
  production: 'http://smart-smoke-env.eba-nnpifr7u.ap-northeast-2.elasticbeanstalk.com'
};

const BASE_URL = BASE_URLS[ENVIRONMENT];
const PING_URL = ENVIRONMENT === 'local' 
  ? 'http://localhost:3000/api/ping'
  : 'http://smart-smoke-env.eba-nnpifr7u.ap-northeast-2.elasticbeanstalk.com/api/ping';

console.log(`🧪 테스트 환경: ${ENVIRONMENT}`);
console.log(`🔗 테스트 URL: ${BASE_URL}`);

// 테스트 함수들
const testEventAPI = async () => {
  console.log('\n=== 1. 이벤트 호출 API 테스트 ===');
  
  try {
    // drop 이벤트 테스트
    const dropEvent = await axios.post(`${BASE_URL}/devices/SB001/events`, {
      event_type: 'drop',
      data: { sensor_data: 'motion_detected' }
    });
    console.log('✅ Drop 이벤트 성공:', dropEvent.data);

    // full 이벤트 테스트
    const fullEvent = await axios.post(`${BASE_URL}/devices/SB002/events`, {
      event_type: 'full',
      data: { capacity_reached: true }
    });
    console.log('✅ Full 이벤트 성공:', fullEvent.data);

    // maintenance 이벤트 테스트
    const maintenanceEvent = await axios.post(`${BASE_URL}/devices/SB003/events`, {
      event_type: 'maintenance',
      data: { maintenance_type: 'scheduled' }
    });
    console.log('✅ Maintenance 이벤트 성공:', maintenanceEvent.data);

  } catch (error) {
    console.error('❌ 이벤트 API 오류:', error.response?.data || error.message);
  }
};

const testDeviceListAPI = async () => {
  console.log('\n=== 2. 장치 리스트 조회 API 테스트 ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/devices`, {
      headers: { 'Accept': 'application/json' }
    });
    console.log('✅ 장치 목록 조회 성공:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 장치 목록 API 오류:', error.response?.data || error.message);
  }
};

const testDeviceDetailAPI = async () => {
  console.log('\n=== 3. 장치 상세 현황 조회 API 테스트 ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/devices/SB001`);
    console.log('✅ 장치 상세 조회 성공:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 장치 상세 API 오류:', error.response?.data || error.message);
  }
};

const testUsageLogsAPI = async () => {
  console.log('\n=== 4. 30분 사용현황 로그 조회 API 테스트 ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/devices/SB001/series/usage?period=24h`);
    console.log('✅ 사용현황 로그 조회 성공:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 사용현황 로그 API 오류:', error.response?.data || error.message);
  }
};

const testDeviceStatusUpdate = async () => {
  console.log('\n=== 5. 장치 상태 업데이트 API 테스트 ===');
  
  try {
    const response = await axios.put(`${BASE_URL}/devices/SB001/status`, {
      status: 'maintenance'
    });
    console.log('✅ 장치 상태 업데이트 성공:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 장치 상태 업데이트 API 오류:', error.response?.data || error.message);
  }
};

// 모든 테스트 실행
const runAllTests = async () => {
  console.log('🚀 SMART SMOKE BIN API 테스트 시작');
  console.log('='.repeat(50));
  
  await testEventAPI();
  await testDeviceListAPI();
  await testDeviceDetailAPI();
  await testUsageLogsAPI();
  await testDeviceStatusUpdate();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 모든 API 테스트 완료');
};

// 서버가 실행 중인지 확인 후 테스트 실행
const checkServerAndRunTests = async () => {
  try {
    await axios.get(PING_URL);
    console.log('✅ 서버가 실행 중입니다. 테스트를 시작합니다.');
    await runAllTests();
  } catch (error) {
    console.error('❌ 서버가 실행되지 않았습니다.');
    if (ENVIRONMENT === 'local') {
      console.error('   로컬 서버를 시작해주세요: npm start 또는 npm run dev');
    } else {
      console.error('   프로덕션 서버 상태를 확인해주세요.');
    }
  }
};

checkServerAndRunTests();
