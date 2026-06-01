const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  instructions: String,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  dueDate: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 10
  },
  attachments: [String],
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    submittedFile: String,
    submittedDate: Date,
    marksObtained: Number,
    feedback: String,
    viewed: {
      type: Boolean,
      default: false
    },
    gradedDate: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
