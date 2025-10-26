const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * 메모리 기반 데이터베이스
 * HashMap과 List를 사용한 간단한 인메모리 저장소
 */
class MemoryDatabase {
  constructor() {
    try {
      // 장치 데이터 저장 (HashMap: device_id -> device_data)
      this.devices = new Map();
      
      // 이벤트 데이터 저장 (List: 시간순 정렬)
      this.events = [];
      
      // 사용 로그 저장 (HashMap: device_id -> usage_logs[])
      this.usageLogs = new Map();
      
      // 초기 샘플 데이터 로드
      this.initializeSampleData();
    } catch (error) {
      console.error('❌ MemoryDatabase 초기화 오류:', error.message);
      // 기본값으로 초기화
      this.devices = new Map();
      this.events = [];
      this.usageLogs = new Map();
    }
  }

  // 장치 목록 조회
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  // 특정 장치 조회
  getDevice(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  // 장치 저장/업데이트
  saveDevice(deviceData) {
    const device = {
      ...deviceData,
      id: deviceData.id || uuidv4(),
      created_at: deviceData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.devices.set(device.device_id, device);
    return device;
  }

  // 이벤트 저장
  saveEvent(eventData) {
    const event = {
      id: uuidv4(),
      device_id: eventData.device_id,
      event_type: eventData.event_type,
      timestamp: new Date().toISOString(),
      data: eventData.data || {}
    };

    this.events.push(event);
    
    // 시간순 정렬 (최신순)
    this.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return event;
  }

  // 특정 장치의 이벤트 조회
  getDeviceEvents(deviceId, startDate = null, endDate = null) {
    let filteredEvents = this.events.filter(event => event.device_id === deviceId);
    
    if (startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= new Date(endDate)
      );
    }
    
    return filteredEvents;
  }

  // 오늘의 투입 수 조회
  getTodayDrops(deviceId) {
    const today = moment().format('YYYY-MM-DD');
    const todayEvents = this.getDeviceEvents(deviceId, today, today);
    return todayEvents.filter(event => event.event_type === 'drop').length;
  }

  // 가득참 이력 조회
  getFullHistory(deviceId, limit = 10) {
    const events = this.getDeviceEvents(deviceId);
    return events
      .filter(event => event.event_type === 'full')
      .slice(0, limit);
  }

  // 30분 단위 사용현황 로그 조회
  getUsageLogs(deviceId, period = 'today') {
    let startTime, endTime;
    const now = moment();
    
    switch (period) {
      case 'today':
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

    const events = this.getDeviceEvents(
      deviceId, 
      startTime.format('YYYY-MM-DD'), 
      endTime.format('YYYY-MM-DD')
    );
    
    // 30분 단위로 그룹화
    const logs = {};
    events.forEach(event => {
      const eventTime = moment(event.timestamp);
      
      // 30분 단위로 반올림
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

    // 시간순으로 정렬
    return Object.values(logs).sort((a, b) => a.period_start.localeCompare(b.period_start));
  }

  // 초기 샘플 데이터 로드
  initializeSampleData() {
    try {
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
        status: 'maintenance',
        capacity: 100,
        current_level: 0,
        fill_percentage: 0.0
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

    // 장치 데이터 로드
    sampleDevices.forEach(device => {
      this.saveDevice(device);
    });

    // 샘플 이벤트 데이터
    const sampleEvents = [
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

    // 이벤트 데이터 로드 (시간 간격을 두고)
    sampleEvents.forEach((event, index) => {
      const eventTime = moment().subtract(index * 2, 'hours');
      this.saveEvent({
        ...event,
        timestamp: eventTime.toISOString()
      });
    });

      console.log('✅ 메모리 데이터베이스 초기화 완료');
      console.log(`📊 장치 ${this.devices.size}개, 이벤트 ${this.events.length}개 로드됨`);
    } catch (error) {
      console.error('❌ 샘플 데이터 초기화 오류:', error.message);
      console.log('⚠️  빈 데이터베이스로 시작합니다.');
    }
  }

  // 통계 정보 조회
  getStats() {
    return {
      total_devices: this.devices.size,
      total_events: this.events.length,
      active_devices: Array.from(this.devices.values()).filter(d => d.status === 'active').length,
      maintenance_devices: Array.from(this.devices.values()).filter(d => d.status === 'maintenance').length,
      offline_devices: Array.from(this.devices.values()).filter(d => d.status === 'offline').length
    };
  }
}

module.exports = new MemoryDatabase();
