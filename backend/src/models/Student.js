const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  enrollmentNumber: {
    type: String,
    unique: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateOfAdmission: Date,
  bloodGroup: String,
  emergencyContact: String,
  guardianName: String,
  guardianPhone: String,
  guardianEmail: String,
  medicalConditions: String,
  documents: [{
    type: String,
    certificateType: String,
    uploadDate: Date
  }],
  fees: {
    totalAmount: Number,
    paidAmount: Number,
    dueAmount: Number,
    lastPaidDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);
