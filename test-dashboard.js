const http = require('http');

// 대시보드 API 테스트
const testDashboardAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smoke-bin/dashboard/overview',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`상태 코드: ${res.statusCode}`);
    console.log(`헤더:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('JSON 파싱 오류:', error.message);
        console.log('원본 데이터:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('요청 오류:', error.message);
  });

  req.end();
};

// 시간대별 사용 패턴 API 테스트
const testUsagePatternAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smoke-bin/devices/SB-001/usage-pattern?period=7d',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\n시간대별 사용 패턴 API 테스트:`);
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('JSON 파싱 오류:', error.message);
        console.log('원본 데이터:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('요청 오류:', error.message);
  });

  req.end();
};

// 지역별 수거량 API 테스트
const testRegionalAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/smoke-bin/analytics/regional?period=7d',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\n지역별 수거량 API 테스트:`);
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('JSON 파싱 오류:', error.message);
        console.log('원본 데이터:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('요청 오류:', error.message);
  });

  req.end();
};

console.log('API 테스트 시작...\n');

// 각 API 테스트 실행
testDashboardAPI();

setTimeout(() => {
  testUsagePatternAPI();
}, 1000);

setTimeout(() => {
  testRegionalAPI();
}, 2000);
