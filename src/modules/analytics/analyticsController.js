const analyticsService = require('./analyticsService');

/**
 * 데이터 분석 컨트롤러
 * HTTP 요청/응답 처리
 */
class AnalyticsController {
  /**
   * 30분 사용현황 로그 조회
   * GET /api/smoke-bin/devices/:device_id/usage-logs
   */
  async getUsageLogs(req, res) {
    try {
      const { device_id } = req.params;
      const { period = 'today' } = req.query;
      
      const logs = await analyticsService.getUsageLogs(device_id, period);
      
      let startTime, endTime;
      const now = require('moment')();
      
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

      res.json({
        success: true,
        message: '사용현황 로그를 성공적으로 조회했습니다.',
        data: {
          device_id,
          period,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_periods: logs.length,
          logs
        }
      });
    } catch (error) {
      console.error('사용현황 로그 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '사용현황 로그 조회 중 오류가 발생했습니다.',
        error: 'USAGE_LOGS_ERROR'
      });
    }
  }

  /**
   * 시간대별 사용 패턴 분석
   * GET /api/smoke-bin/devices/:device_id/usage-pattern
   */
  async getUsagePattern(req, res) {
    try {
      const { device_id } = req.params;
      const { period = '7d' } = req.query;
      
      const pattern = await analyticsService.getHourlyUsagePattern(device_id, period);
      
      res.json({
        success: true,
        message: '시간대별 사용 패턴을 성공적으로 조회했습니다.',
        data: pattern
      });
    } catch (error) {
      console.error('사용 패턴 분석 오류:', error);
      res.status(500).json({
        success: false,
        message: '사용 패턴 분석 중 오류가 발생했습니다.',
        error: 'USAGE_PATTERN_ERROR'
      });
    }
  }

  /**
   * 지역별 수거량 분석
   * GET /api/smoke-bin/analytics/regional
   */
  async getRegionalAnalysis(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      const analysis = await analyticsService.getRegionalAnalysis(period);
      
      res.json({
        success: true,
        message: '지역별 수거량 분석을 성공적으로 조회했습니다.',
        data: {
          period,
          regional_stats: analysis,
          total_devices: analysis.length,
          most_active_location: analysis[0] || null
        }
      });
    } catch (error) {
      console.error('지역별 분석 오류:', error);
      res.status(500).json({
        success: false,
        message: '지역별 분석 중 오류가 발생했습니다.',
        error: 'REGIONAL_ANALYSIS_ERROR'
      });
    }
  }

  /**
   * 주간 사용률 분석
   * GET /api/smoke-bin/devices/:device_id/weekly-usage
   */
  async getWeeklyUsage(req, res) {
    try {
      const { device_id } = req.params;
      
      const usage = await analyticsService.getWeeklyUsageRate(device_id);
      
      res.json({
        success: true,
        message: '주간 사용률을 성공적으로 조회했습니다.',
        data: usage
      });
    } catch (error) {
      console.error('주간 사용률 분석 오류:', error);
      res.status(500).json({
        success: false,
        message: '주간 사용률 분석 중 오류가 발생했습니다.',
        error: 'WEEKLY_USAGE_ERROR'
      });
    }
  }

  /**
   * 일 평균 수거량 조회
   * GET /api/smoke-bin/devices/:device_id/daily-average
   */
  async getDailyAverage(req, res) {
    try {
      const { device_id } = req.params;
      const { period = '7d' } = req.query;
      
      const average = await analyticsService.getDailyAverage(device_id, period);
      
      res.json({
        success: true,
        message: '일 평균 수거량을 성공적으로 조회했습니다.',
        data: {
          device_id,
          period,
          daily_average: average
        }
      });
    } catch (error) {
      console.error('일 평균 수거량 계산 오류:', error);
      res.status(500).json({
        success: false,
        message: '일 평균 수거량 계산 중 오류가 발생했습니다.',
        error: 'DAILY_AVERAGE_ERROR'
      });
    }
  }
}

module.exports = new AnalyticsController();
