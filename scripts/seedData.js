require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');

const { connectToDatabase, closeConnection } = require('../services/mongodb/connection');
const Device = require('../services/mongodb/models/Device');
const Event = require('../services/mongodb/models/Event');
const UsageLog = require('../services/mongodb/models/UsageLog');

/**
 * MongoDB에 초기 샘플 데이터 삽입
 */

// 샘플 장치 데이터
const sampleDevices = [
  {
    device_id: 'SB001',
    location: '강남역 1번 출구',
    latitude: 37.4979,
    longitude: 127.0276,
    status: 'active',
    capacity: 100,
    current_level: 45,
    fill_percentage: 45.0
  },
  {
    device_id: 'SB002',
    location: '홍대입구역 2번 출구',
    latitude: 37.5563,
    longitude: 126.9226,
    status: 'active',
    capacity: 100,
    current_level: 78,
    fill_percentage: 78.0
  },
  {
    device_id: 'SB003',
    location: '명동역 3번 출구',
    latitude: 37.5636,
    longitude: 126.9826,
    status: 'full',
    capacity: 100,
    current_level: 80,
    fill_percentage: 80.0
  },
  {
    device_id: 'SB004',
    location: '잠실역 1번 출구',
    latitude: 37.5133,
    longitude: 127.1028,
    status: 'offline',
    capacity: 100,
    current_level: 0,
    fill_percentage: 0.0
  },
  {
    device_id: 'SB005',
    location: '신촌역 1번 출구',
    latitude: 37.5551,
    longitude: 126.9368,
    status: 'active',
    capacity: 100,
    current_level: 32,
    fill_percentage: 32.0
  }
];

// 샘플 이벤트 데이터
const getSampleEvents = () => {
  const events = [
    {
      device_id: 'SB001',
      event_type: 'drop',
      data: { sensor_data: 'motion_detected', weight_change: 0.5 }
    },
    {
      device_id: 'SB001',
      event_type: 'drop',
      data: { sensor_data: 'motion_detected', weight_change: 0.3 }
    },
    {
      device_id: 'SB002',
      event_type: 'drop',
      data: { sensor_data: 'motion_detected', weight_change: 0.4 }
    },
    {
      device_id: 'SB001',
      event_type: 'full',
      data: { capacity_reached: true, current_level: 100 }
    },
    {
      device_id: 'SB003',
      event_type: 'maintenance',
      data: { maintenance_type: 'scheduled', technician: '김기술' }
    },
    {
      device_id: 'SB005',
      event_type: 'drop',
      data: { sensor_data: 'motion_detected', weight_change: 0.6 }
    },
    {
      device_id: 'SB002',
      event_type: 'drop',
      data: { sensor_data: 'motion_detected', weight_change: 0.4 }
    },
    {
      device_id: 'SB004',
      event_type: 'offline',
      data: { reason: 'network_disconnected', last_seen: new Date().toISOString() }
    }
  ];

  // 이벤트 데이터에 시간 간격 추가 (2시간 간격)
  return events.map((event, index) => ({
    ...event,
    timestamp: moment().subtract(index * 2, 'hours').toDate()
  }));
};

// 샘플 사용 로그 데이터
const getSampleUsageLogs = () => {
  const baseDate = moment().utc().subtract(1, 'days').startOf('day');

  const sampleUsage = {
    SB001: {
      timeSlots: [
        { hour: 0, averageDrops: 18 },
        { hour: 3, averageDrops: 12 },
        { hour: 6, averageDrops: 20 },
        { hour: 9, averageDrops: 153 },
        { hour: 12, averageDrops: 880 },
        { hour: 15, averageDrops: 132 },
        { hour: 18, averageDrops: 600 },
        { hour: 21, averageDrops: 32 }
      ]
    },
    SB002: {
      timeSlots: [
        { hour: 0, averageDrops: 16 },
        { hour: 3, averageDrops: 14 },
        { hour: 6, averageDrops: 26 },
        { hour: 9, averageDrops: 48 },
        { hour: 12, averageDrops: 70 },
        { hour: 15, averageDrops: 62 },
        { hour: 18, averageDrops: 50 },
        { hour: 21, averageDrops: 24 }
      ]
    },
    SB003: {
      timeSlots: [
        { hour: 0, averageDrops: 10 },
        { hour: 3, averageDrops: 8 },
        { hour: 6, averageDrops: 12 },
        { hour: 9, averageDrops: 28 },
        { hour: 12, averageDrops: 40 },
        { hour: 15, averageDrops: 32 },
        { hour: 18, averageDrops: 28 },
        { hour: 21, averageDrops: 22 }
      ]
    },
    SB004: {
      timeSlots: [
        { hour: 0, averageDrops: 4 },
        { hour: 3, averageDrops: 3 },
        { hour: 6, averageDrops: 53 },
        { hour: 9, averageDrops: 104 },
        { hour: 12, averageDrops: 140 },
        { hour: 15, averageDrops: 120 },
        { hour: 18, averageDrops: 86 },
        { hour: 21, averageDrops: 48 }
      ]
    },
    SB005: {
      timeSlots: [
        { hour: 0, averageDrops: 12 },
        { hour: 3, averageDrops: 10 },
        { hour: 6, averageDrops: 18 },
        { hour: 9, averageDrops: 42 },
        { hour: 12, averageDrops: 60 },
        { hour: 15, averageDrops: 48 },
        { hour: 18, averageDrops: 32 },
        { hour: 21, averageDrops: 18 }
      ]
    }
  };

  const allLogs = [];

  Object.entries(sampleUsage).forEach(([deviceId, usageData]) => {
    usageData.timeSlots.forEach(slot => {
      const periodStart = baseDate.clone().add(slot.hour, 'hours');
      const periodEnd = periodStart.clone().add(2, 'hours').add(59, 'minutes').add(59, 'seconds');

      allLogs.push({
        device_id: deviceId,
        period_start: periodStart.toDate(),
        period_end: periodEnd.toDate(),
        time_slot: slot.hour,
        drop_count: slot.averageDrops,
        full_events: 0
      });
    });
  });

  return allLogs;
};

/**
 * 데이터 시딩 메인 함수
 */
async function seedData() {
  try {
    console.log('🌱 MongoDB 초기 데이터 시딩 시작...\n');

    // MongoDB 연결
    await connectToDatabase();

    // 1. 기존 데이터 삭제 (선택사항)
    console.log('🗑️  기존 데이터 삭제 중...');
    await Device.deleteMany({});
    await Event.deleteMany({});
    await UsageLog.deleteMany({});
    console.log('✅ 기존 데이터 삭제 완료\n');

    // 2. 장치 데이터 삽입
    console.log('📦 장치 데이터 삽입 중...');
    const devices = await Device.insertMany(sampleDevices);
    console.log(`✅ ${devices.length}개 장치 삽입 완료`);
    devices.forEach(device => {
      console.log(`   - ${device.device_id}: ${device.location} (${device.status})`);
    });
    console.log();

    // 3. 이벤트 데이터 삽입
    console.log('📝 이벤트 데이터 삽입 중...');
    const events = await Event.insertMany(getSampleEvents());
    console.log(`✅ ${events.length}개 이벤트 삽입 완료`);
    console.log();

    // 4. 사용 로그 데이터 삽입
    console.log('📊 사용 로그 데이터 삽입 중...');
    const usageLogs = await UsageLog.insertMany(getSampleUsageLogs());
    console.log(`✅ ${usageLogs.length}개 사용 로그 삽입 완료`);
    console.log();

    // 5. 최종 확인
    const deviceCount = await Device.countDocuments();
    const eventCount = await Event.countDocuments();
    const logCount = await UsageLog.countDocuments();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 초기 데이터 시딩 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 총 장치: ${deviceCount}개`);
    console.log(`📝 총 이벤트: ${eventCount}개`);
    console.log(`📈 총 사용 로그: ${logCount}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 데이터 시딩 실패:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // MongoDB 연결 종료
    await closeConnection();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  seedData();
}

module.exports = seedData;

