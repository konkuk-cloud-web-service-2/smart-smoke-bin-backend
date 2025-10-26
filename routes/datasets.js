const express = require('express');
// const multer = require('multer');
const createUploadMiddleware = require('../services/createUploadMiddleware');
const path = require('path');
const router = express.Router();

// multer 설정 - 메모리 저장소 사용 (실제로는 S3에 업로드)
// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage: storage,
const upload = createUploadMiddleware({
  fieldName: 'file',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // CSV 파일만 허용
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('CSV 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 공공 데이터 업로드
// router.post('/', upload.single('file'), (req, res) => {
router.post('/', upload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '파일이 업로드되지 않았습니다.',
        data: {}
      });
    }

    // 파일 정보 추출
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    // 실제로는 여기서 S3에 업로드하고 경로를 반환
    // 현재는 더미 S3 경로 반환
    const s3Path = `s3://smart-smoke-bin-datasets/datasets/${fileName}`;

    res.status(202).json({
      status: 202,
      message: "Upload successful. Processing started.",
      data: {
        file_name: fileName,
        s3_path: s3Path
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
      data: {}
    });
  }
});

// 업로드된 파일 목록 조회 (추가 기능)
router.get('/', (req, res) => {
  try {
    // 실제로는 데이터베이스에서 파일 목록 조회
    const fileList = [
      {
        file_name: "seoul_complaints_2804.csv",
        s3_path: "s3://smart-smoke-bin-datasets/datasets/seoul_complaints_2804.csv",
        upload_date: "2024-01-15T10:30:00Z",
        file_size: 1024000
      }
    ];

    res.json({
      status: 200,
      message: "파일 목록 조회 성공",
      data: fileList
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
      data: []
    });
  }
});

module.exports = router;
