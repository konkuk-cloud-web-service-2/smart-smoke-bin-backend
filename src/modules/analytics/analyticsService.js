const s3Database = require('../../../services/s3Database');
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
   * @returns {Promise<Array>} 사용현황 로그
   */
  async getUsageLogs(deviceId, period = 'today') {
    try {
      return await s3Database.getUsageLogs(deviceId, period);
    } catch (error) {
      console.error('사용현황 로그 조회 오류:', error);
      throw new Error('사용현황 로그를 조회할 수 없습니다.');
    }
  }

  /**
   * 시간대별 사용 패턴 분석
   * @param {string} deviceId - 장치 ID
   * @param {string} period - 기간
   * @returns {Promise<Object>} 시간대별 패턴
   */
  async getHourlyUsagePattern(deviceId, period = '7d') {
    try {
      const logs = await this.getUsageLogs(deviceId, period);
      
      // 시간대별 그룹화
      const hourlyStats = {};
      
      logs.forEach(log => {
        const hour = moment(log.period_start).hour();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { hour, drop_count: 0, full_events: 0 };
        }
        hourlyStats[hour].drop_count += log.drop_count;
        hourlyStats[hour].full_events += log.full_events;
      });

      return {
        device_id: deviceId,
        period,
        hourly_pattern: Object.values(hourlyStats).sort((a, b) => a.hour - b.hour),
        peak_hour: this._findPeakHour(hourlyStats),
        total_drops: Object.values(hourlyStats).reduce((sum, stat) => sum + stat.drop_count, 0)
      };
    } catch (error) {
      console.error('시간대별 패턴 분석 오류:', error);
      throw new Error('시간대별 사용 패턴을 분석할 수 없습니다.');
    }
  }

  /**
   * 피크 시간 찾기
   * @param {Object} hourlyStats - 시간대별 통계
   * @returns {number} 피크 시간
   */
  _findPeakHour(hourlyStats) {
    let peakHour = 0;
    let maxDrops = 0;
    
    Object.values(hourlyStats).forEach(stat => {
      if (stat.drop_count > maxDrops) {
        maxDrops = stat.drop_count;
        peakHour = stat.hour;
      }
    });
    
    return peakHour;
  }

  /**
   * 지역별 수거량 분석
   * @param {string} period - 기간
   * @returns {Promise<Array>} 지역별 통계
   */
  async getRegionalAnalysis(period = '7d') {
    try {
      const devices = await s3Database.getDevices();
      const regionalStats = [];

      for (const device of devices) {
        const logs = await this.getUsageLogs(device.device_id, period);
        const totalDrops = logs.reduce((sum, log) => sum + log.drop_count, 0);
        
        regionalStats.push({
          device_id: device.device_id,
          location: device.location,
          latitude: device.latitude,
          longitude: device.longitude,
          total_drops: totalDrops,
          avg_daily_drops: Math.round(totalDrops / 7 * 10) / 10,
          status: device.status
        });
      }

      return regionalStats.sort((a, b) => b.total_drops - a.total_drops);
    } catch (error) {
      console.error('지역별 분석 오류:', error);
      throw new Error('지역별 수거량을 분석할 수 없습니다.');
    }
  }

  /**
   * 주간 사용률 분석
   * @param {string} deviceId - 장치 ID
   * @returns {Promise<Object>} 주간 사용률
   */
  async getWeeklyUsageRate(deviceId) {
    try {
      const currentWeek = await this.getUsageLogs(deviceId, '7d');
      const previousWeek = await this.getUsageLogs(deviceId, '7d'); // 이전 주 데이터는 별도 로직 필요
      
      const currentTotal = currentWeek.reduce((sum, log) => sum + log.drop_count, 0);
      const previousTotal = previousWeek.reduce((sum, log) => sum + log.drop_count, 0);
      
      const growthRate = previousTotal > 0 
        ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100 * 10) / 10
        : 0;

      return {
        device_id: deviceId,
        current_week_drops: currentTotal,
        previous_week_drops: previousTotal,
        growth_rate: growthRate,
        trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
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
      const logs = await this.getUsageLogs(deviceId, period);
      const totalDrops = logs.reduce((sum, log) => sum + log.drop_count, 0);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 1;
      
      return Math.round((totalDrops / days) * 10) / 10;
    } catch (error) {
      console.error('일 평균 수거량 계산 오류:', error);
      throw new Error('일 평균 수거량을 계산할 수 없습니다.');
    }
  }
}

module.exports = new AnalyticsService();
