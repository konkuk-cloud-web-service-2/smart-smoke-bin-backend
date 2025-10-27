const express = require('express');
const router = express.Router();
const analyticsController = require('../modules/analytics/analyticsController');

/**
 * 데이터 분석 라우터
 * GET /api/smoke-bin/devices/:device_id/usage-logs - 30분 사용현황 로그
 * GET /api/smoke-bin/analytics/usage-pattern - 시간대별 사용 패턴
 * GET /api/smoke-bin/analytics/all-devices-time-pattern - 전체 장치 시간대별 사용 패턴 (3시간 텀)
 * GET /api/smoke-bin/analytics/regional - 지역별 수거량 분석
 * GET /api/smoke-bin/devices/:device_id/weekly-usage - 주간 사용률
 * GET /api/smoke-bin/devices/:device_id/daily-average - 일 평균 수거량
 */

// 30분 사용현황 로그 조회
router.get('/devices/:device_id/usage-logs', analyticsController.getUsageLogs);

// 시간대별 사용 패턴 분석
router.get('/analytics/usage-pattern', analyticsController.getUsagePattern);

// 전체 장치들의 시간대별 사용 패턴 분석 (3시간 텀)
router.get('/analytics/all-devices-time-pattern', analyticsController.getAllDevicesTimePattern);

// 지역별 수거량 분석
router.get('/analytics/regional', analyticsController.getRegionalAnalysis);

// 주간 사용률 분석
router.get('/devices/:device_id/weekly-usage', analyticsController.getWeeklyUsage);

// 일 평균 수거량 조회
router.get('/devices/:device_id/daily-average', analyticsController.getDailyAverage);

// 개요 페이지용 통합 대시보드 데이터
router.get('/dashboard/overview', analyticsController.getDashboardOverview);

// 주요 인사이트 조회
router.get('/analytics/insights', analyticsController.getInsights);

module.exports = router;
