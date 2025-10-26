const express = require('express');
const router = express.Router();
const eventController = require('../modules/event/eventController');

/**
 * 이벤트 처리 라우터
 * POST /api/smoke-bin/events - 이벤트 생성
 * GET /api/smoke-bin/devices/:device_id/events - 장치 이벤트 조회
 * GET /api/smoke-bin/devices/:device_id/event-stats - 이벤트 통계 조회
 */

// 이벤트 생성 (하드웨어→서버)
router.post('/', eventController.createEvent);

// 장치 이벤트 조회
router.get('/devices/:device_id/events', eventController.getDeviceEvents);

// 이벤트 통계 조회
router.get('/devices/:device_id/event-stats', eventController.getEventStats);

module.exports = router;
