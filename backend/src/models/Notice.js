const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'academic', 'event', 'alert', 'holiday'],
    default: 'general'
  },
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetAudience: {
    type: [String],
    enum: ['admin', 'teacher', 'student', 'parent'],
    required: true
  },
  targetClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  expiryDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notice', noticeSchema);
