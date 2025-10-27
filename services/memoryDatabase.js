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

  // ==================== Device 관련 메서드 ====================
  
  /**
   * 모든 장치 목록 조회
   * @returns {Array} 장치 배열
   */
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  getDevices() {
    return this.getAllDevices();
  }

  /**
   * 특정 장치 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Object|null} 장치 객체 또는 null
   */
  getDevice(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  /**
   * 장치 저장/업데이트
   * @param {Object} deviceData - 장치 데이터
   * @returns {Object} 저장된 장치 객체
   */
  saveDevice(deviceData) {
    const now = new Date().toISOString();
    const device = {
      ...deviceData,
      id: deviceData.id || uuidv4(),
      created_at: deviceData.created_at || now,
      updated_at: now
    };
    
    this.devices.set(device.device_id, device);
    return device;
  }

  // ==================== Event 관련 메서드 ====================

  /**
   * 이벤트 저장
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Object} 저장된 이벤트 객체
   */
  saveEvent(eventData) {
    const event = {
      id: uuidv4(),
      device_id: eventData.device_id,
      event_type: eventData.event_type,
      timestamp: eventData.timestamp || new Date().toISOString(),
      data: eventData.data || {}
    };

    this.events.push(event);
    
    // 시간순 정렬 (최신순)
    this.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return event;
  }

  /**
   * 특정 장치의 이벤트 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} startDate - 시작 날짜 (선택)
   * @param {string} endDate - 종료 날짜 (선택)
   * @returns {Array} 이벤트 배열
   */
  getDeviceEvents(deviceId, startDate = null, endDate = null) {
    let filteredEvents = this.events.filter(event => event.device_id === deviceId);
    
    if (startDate) {
      const start = new Date(startDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= start
      );
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= end
      );
    }
    
    return filteredEvents;
  }

  /**
   * 오늘의 투입 수 조회
   * @param {string} deviceId - 장치 ID
   * @returns {number} 오늘의 투입 수
   */
  getTodayDrops(deviceId) {
    const today = moment().format('YYYY-MM-DD');
    const todayEvents = this.getDeviceEvents(deviceId, today, today);
    return todayEvents.filter(event => event.event_type === 'drop').length;
  }

  /**
   * 가득참 이력 조회
   * @param {string} deviceId - 장치 ID
   * @param {number} limit - 조회할 이벤트 수
   * @returns {Array} 가득참 이벤트 배열
   */
  getFullHistory(deviceId, limit = 10) {
    const events = this.getDeviceEvents(deviceId);
    return events
      .filter(event => event.event_type === 'full')
      .slice(0, limit);
  }

  // ==================== Usage Log 관련 메서드 ====================

  /**
   * 30분 단위 사용현황 로그 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간 ('today', '24h', '7d', '30d')
   * @returns {Array} 사용 로그 배열
   */
  getUsageLogs(deviceId, period = 'today') {
    const { startTime, endTime } = this._calculatePeriodTime(period);
    const events = this.getDeviceEvents(
      deviceId, 
      startTime.format('YYYY-MM-DD'), 
      endTime.format('YYYY-MM-DD')
    );
    
    return this._groupEventsByPeriod(events, deviceId);
  }

  /**
   * 기간 계산 헬퍼 메서드
   * @private
   */
  _calculatePeriodTime(period) {
    const now = moment();
    let startTime, endTime;
    
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
    
    return { startTime, endTime };
  }

  /**
   * 이벤트를 30분 단위로 그룹화
   * @private
   */
  _groupEventsByPeriod(events, deviceId) {
    const logs = {};
    
    events.forEach(event => {
      const eventTime = moment(event.timestamp);
      const periodKey = this._getPeriodKey(eventTime);
      
      if (!logs[periodKey]) {
        logs[periodKey] = this._createLogEntry(periodKey, eventTime, deviceId);
      }
      
      this._incrementLogCount(logs[periodKey], event.event_type);
    });

    return Object.values(logs).sort((a, b) => 
      a.period_start.localeCompare(b.period_start)
    );
  }

  /**
   * 30분 단위 기간 키 생성
   * @private
   */
  _getPeriodKey(eventTime) {
    const minutes = eventTime.minute();
    const roundedMinutes = minutes < 30 ? 0 : 30;
    return eventTime.clone()
      .minute(roundedMinutes)
      .second(0)
      .format('YYYY-MM-DD HH:mm');
  }

  /**
   * 로그 엔트리 생성
   * @private
   */
  _createLogEntry(periodKey, eventTime, deviceId) {
    const roundedMinutes = eventTime.minute() < 30 ? 0 : 30;
    const periodEnd = eventTime.clone()
      .minute(roundedMinutes)
      .second(0)
      .add(29, 'minutes')
      .add(59, 'seconds')
      .format('YYYY-MM-DD HH:mm');

    return {
      device_id: deviceId,
      period_start: periodKey,
      period_end: periodEnd,
      drop_count: 0,
      full_events: 0
    };
  }

  /**
   * 로그 카운트 증가
   * @private
   */
  _incrementLogCount(logEntry, eventType) {
    if (eventType === 'drop') {
      logEntry.drop_count++;
    } else if (eventType === 'full') {
      logEntry.full_events++;
    }
  }

  // ==================== 초기 데이터 로드 ====================

  /**
   * 초기 샘플 데이터 로드
   * @private
   */
  initializeSampleData() {
    try {
      this._loadSampleDevices();
      this._loadSampleEvents();
      
      console.log('✅ 메모리 데이터베이스 초기화 완료');
      console.log(`📊 장치 ${this.devices.size}개, 이벤트 ${this.events.length}개 로드됨`);
    } catch (error) {
      console.error('❌ 샘플 데이터 초기화 오류:', error.message);
      console.log('⚠️  빈 데이터베이스로 시작합니다.');
    }
  }

  /**
   * 샘플 장치 데이터 로드
   * @private
   */
  _loadSampleDevices() {
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

    sampleDevices.forEach(device => {
      this.saveDevice(device);
    });
  }

  /**
   * 샘플 이벤트 데이터 로드
   * @private
   */
  _loadSampleEvents() {
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
  }

  // ==================== 통계 정보 ====================

  /**
   * 통계 정보 조회
   * @returns {Object} 통계 정보
   */
  getStats() {
    return {
      total_devices: this.devices.size,
      total_events: this.events.length,
      active_devices: this._countDevicesByStatus('active'),
      maintenance_devices: this._countDevicesByStatus('maintenance'),
      offline_devices: this._countDevicesByStatus('offline')
    };
  }

  /**
   * 상태별 장치 수 카운트
   * @private
   */
  _countDevicesByStatus(status) {
    return Array.from(this.devices.values())
      .filter(device => device.status === status).length;
  }
}

module.exports = new MemoryDatabase();
