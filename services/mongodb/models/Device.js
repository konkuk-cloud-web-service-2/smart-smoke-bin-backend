const mongoose = require('mongoose');

/**
 * Device 스키마
 * 스마트 담배꽁초 수거함 장치 정보
 */
const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'full', 'offline', 'maintenance'],
    default: 'active',
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 100
  },
  current_level: {
    type: Number,
    required: true,
    default: 0
  },
  fill_percentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 인덱스 설정
deviceSchema.index({ status: 1, updated_at: -1 });
deviceSchema.index({ location: 1 });

// 가상 필드 - fill_percentage 자동 계산
deviceSchema.virtual('calculated_fill_percentage').get(function() {
  if (this.capacity <= 0) return 0;
  return Math.round((this.current_level * 100.0 / this.capacity) * 10) / 10;
});

// 저장 전 fill_percentage 자동 업데이트
deviceSchema.pre('save', function(next) {
  if (this.capacity > 0) {
    this.fill_percentage = Math.round((this.current_level * 100.0 / this.capacity) * 10) / 10;
  }
  next();
});

// toJSON 옵션 (가상 필드 포함)
deviceSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // MongoDB _id를 id로 변환
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;

