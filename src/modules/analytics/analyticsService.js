const mongoDatabase = require('../../../services/mongoDatabase');
const moment = require('moment');

/**
 * 데이터 분석 서비스
 * 사용 패턴 분석, 통계 생성, 리포트 기능 제공
 */
class AnalyticsService {
  /**
   * 30분 단위 사용현황 로그 조회
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간 (today, 24h, 7d, 30d)
   * @returns {Promise<Object>} 사용현황 로그
   */
  async getUsageLogs(deviceId, period = 'today') {
    try {
      // return await mongoDatabase.getUsageLogs(deviceId, period);
      const logs = await mongoDatabase.getUsageLogs(deviceId, period);
      const summary = mongoDatabase.getDeviceUsageSummary(deviceId);

      return {
        logs,
        summary
      };
    } catch (error) {
      console.error('사용현황 로그 조회 오류:', error);
      throw new Error('사용현황 로그를 조회할 수 없습니다.');
    }
  }

  /**
   * 시간대별 사용 패턴 분석 (3시간 텀)
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간
   * @returns {Promise<Object>} 시간대별 패턴
   */
  async getHourlyUsagePattern(deviceId, period = '7d') {
    try {
      const {logs, summary} = await this.getUsageLogs(deviceId, period);
      
      // 3시간 텀으로 그룹화 (00, 03, 06, 09, 12, 15, 18, 21)
      const timeSlotStats = {};
      const timeSlots = [0, 3, 6, 9, 12, 15, 18, 21];
      
      // 초기화
      timeSlots.forEach(slot => {
        timeSlotStats[slot] = { 
          time_slot: slot, 
          drop_count: 0, 
          full_events: 0,
          label: `${slot.toString().padStart(2, '0')}`
        };
      });
      
      logs.forEach(log => {
        const hour = moment(log.period_start).hour();
        // 시간을 3시간 텀으로 매핑
        let timeSlot;
        if (hour >= 0 && hour < 3) timeSlot = 0;
        else if (hour >= 3 && hour < 6) timeSlot = 3;
        else if (hour >= 6 && hour < 9) timeSlot = 6;
        else if (hour >= 9 && hour < 12) timeSlot = 9;
        else if (hour >= 12 && hour < 15) timeSlot = 12;
        else if (hour >= 15 && hour < 18) timeSlot = 15;
        else if (hour >= 18 && hour < 21) timeSlot = 18;
        else timeSlot = 21;
        
        timeSlotStats[timeSlot].drop_count += log.drop_count;
        timeSlotStats[timeSlot].full_events += log.full_events;
      });

      const peakTimeSlot = summary && summary.peak_time_slot
      ? summary.peak_time_slot.hour
      : this._findPeakTimeSlot(timeSlotStats);


      return {
        device_id: deviceId,
        period,
        time_pattern: Object.values(timeSlotStats).sort((a, b) => a.time_slot - b.time_slot),
        // peak_time_slot: this._findPeakTimeSlot(timeSlotStats),
        peak_time_slot: peakTimeSlot,
        peak_time_label: summary && summary.peak_time_slot ? summary.peak_time_slot.label : null,
        total_drops: Object.values(timeSlotStats).reduce((sum, stat) => sum + stat.drop_count, 0)
      };
    } catch (error) {
      console.error('시간대별 패턴 분석 오류:', error);
      throw new Error('시간대별 사용 패턴을 분석할 수 없습니다.');
    }
  }

  /**
   * 피크 시간 슬롯 찾기
   * @param {Object} timeSlotStats - 시간 슬롯별 통계
   * @returns {number} 피크 시간 슬롯
   */
  _findPeakTimeSlot(timeSlotStats) {
    let peakTimeSlot = 0;
    let maxDrops = 0;
    
    Object.values(timeSlotStats).forEach(stat => {
      if (stat.drop_count > maxDrops) {
        maxDrops = stat.drop_count;
        peakTimeSlot = stat.time_slot;
      }
    });
    
    return peakTimeSlot;
  }

  /**
   * 지역별 수거량 분석 (구 단위)
   * @param {string} period - 기간
   * @returns {Promise<Array>} 지역별 통계
   */
  async getRegionalAnalysis(period = '7d') {
    try {
      // 더미 데이터 생성
      const dummyData = this._generateDummyMetrics();
      
      // 지역별 더미 데이터 반환
      return this._generateRegionalDummyData(dummyData.regional_dummy);
    } catch (error) {
      console.error('지역별 분석 오류:', error);
      throw new Error('지역별 수거량을 분석할 수 없습니다.');
    }
  }

  /**
   * 위치에서 구 추출
   * @param {string} location - 위치 정보
   * @returns {string} 구 이름
   */
  _extractDistrict(location) {
    // 위치 정보에서 구 추출 로직
    const districtMap = {
      '강남역': '강남구',
      '역삼역': '강남구',
      '서초역': '서초구',
      '송파역': '송파구',
      '마포역': '마포구',
      '용산역': '용산구'
    };

    // 기본값은 강남구
    let district = '강남구';
    
    for (const [key, value] of Object.entries(districtMap)) {
      if (location.includes(key)) {
        district = value;
        break;
      }
    }
    
    return district;
  }

  /**
   * 더미 메트릭 데이터 생성
   * @returns {Object} 더미 메트릭 데이터
   */
  _generateDummyMetrics() {
    // 프로토타입 이미지에 맞는 더미 데이터
    return {
      complaint_reduction_rate: {
        current: 42.3,
        previous_month: 29.8,
        change: 12.5,
        trend: 'increasing'
      },
      device_utilization_rate: {
        current: 87.2,
        average: 81.9,
        change: 5.3,
        trend: 'increasing'
      },
      // 시간대별 사용 패턴 더미 데이터 (3시간 텀 순서: 00, 03, 06, 09, 12, 15, 18, 21)
      time_pattern_dummy: [450, 230, 670, 1890, 3120, 2670, 2340, 1560],
      // 지역별 수거량 더미 데이터 (강남구, 서초구, 송파구, 마포구, 용산구)
      regional_dummy: [4234, 3891, 3456, 2987, 2654]
    };
  }

  /**
   * 지역별 더미 데이터 생성
   * @param {Array} regionalDummy - 지역별 수거량 더미 데이터
   * @returns {Array} 지역별 통계 데이터
   */
  _generateRegionalDummyData(regionalDummy) {
    const districtNames = ['강남구', '서초구', '송파구', '마포구', '용산구'];
    
    return regionalDummy.map((drops, index) => ({
      district_name: districtNames[index],
      total_drops: drops,
      device_count: Math.floor(Math.random() * 5) + 3, // 3-7개 장치
      avg_drops_per_device: Math.round(drops / (Math.floor(Math.random() * 5) + 3) * 10) / 10,
      devices: []
    })).sort((a, b) => b.total_drops - a.total_drops);
  }

  /**
   * 주요 인사이트 더미 데이터 생성
   * @returns {Array} 인사이트 데이터
   */
  _generateInsightsData() {
    return [
      {
        id: 1,
        type: "usage_pattern",
        title: "점심시간 사용량 급증",
        description: "12-14시 사이 평균 대비 2.3배 높은 사용률을 보입니다",
        severity: "info",
        impact: "high",
        recommendation: "점심시간대 추가 수거 빈도 고려 필요",
        data: {
          peak_hours: "12-14시",
          multiplier: 2.3,
          average_usage: 156,
          peak_usage: 312
        }
      },
      {
        id: 2,
        type: "capacity_management",
        title: "강남구 추가 설치 필요",
        description: "강남구의 포화율이 다른 지역 대비 1.8배 높습니다",
        severity: "warning",
        impact: "medium",
        recommendation: "강남구 내 추가 스마트 빈 설치 검토",
        data: {
          district: "강남구",
          saturation_rate: 1.8,
          current_devices: 5,
          recommended_devices: 8
        }
      },
      {
        id: 3,
        type: "effectiveness",
        title: "민원 감소 효과 확인",
        description: "스마트 빈 설치 후 해당 지역 민원이 42% 감소했습니다",
        severity: "success",
        impact: "high",
        recommendation: "다른 지역으로 확산 검토",
        data: {
          complaint_reduction: 42.3,
          before_installation: 156,
          after_installation: 90,
          period: "3개월"
        }
      },
      {
        id: 4,
        type: "maintenance",
        title: "예방적 유지보수 필요",
        description: "SB003 장치의 포화 빈도가 평균 대비 1.5배 높습니다",
        severity: "warning",
        impact: "medium",
        recommendation: "해당 장치 점검 및 용량 확대 검토",
        data: {
          device_id: "SB003",
          full_frequency: 1.5,
          average_full_events: 2.3,
          device_full_events: 3.5
        }
      },
      {
        id: 5,
        type: "efficiency",
        title: "수거 효율성 개선",
        description: "주간 수거량이 전주 대비 15% 증가했습니다",
        severity: "success",
        impact: "medium",
        recommendation: "현재 운영 방식 유지 및 모니터링 강화",
        data: {
          weekly_growth: 15.0,
          previous_week: 1200,
          current_week: 1380,
          trend: "increasing"
        }
      }
    ];
  }

  /**
   * 주간 사용률 분석
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 주간 사용률
   */
  async getWeeklyUsageRate(deviceId) {
    try {
      // const currentWeek = await this.getUsageLogs(deviceId, '7d');
      // const previousWeek = await this.getUsageLogs(deviceId, '7d'); // 이전 주 데이터는 별도 로직 필요
      
      // const currentTotal = currentWeek.reduce((sum, log) => sum + log.drop_count, 0);
      // const previousTotal = previousWeek.reduce((sum, log) => sum + log.drop_count, 0);
      
      // const growthRate = previousTotal > 0 
      //   ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100 * 10) / 10
      //   : 0;
      const summary = mongoDatabase.getDeviceUsageSummary(deviceId);

      if (!summary) {
        return {
          device_id: deviceId,
          current_week_drops: 0,
          previous_week_drops: 0,
          growth_rate: 0,
          trend: 'stable'
        };
      }

      const { current_week_drops, previous_week_drops, growth_rate } = summary;
      
      return {
        device_id: deviceId,
        current_week_drops,
        previous_week_drops,
        growth_rate,
        trend: growth_rate > 0 ? 'increasing' : growth_rate < 0 ? 'decreasing' : 'stable'
      };
    } catch (error) {
      console.error('주간 사용률 분석 오류:', error);
      throw new Error('주간 사용률을 분석할 수 없습니다.');
    }
  }

  /**
   * 일 평균 수거량 계산
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간
   * @returns {Promise<number>} 일 평균 수거량
   */
  async getDailyAverage(deviceId, period = '7d') {
    try {
      // const logs = await this.getUsageLogs(deviceId, period);
      // const totalDrops = logs.reduce((sum, log) => sum + log.drop_count, 0);
      // const days = period === '7d' ? 7 : period === '30d' ? 30 : 1;
      
      // return Math.round((totalDrops / days) * 10) / 10;
      const summary = mongoDatabase.getDeviceUsageSummary(deviceId);

      if (!summary) {
        return 0;
      }

      if (period === '30d') {
        // 7일 평균을 기반으로 30일 추정값 계산
        return Math.round(((summary.daily_average * 30) / 7) * 10) / 10;
      }

      return summary.daily_average;
      
    } catch (error) {
      console.error('일 평균 수거량 계산 오류:', error);
      throw new Error('일 평균 수거량을 계산할 수 없습니다.');
    }
  }

  /**
   * 개요 페이지용 통합 대시보드 데이터
   * @returns {Promise<Object>} 대시보드 데이터
   */
  async getDashboardOverview() {
    try {
      const devices = await mongoDatabase.getDevices();
      
      // 더미 데이터 생성
      const dummyData = this._generateDummyMetrics();
      
      // 전체 장치의 시간대별 사용 패턴 (3시간 텀) - 더미 데이터 사용
      const allDevicesTimePattern = {};
      const timeSlots = [0, 3, 6, 9, 12, 15, 18, 21];
      
      // 더미 데이터로 초기화
      timeSlots.forEach((slot, index) => {
        allDevicesTimePattern[slot] = { 
          time_slot: slot, 
          count: dummyData.time_pattern_dummy[index],
          label: `${slot.toString().padStart(2, '0')}`
        };
      });

      // 지역별 수거량 (구 단위) - 더미 데이터 사용
      const regionalData = this._generateRegionalDummyData(dummyData.regional_dummy);

      // 전체 통계
      const totalDrops = Object.values(allDevicesTimePattern).reduce((sum, stat) => sum + stat.count, 0);
      const activeDevices = devices.filter(d => d.status === 'active').length;
      const totalDevices = devices.length;

      return {
        time_pattern: Object.values(allDevicesTimePattern).sort((a, b) => a.time_slot - b.time_slot),
        regional_collection: regionalData,
        summary: {
          total_drops: totalDrops,
          active_devices: activeDevices,
          total_devices: totalDevices,
          device_utilization_rate: Math.round((activeDevices / totalDevices) * 100 * 10) / 10
        },
        metrics: {
          complaint_reduction_rate: dummyData.complaint_reduction_rate,
          device_utilization_rate: dummyData.device_utilization_rate,
          total_collection_volume: totalDrops,
          device_status: {
            active: activeDevices,
            full: devices.filter(d => d.status === 'full').length,
            offline: devices.filter(d => d.status === 'offline').length,
            total: totalDevices
          }
        }
      };
    } catch (error) {
      console.error('대시보드 데이터 생성 오류:', error);
      throw new Error('대시보드 데이터를 생성할 수 없습니다.');
    }
  }

  /**
   * 전체 장치들의 시간대별 사용 패턴 분석 (3시간 텀)
   * @param {string} period - 기간 (today, 24h, 7d, 30d)
   * @returns {Promise<Object>} 전체 장치 시간대별 패턴
   */
  async getAllDevicesTimePattern(period = '7d') {
    try {
      const devices = await mongoDatabase.getDevices();
      
      // 더미 데이터 생성
      const dummyData = this._generateDummyMetrics();
      
      // 3시간 텀으로 그룹화 (00, 03, 06, 09, 12, 15, 18, 21)
      const timeSlotStats = {};
      const timeSlots = [0, 3, 6, 9, 12, 15, 18, 21];
      
      // 더미 데이터로 초기화
      timeSlots.forEach((slot, index) => {
        timeSlotStats[slot] = { 
          time_slot: slot, 
          total_drops: dummyData.time_pattern_dummy[index], 
          total_full_events: Math.floor(dummyData.time_pattern_dummy[index] / 100), // 포화 이벤트는 투입량의 1%로 설정
          device_count: devices.length,
          label: `${slot.toString().padStart(2, '0')}:00-${(slot + 3).toString().padStart(2, '0')}:00`,
          avg_drops_per_device: Math.round((dummyData.time_pattern_dummy[index] / devices.length) * 10) / 10,
          avg_full_events_per_device: Math.round((Math.floor(dummyData.time_pattern_dummy[index] / 100) / devices.length) * 10) / 10
        };
      });

      const timePattern = Object.values(timeSlotStats).sort((a, b) => a.time_slot - b.time_slot);
      const totalDrops = timePattern.reduce((sum, stat) => sum + stat.total_drops, 0);
      const peakTimeSlot = this._findPeakTimeSlotForAllDevices(timeSlotStats);

      return {
        period,
        total_devices: devices.length,
        time_pattern: timePattern,
        peak_time_slot: peakTimeSlot,
        total_drops: totalDrops,
        summary: {
          most_active_time: peakTimeSlot,
          least_active_time: this._findLeastActiveTimeSlot(timeSlotStats),
          peak_drops: Math.max(...timePattern.map(stat => stat.total_drops)),
          total_periods: timePattern.length
        }
      };
    } catch (error) {
      console.error('전체 장치 시간대별 패턴 분석 오류:', error);
      throw new Error('전체 장치의 시간대별 사용 패턴을 분석할 수 없습니다.');
    }
  }

  /**
   * 전체 장치 중 피크 시간 슬롯 찾기
   * @param {Object} timeSlotStats - 시간 슬롯별 통계
   * @returns {Object} 피크 시간 슬롯 정보
   */
  _findPeakTimeSlotForAllDevices(timeSlotStats) {
    let peakTimeSlot = 0;
    let maxDrops = 0;
    
    Object.values(timeSlotStats).forEach(stat => {
      if (stat.total_drops > maxDrops) {
        maxDrops = stat.total_drops;
        peakTimeSlot = stat.time_slot;
      }
    });
    
    const peakStat = timeSlotStats[peakTimeSlot];
    return {
      time_slot: peakTimeSlot,
      label: peakStat.label,
      total_drops: peakStat.total_drops,
      device_count: peakStat.device_count,
      avg_drops_per_device: peakStat.avg_drops_per_device
    };
  }

  /**
   * 가장 활동이 적은 시간 슬롯 찾기
   * @param {Object} timeSlotStats - 시간 슬롯별 통계
   * @returns {Object} 최소 활동 시간 슬롯 정보
   */
  _findLeastActiveTimeSlot(timeSlotStats) {
    let leastActiveTimeSlot = 0;
    let minDrops = Infinity;
    
    Object.values(timeSlotStats).forEach(stat => {
      if (stat.total_drops < minDrops) {
        minDrops = stat.total_drops;
        leastActiveTimeSlot = stat.time_slot;
      }
    });
    
    const leastStat = timeSlotStats[leastActiveTimeSlot];
    return {
      time_slot: leastActiveTimeSlot,
      label: leastStat.label,
      total_drops: leastStat.total_drops,
      device_count: leastStat.device_count,
      avg_drops_per_device: leastStat.avg_drops_per_device
    };
  }

  /**
   * 주요 인사이트 조회
   * @returns {Promise<Array>} 인사이트 데이터
   */
  async getInsights() {
    try {
      return this._generateInsightsData();
    } catch (error) {
      console.error('인사이트 데이터 생성 오류:', error);
      throw new Error('인사이트 데이터를 생성할 수 없습니다.');
    }
  }
}

module.exports = new AnalyticsService();
