const { connectToDatabase } = require('./mongodb/connection');
const Device = require('./mongodb/models/Device');
const Event = require('./mongodb/models/Event');
const UsageLog = require('./mongodb/models/UsageLog');
const moment = require('moment');

/**
 * MongoDB 기반 데이터베이스
 * MongoDB Atlas를 사용한 영구 데이터 저장소
 */
class MongoDatabase {
  constructor() {
    this.initialized = false;
  }

  /**
   * 데이터베이스 연결 확인 및 초기화
   * @private
   */
  async _ensureConnection() {
    if (!this.initialized) {
      await connectToDatabase();
      this.initialized = true;
    }
  }

  // ==================== Device 관련 메서드 ====================

  /**
   * 모든 장치 목록 조회
   * @returns {Promise<Array>} 장치 배열
   */
  async getAllDevices() {
    await this._ensureConnection();
    
    try {
      const devices = await Device.find().lean();
      
      // MongoDB _id를 id로 변환하고 fill_percentage 계산
      return devices.map(device => ({
        ...device,
        id: device._id.toString(),
        fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10,
        _id: undefined
      }));
    } catch (error) {
      console.error('장치 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 모든 장치 목록 조회 (별칭)
   * @returns {Promise<Array>} 장치 배열
   */
  async getDevices() {
    return this.getAllDevices();
  }

  /**
   * 특정 장치 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object|null>} 장치 객체 또는 null
   */
  async getDevice(deviceId) {
    await this._ensureConnection();
    
    try {
      const device = await Device.findOne({ device_id: deviceId }).lean();
      
      if (!device) {
        return null;
      }
      
      return {
        ...device,
        id: device._id.toString(),
        fill_percentage: Math.round((device.current_level * 100.0 / device.capacity) * 10) / 10,
        _id: undefined
      };
    } catch (error) {
      console.error('장치 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 장치 저장/업데이트
   * @param {Object} deviceData - 장치 데이터
   * @returns {Promise<Object>} 저장된 장치 객체
   */
  async saveDevice(deviceData) {
    await this._ensureConnection();
    
    try {
      const now = new Date();
      
      // fill_percentage 계산
      const fillPercentage = deviceData.capacity > 0
        ? Math.round((deviceData.current_level * 100.0 / deviceData.capacity) * 10) / 10
        : 0;
      
      // device_id로 upsert
      const device = await Device.findOneAndUpdate(
        { device_id: deviceData.device_id },
        {
          ...deviceData,
          fill_percentage: fillPercentage,
          updated_at: now
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      ).lean();
      
      return {
        ...device,
        id: device._id.toString(),
        _id: undefined
      };
    } catch (error) {
      console.error('장치 저장 오류:', error);
      throw error;
    }
  }

  // ==================== Event 관련 메서드 ====================

  /**
   * 이벤트 저장
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Promise<Object>} 저장된 이벤트 객체
   */
  async saveEvent(eventData) {
    await this._ensureConnection();
    
    try {
      const event = new Event({
        device_id: eventData.device_id,
        event_type: eventData.event_type,
        timestamp: eventData.timestamp || new Date(),
        data: eventData.data || {}
      });
      
      await event.save();
      
      return {
        id: event._id.toString(),
        device_id: event.device_id,
        event_type: event.event_type,
        timestamp: event.timestamp.toISOString(),
        data: event.data
      };
    } catch (error) {
      console.error('이벤트 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 장치의 이벤트 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} startDate - 시작 날짜 (선택)
   * @param {string} endDate - 종료 날짜 (선택)
   * @returns {Promise<Array>} 이벤트 배열
   */
  async getDeviceEvents(deviceId, startDate = null, endDate = null) {
    await this._ensureConnection();
    
    try {
      const query = { device_id: deviceId };
      
      // 날짜 필터 추가
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }
      
      const events = await Event.find(query)
        .sort({ timestamp: -1 })
        .lean();
      
      return events.map(event => ({
        id: event._id.toString(),
        device_id: event.device_id,
        event_type: event.event_type,
        timestamp: event.timestamp.toISOString(),
        data: event.data
      }));
    } catch (error) {
      console.error('장치 이벤트 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 오늘의 투입 수 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<number>} 오늘의 투입 수
   */
  async getTodayDrops(deviceId) {
    await this._ensureConnection();
    
    try {
      const today = moment().startOf('day').toDate();
      const tomorrow = moment().add(1, 'day').startOf('day').toDate();
      
      const count = await Event.countDocuments({
        device_id: deviceId,
        event_type: 'drop',
        timestamp: {
          $gte: today,
          $lt: tomorrow
        }
      });
      
      return count;
    } catch (error) {
      console.error('오늘의 투입 수 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 가득함 이력 조회
   * @param {string} deviceId - 장치 ID
   * @param {number} limit - 조회할 이벤트 수
   * @returns {Promise<Array>} 가득참 이벤트 배열
   */
  async getFullHistory(deviceId, limit = 10) {
    await this._ensureConnection();
    
    try {
      const events = await Event.find({
        device_id: deviceId,
        event_type: 'full'
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return events.map(event => ({
        id: event._id.toString(),
        device_id: event.device_id,
        event_type: event.event_type,
        timestamp: event.timestamp.toISOString(),
        data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data)
      }));
    } catch (error) {
      console.error('가득참 이력 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 이벤트 추가
   * @param {Object} eventData - 이벤트 데이터
   * @returns {Promise<Object>} 추가된 이벤트
   */
  async addEvent(eventData) {
    await this._ensureConnection();
    
    try {
      const event = new Event({
        device_id: eventData.device_id,
        event_type: eventData.event_type,
        data: eventData.data,
        timestamp: eventData.timestamp || new Date()
      });
      
      await event.save();
      
      return {
        id: event._id.toString(),
        device_id: event.device_id,
        event_type: event.event_type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        created_at: event.timestamp.toISOString()
      };
    } catch (error) {
      console.error('이벤트 추가 오류:', error);
      throw error;
    }
  }

  // ==================== Usage Log 관련 메서드 ====================

  /**
   * 30분 단위 사용현황 로그 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간 ('today', '24h', '7d', '30d')
   * @returns {Promise<Array>} 사용 로그 배열
   */
  async getUsageLogs(deviceId, period = 'today') {
    await this._ensureConnection();
    
    try {
      const normalizedPeriod = typeof period === 'string' ? period.toLowerCase() : period;
      
      // 주간 데이터는 UsageLog 컬렉션에서 조회 (미리 집계된 데이터)
      if (normalizedPeriod === '7d' || normalizedPeriod === 'week' || normalizedPeriod === 'weekly') {
        const logs = await UsageLog.find({ device_id: deviceId })
          .sort({ period_start: 1 })
          .lean();
        
        if (logs.length > 0) {
          return logs.map(log => ({
            device_id: log.device_id,
            period_start: moment(log.period_start).format('YYYY-MM-DD HH:mm'),
            period_end: moment(log.period_end).format('YYYY-MM-DD HH:mm'),
            drop_count: log.drop_count,
            full_events: log.full_events
          }));
        }
      }
      
      // 실시간 집계
      const { startTime, endTime } = this._calculatePeriodTime(period);
      
      const events = await Event.find({
        device_id: deviceId,
        timestamp: {
          $gte: startTime.toDate(),
          $lte: endTime.toDate()
        }
      })
        .sort({ timestamp: 1 })
        .lean();
      
      return this._groupEventsByPeriod(events, deviceId);
    } catch (error) {
      console.error('사용현황 로그 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 장치별 사용 요약 정보 조회
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object|null>} 장치 사용 요약 정보
   */
  async getDeviceUsageSummary(deviceId) {
    await this._ensureConnection();
    
    try {
      // UsageLog에서 집계 데이터 조회
      const logs = await UsageLog.find({ device_id: deviceId }).lean();
      
      if (logs.length === 0) {
        return null;
      }
      
      // 일일 평균 계산
      const totalDrops = logs.reduce((sum, log) => sum + log.drop_count, 0);
      const dailyAverage = Math.round((totalDrops / 7) * 10) / 10;
      
      // 이번 주 vs 지난 주 계산 (더미 데이터)
      const currentWeekDrops = Math.round(totalDrops);
      const previousWeekDrops = Math.round(totalDrops * 0.85); // 임시 계산
      const growthRate = previousWeekDrops > 0
        ? Math.round(((currentWeekDrops - previousWeekDrops) / previousWeekDrops) * 1000) / 10
        : 0;
      
      // 피크 시간대 찾기
      const peakLog = logs.reduce((prev, curr) =>
        curr.drop_count > prev.drop_count ? curr : prev
      );
      
      const device = await this.getDevice(deviceId);
      
      return {
        device_id: deviceId,
        location: device ? device.location : null,
        daily_average: dailyAverage,
        current_week_drops: currentWeekDrops,
        previous_week_drops: previousWeekDrops,
        growth_rate: growthRate,
        peak_time_slot: {
          hour: peakLog.time_slot,
          label: `${peakLog.time_slot.toString().padStart(2, '0')}:00`
        }
      };
    } catch (error) {
      console.error('장치 사용 요약 조회 오류:', error);
      return null;
    }
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

  // ==================== 통계 정보 ====================

  /**
   * 통계 정보 조회
   * @returns {Promise<Object>} 통계 정보
   */
  async getStats() {
    await this._ensureConnection();
    
    try {
      const totalDevices = await Device.countDocuments();
      const totalEvents = await Event.countDocuments();
      const activeDevices = await Device.countDocuments({ status: 'active' });
      const maintenanceDevices = await Device.countDocuments({ status: 'maintenance' });
      const offlineDevices = await Device.countDocuments({ status: 'offline' });
      
      return {
        total_devices: totalDevices,
        total_events: totalEvents,
        active_devices: activeDevices,
        maintenance_devices: maintenanceDevices,
        offline_devices: offlineDevices
      };
    } catch (error) {
      console.error('통계 정보 조회 오류:', error);
      throw error;
    }
  }
}

module.exports = new MongoDatabase();

