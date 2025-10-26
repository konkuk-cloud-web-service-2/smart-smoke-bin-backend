const express = require('express');
const router = express.Router();

// 일별 KPI 집계 데이터 (더미 데이터)
const dailyKpiData = {
  total_drop_count: 1220,
  active_devices_count: 45,
  total_devices_count: 52,
  peak_time_today: "18:00-18:30"
};

// 일별 KPI 집계 조회
router.get('/daily', (req, res) => {
  try {
    res.json({
      status: 200,
      message: "일일 집계를 조회합니다",
      data: dailyKpiData
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
