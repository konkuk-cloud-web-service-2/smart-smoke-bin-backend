const mongoose = require('mongoose');

/**
 * Event 스키마
 * 장치에서 발생하는 이벤트 기록
 */
const eventSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['drop', 'full', 'maintenance', 'offline', 'online', 'reset'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false // timestamp 필드를 직접 관리
});

// 복합 인덱스 (device_id + timestamp 역순)
eventSchema.index({ device_id: 1, timestamp: -1 });
eventSchema.index({ device_id: 1, event_type: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

// toJSON 옵션
eventSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

