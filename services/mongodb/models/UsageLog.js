const mongoose = require('mongoose');

/**
 * UsageLog 스키마
 * 집계된 사용 현황 로그 (캐싱용)
 * 실시간 집계 대신 미리 계산된 데이터를 저장
 */
const usageLogSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  period_start: {
    type: Date,
    required: true,
    index: true
  },
  period_end: {
    type: Date,
    required: true
  },
  time_slot: {
    type: Number, // 0, 3, 6, 9, 12, 15, 18, 21 (3시간 텀)
    required: true,
    index: true
  },
  drop_count: {
    type: Number,
    required: true,
    default: 0
  },
  full_events: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 복합 인덱스
usageLogSchema.index({ device_id: 1, period_start: -1 });
usageLogSchema.index({ device_id: 1, time_slot: 1 });

// toJSON 옵션
usageLogSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const UsageLog = mongoose.model('UsageLog', usageLogSchema);

module.exports = UsageLog;

