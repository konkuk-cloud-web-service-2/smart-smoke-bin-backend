const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// AWS S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'smart-smoke-bin-data';

class S3Database {
  constructor() {
    this.bucketName = BUCKET_NAME;
  }

  // S3에서 JSON 파일 읽기
  async getObject(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      return JSON.parse(data);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return null; // 파일이 없으면 null 반환
      }
      throw error;
    }
  }

  // S3에 JSON 파일 저장
  async putObject(key, data) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });
    return await s3Client.send(command);
  }

  // 장치 목록 조회
  async getDevices() {
    const devices = await this.getObject('devices.json') || [];
    return devices;
  }

  // 특정 장치 조회
  async getDevice(deviceId) {
    const devices = await this.getDevices();
    return devices.find(device => device.device_id === deviceId);
  }

  // 장치 저장/업데이트
  async saveDevice(deviceData) {
    const devices = await this.getDevices();
    const existingIndex = devices.findIndex(device => device.device_id === deviceData.device_id);
    
    if (existingIndex >= 0) {
      devices[existingIndex] = { ...devices[existingIndex], ...deviceData, updated_at: new Date().toISOString() };
    } else {
      devices.push({
        ...deviceData,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    await this.putObject('devices.json', devices);
    return devices.find(device => device.device_id === deviceData.device_id);
  }

  // 이벤트 저장
  async saveEvent(eventData) {
    const event = {
      id: uuidv4(),
      device_id: eventData.device_id,
      event_type: eventData.event_type,
      timestamp: new Date().toISOString(),
      data: eventData.data || {}
    };

    // 이벤트를 날짜별로 저장 (YYYY-MM-DD/events.json)
    const date = moment().format('YYYY-MM-DD');
    const eventsKey = `events/${date}/events.json`;
    
    const events = await this.getObject(eventsKey) || [];
    events.push(event);
    
    await this.putObject(eventsKey, events);
    return event;
  }

  // 특정 장치의 이벤트 조회
  async getDeviceEvents(deviceId, startDate = null, endDate = null) {
    const events = [];
    
    if (!startDate) {
      startDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
    }
    if (!endDate) {
      endDate = moment().format('YYYY-MM-DD');
    }

    const currentDate = moment(startDate);
    const endDateMoment = moment(endDate);

    while (currentDate.isSameOrBefore(endDateMoment)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const eventsKey = `events/${dateStr}/events.json`;
      
      try {
        const dayEvents = await this.getObject(eventsKey) || [];
        const deviceEvents = dayEvents.filter(event => event.device_id === deviceId);
        events.push(...deviceEvents);
      } catch (error) {
        // 해당 날짜의 이벤트 파일이 없으면 무시
      }
      
      currentDate.add(1, 'day');
    }

    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // 오늘의 투입 수 조회
  async getTodayDrops(deviceId) {
    const today = moment().format('YYYY-MM-DD');
    const events = await this.getDeviceEvents(deviceId, today, today);
    return events.filter(event => event.event_type === 'drop').length;
  }

  // 가득참 이력 조회
  async getFullHistory(deviceId, limit = 10) {
    const events = await this.getDeviceEvents(deviceId);
    return events
      .filter(event => event.event_type === 'full')
      .slice(0, limit);
  }

  // 30분 단위 사용현황 로그 조회
  async getUsageLogs(deviceId, period = 'today') {
    let startTime, endTime;
    const now = moment();
    
    switch (period) {
      case 'today':
        // 당일 00:00부터 현재까지
        startTime = now.clone().startOf('day');
        endTime = now.clone();
        break;
      case '24h':
        startTime = now.clone().subtract(24, 'hours');
        endTime = now.clone();
        break;
      case '7d':
        startTime = now.clone().subtract(7, 'days');
        endTime = now.clone();
        break;
      case '30d':
        startTime = now.clone().subtract(30, 'days');
        endTime = now.clone();
        break;
      default:
        startTime = now.clone().startOf('day');
        endTime = now.clone();
    }

    const events = await this.getDeviceEvents(deviceId, startTime.format('YYYY-MM-DD'), endTime.format('YYYY-MM-DD'));
    
    // 30분 단위로 그룹화 (정확한 30분 단위)
    const logs = {};
    events.forEach(event => {
      const eventTime = moment(event.timestamp);
      
      // 30분 단위로 반올림 (00:00-00:29 → 00:00, 00:30-00:59 → 00:30)
      const minutes = eventTime.minute();
      const roundedMinutes = minutes < 30 ? 0 : 30;
      const periodKey = eventTime.clone().minute(roundedMinutes).second(0).format('YYYY-MM-DD HH:mm');
      
      if (!logs[periodKey]) {
        logs[periodKey] = {
          device_id: deviceId,
          period_start: periodKey,
          period_end: eventTime.clone().minute(roundedMinutes).second(0).add(29, 'minutes').add(59, 'seconds').format('YYYY-MM-DD HH:mm'),
          drop_count: 0,
          full_events: 0
        };
      }
      
      if (event.event_type === 'drop') {
        logs[periodKey].drop_count++;
      } else if (event.event_type === 'full') {
        logs[periodKey].full_events++;
      }
    });

    // 시간순으로 정렬 (오래된 것부터)
    return Object.values(logs).sort((a, b) => a.period_start.localeCompare(b.period_start));
  }

  // 샘플 데이터 초기화
  async initializeSampleData() {
    const sampleDevices = [
      {
        device_id: 'SB001',
        location: '강남역 1번 출구',
        latitude: 37.4979,
        longitude: 127.0276,
        status: 'active',
        capacity: 100,
        current_level: 45
      },
      {
        device_id: 'SB002',
        location: '홍대입구역 2번 출구',
        latitude: 37.5563,
        longitude: 126.9226,
        status: 'active',
        capacity: 100,
        current_level: 78
      },
      {
        device_id: 'SB003',
        location: '명동역 3번 출구',
        latitude: 37.5636,
        longitude: 126.9826,
        status: 'maintenance',
        capacity: 100,
        current_level: 0
      },
      {
        device_id: 'SB004',
        location: '잠실역 1번 출구',
        latitude: 37.5133,
        longitude: 127.1028,
        status: 'offline',
        capacity: 100,
        current_level: 0
      }
    ];

    // 기존 데이터가 있는지 확인
    const existingDevices = await this.getDevices();
    if (existingDevices.length === 0) {
      await this.putObject('devices.json', sampleDevices);
      console.log('샘플 장치 데이터가 초기화되었습니다.');
    }
  }
}

module.exports = new S3Database();
