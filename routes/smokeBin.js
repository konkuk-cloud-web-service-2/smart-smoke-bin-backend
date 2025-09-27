const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: '스모크 빈 목록 조회',
    data: []
  });
});

router.post('/', (req, res) => {
  res.json({
    message: '스모크 빈 생성',
    data: req.body
  });
});

router.get('/:id', (req, res) => {
  res.json({
    message: `스모크 빈 ${req.params.id} 조회`,
    data: { id: req.params.id }
  });
});

module.exports = router;
