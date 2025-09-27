const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Smart Smoke Bin Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

module.exports = router;
