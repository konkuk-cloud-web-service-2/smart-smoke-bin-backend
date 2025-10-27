const express = require('express');
const router = express.Router();
const deviceController = require('../modules/device/deviceController');

/**
 * 장치 관리 라우터
 * GET /api/smoke-bin/devices - 장치 목록 조회
 * GET /api/smoke-bin/devices/:device_id - 장치 상세 조회
 * PUT /api/smoke-bin/devices/:device_id/status - 장치 상태 업데이트
 * GET /api/smoke-bin/devices/:device_id/stats - 장치 통계 조회
 */

// 장치 목록 조회
router.get('/', deviceController.getDevices);

// 장치 상세 조회
router.get('/:device_id', deviceController.getDeviceById);

// 장치 상태 업데이트
router.put('/:device_id/status', deviceController.updateDeviceStatus);

// 장치 통계 조회
router.get('/:device_id/stats', deviceController.getDeviceStats);

// 시뮬레이션 API
router.post('/:device_id/simulate/drop', deviceController.simulateDrop);
router.post('/:device_id/simulate/reset', deviceController.simulateReset);
router.post('/:device_id/simulate/full', deviceController.simulateFull);

module.exports = router;
