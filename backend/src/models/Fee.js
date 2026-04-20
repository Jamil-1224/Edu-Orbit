const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  feeType: {
    type: String,
    enum: ['tuition', 'transport', 'library', 'activity', 'examination', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: Date,
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'online', 'bank-transfer']
  },
  remarks: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Fee', feeSchema);
