const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const LibraryBook = require('../models/Library');

const router = express.Router();

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const gradeFromPercentage = (percentage) => {
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 65) return 'D';
  if (percentage >= 60) return 'E';
  return 'F';
};

const gpaFromPercentage = (percentage) => {
  if (percentage >= 95) return 4.0;
  if (percentage >= 90) return 3.9;
  if (percentage >= 85) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 75) return 3.0;
  if (percentage >= 70) return 2.7;
  if (percentage >= 65) return 2.3;
  if (percentage >= 60) return 2.0;
  return 0.0;
};

const formatDate = (value) => (value ? new Date(value).toISOString() : null);

const getStudentContext = async (userId) => {
  const student = await Student.findOne({ userId })
    .populate('userId', 'name email phone profileImage address dateOfBirth gender')
    .populate({
      path: 'class',
      populate: [
        { path: 'classTeacherId', select: 'userId', populate: { path: 'userId', select: 'name email' } },
        { path: 'subjects', select: 'name code' },
        { path: 'routines.periods.subject', select: 'name code' },
        { path: 'routines.periods.teacher', select: 'userId', populate: { path: 'userId', select: 'name email' } }
      ]
    })
    .lean();

  if (!student) {
    const user = await User.findById(userId).select('name email phone profileImage address dateOfBirth gender').lean();
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    return {
      _id: userId,
      userId: user,
      class: null,
      rollNumber: 'N/A',
      bloodGroup: null,
      guardianName: null,
      guardianPhone: null,
      guardianEmail: null,
      emergencyContact: null,
      _isProfileFallback: true
    };
  }

  return student;
};

const toAttendanceSummary = (records = []) => {
  const summary = records.reduce((accumulator, record) => {
    accumulator.total += 1;
    accumulator[record.status] = (accumulator[record.status] || 0) + 1;
    if (record.status === 'present' || record.status === 'late') {
      accumulator.present += 1;
    }
    return accumulator;
  }, { total: 0, present: 0, absent: 0, leave: 0, late: 0 });

  summary.attendancePercentage = summary.total
    ? Number(((summary.present / summary.total) * 100).toFixed(1))
    : 0;

  return summary;
};

const buildSchedule = (classDoc) => {
  if (!classDoc || !Array.isArray(classDoc.routines)) return [];

  return classDoc.routines
    .flatMap((routine) => (routine.periods || []).map((period) => ({
      day: routine.day,
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      subject: period.subject?.name || period.subject?.code || 'Subject',
      teacher: period.teacher?.userId?.name || 'Teacher',
      room: classDoc.room || 'N/A'
    })))
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.periodNumber - b.periodNumber);
};

const buildDashboardData = async (student) => {
  const [attendance, marks, assignments, fees, notices, libraryBooks] = await Promise.all([
    Attendance.find({ studentId: student._id }).sort({ date: -1 }).lean(),
    Marks.find({ studentId: student._id }).populate('subjectId', 'name code').sort({ recordedDate: -1 }).lean(),
    Assignment.find({ classId: student.class?._id || student.class }).populate('subjectId', 'name code').populate('assignedBy', 'name').sort({ dueDate: 1 }).lean(),
    Fee.find({ studentId: student._id }).sort({ dueDate: -1 }).lean(),
    Notice.find({
      $or: [
        { targetAudience: { $in: ['student'] } },
        { targetClass: student.class?._id || student.class }
      ]
    }).sort({ createdAt: -1 }).limit(10).lean(),
    LibraryBook.find().sort({ dateAdded: -1 }).lean()
  ]);

  const attendanceSummary = toAttendanceSummary(attendance);
  const feeSummary = fees.reduce((accumulator, fee) => {
    accumulator.totalAmount += fee.amount || 0;
    accumulator.paidAmount += fee.status === 'paid' ? (fee.amount || 0) : (fee.status === 'partial' ? (fee.paidAmount || 0) : 0);
    accumulator.pendingAmount += fee.status === 'paid' ? 0 : ((fee.amount || 0) - (fee.paidAmount || 0));
    accumulator.totalFees += 1;
    if (fee.status === 'paid') accumulator.paidFees += 1;
    return accumulator;
  }, { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalFees: 0, paidFees: 0 });

  const latestMarks = new Map();
  marks.forEach((mark) => {
    const key = mark.subjectId?.name || mark.subjectId?.code || mark.subjectId?.toString();
    if (!latestMarks.has(key)) {
      latestMarks.set(key, mark);
    }
  });

  const schedule = buildSchedule(student.class);
  const pendingAssignments = assignments.filter((assignment) => new Date(assignment.dueDate) >= new Date());

  return {
    profile: {
      name: student.userId?.name || 'Student',
      email: student.userId?.email || '',
      rollNumber: student.rollNumber,
      className: student.class ? (/^class\s+/i.test(String(student.class.name || '').trim()) ? student.class.name : `Class ${student.class.name}`.trim()) : ''
    },
    stats: {
      gpa: marks.length
        ? Number((marks.reduce((sum, mark) => sum + gpaFromPercentage(mark.percentage || 0), 0) / marks.length).toFixed(2))
        : 0,
      attendancePercentage: attendanceSummary.attendancePercentage,
      assignmentCount: pendingAssignments.length,
      feeStatus: feeSummary.pendingAmount > 0 ? `${feeSummary.pendingAmount.toLocaleString()} due` : 'Paid',
      totalMarks: marks.length
    },
    schedule,
    recentGrades: Array.from(latestMarks.values()).slice(0, 6).map((mark) => ({
      subject: mark.subjectId?.name || 'Subject',
      grade: mark.grade || gradeFromPercentage(mark.percentage || 0),
      percentage: mark.percentage || 0
    })),
    pendingAssignments: pendingAssignments.map((assignment) => {
      const submission = assignment.submissions?.find((item) => String(item.studentId) === String(student._id));
      return {
        id: assignment._id,
        title: assignment.title,
        subject: assignment.subjectId?.name || 'Subject',
        description: assignment.description || assignment.instructions || '',
        teacher: assignment.assignedBy?.name || 'Teacher',
        assignedDate: formatDate(assignment.createdAt),
        dueDate: formatDate(assignment.dueDate),
        status: submission ? 'submitted' : new Date(assignment.dueDate) < new Date() ? 'overdue' : 'pending',
        marks: submission?.marksObtained || 0,
        maxMarks: assignment.totalMarks || 0,
        submittedDate: submission?.submittedDate ? formatDate(submission.submittedDate) : null,
        feedback: submission?.feedback || null
      };
    }),
    notices: notices.map((notice) => ({
      id: notice._id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      date: formatDate(notice.createdAt),
      isUrgent: notice.isUrgent,
      isRead: false,
      attachment: notice.attachments?.[0] || null
    })),
    upcomingEvents: [],
    feeSummary: {
      totalDue: feeSummary.pendingAmount,
      totalPaid: feeSummary.paidAmount,
      totalAmount: feeSummary.totalAmount,
      totalFees: feeSummary.totalFees,
      paidFees: feeSummary.paidFees
    },
    attendance,
    marks,
    assignments,
    fees,
    library: {
      availableBooks: libraryBooks.map((book) => ({
        id: book._id,
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        category: book.category,
        copies: book.availableQuantity ?? book.quantity ?? 0,
        rating: 0
      })),
      issuedBooks: libraryBooks.flatMap((book) => (book.issues || [])
        .filter((issue) => String(issue.issuedTo) === String(student.userId?._id || student.userId) && issue.status === 'active')
        .map((issue) => ({
          id: `${book._id}-${issue.issuedDate}`,
          title: book.title,
          author: book.author,
          issuedDate: formatDate(issue.issuedDate),
          dueDate: formatDate(issue.dueDate),
          daysLeft: issue.dueDate ? Math.ceil((new Date(issue.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
          status: issue.status
        })))
    }
  };
};

// Student dashboard
router.get('/dashboard', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const data = await buildDashboardData(student);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/profile', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const profile = {
      id: student._id,
      name: student.userId?.name || 'Student',
      email: student.userId?.email || '',
      phone: student.userId?.phone || '',
      profileImage: student.userId?.profileImage || '',
      dateOfBirth: student.userId?.dateOfBirth || null,
      gender: student.userId?.gender || '',
      address: student.userId?.address || {},
      rollNumber: student.rollNumber || 'N/A',
      className: student.class ? (/^class\s+/i.test(String(student.class.name || '').trim()) ? student.class.name : `Class ${student.class.name}`.trim()) : '',
      class: student.class ? (/^class\s+/i.test(String(student.class.name || '').trim()) ? student.class.name : `Class ${student.class.name}`.trim()) : '',
      bloodGroup: student.bloodGroup || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianEmail: student.guardianEmail || '',
      emergencyContact: student.emergencyContact || '',
      isFallbackProfile: Boolean(student._isProfileFallback)
    };

    res.json({ success: true, profile, student });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/profile', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);

    if (!student || !user) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      guardianEmail,
      emergencyContact,
      bloodGroup
    } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) user.gender = gender || null;
    if (address !== undefined) user.address = address;

    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (guardianEmail !== undefined) student.guardianEmail = guardianEmail;
    if (emergencyContact !== undefined) student.emergencyContact = emergencyContact;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;

    await user.save();
    await student.save();

    const updatedStudent = await getStudentContext(req.user.id);
    res.json({ success: true, message: 'Profile updated', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/attendance', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const records = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).lean();
    const summary = toAttendanceSummary(records);

    res.json({
      success: true,
      attendance: records.map((record) => ({
        id: record._id,
        date: formatDate(record.date),
        status: record.status,
        remarks: record.remarks || '',
        className: student.class ? (/^class\s+/i.test(String(student.class.name || '').trim()) ? student.class.name : `Class ${student.class.name}`.trim()) : ''
      })),
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/marks', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const marks = await Marks.find({ studentId: student._id }).populate('subjectId', 'name code').sort({ recordedDate: -1 }).lean();

    res.json({
      success: true,
      marks: marks.map((mark) => ({
        id: mark._id,
        subject: mark.subjectId?.name || 'Subject',
        subjectCode: mark.subjectId?.code || '',
        exam: mark.exam,
        marks: mark.marks,
        maxMarks: mark.maxMarks,
        percentage: mark.percentage || 0,
        grade: mark.grade || gradeFromPercentage(mark.percentage || 0),
        date: formatDate(mark.recordedDate),
        remarks: mark.remarks || ''
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/assignments', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const assignments = await Assignment.find({ classId: student.class?._id || student.class })
      .populate('subjectId', 'name code')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 })
      .lean();

    res.json({
      success: true,
      assignments: assignments.map((assignment) => {
        const submission = assignment.submissions?.find((item) => String(item.studentId) === String(student._id));
        return {
          id: assignment._id,
          title: assignment.title,
          subject: assignment.subjectId?.name || 'Subject',
          description: assignment.description || assignment.instructions || '',
          teacher: assignment.assignedBy?.name || 'Teacher',
          assignedDate: formatDate(assignment.createdAt),
          dueDate: formatDate(assignment.dueDate),
          status: submission ? 'submitted' : new Date(assignment.dueDate) < new Date() ? 'overdue' : 'pending',
          marks: submission?.marksObtained || 0,
          maxMarks: assignment.totalMarks || 0,
          submittedDate: submission?.submittedDate ? formatDate(submission.submittedDate) : null,
          feedback: submission?.feedback || null
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/assignments/:assignmentId/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const { assignmentId } = req.params;
    const { submittedFile = null, comments = '' } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const existingSubmission = assignment.submissions.find((item) => String(item.studentId) === String(student._id));
    if (existingSubmission) {
      existingSubmission.submittedFile = submittedFile;
      existingSubmission.submittedDate = new Date();
      existingSubmission.feedback = comments || existingSubmission.feedback;
    } else {
      assignment.submissions.push({
        studentId: student._id,
        submittedFile,
        submittedDate: new Date(),
        feedback: comments
      });
    }

    await assignment.save();
    res.status(201).json({ success: true, message: 'Assignment submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/fees', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const fees = await Fee.find({ studentId: student._id }).sort({ dueDate: -1 }).lean();

    res.json({
      success: true,
      fees: fees.map((fee) => ({
        id: fee._id,
        academicYear: fee.academicYear,
        feeType: fee.feeType,
        amount: fee.amount,
        dueDate: formatDate(fee.dueDate),
        paidDate: formatDate(fee.paidDate),
        status: fee.status,
        transactionId: fee.transactionId || '',
        paymentMethod: fee.paymentMethod || '',
        remarks: fee.remarks || '',
        paidAmount: fee.status === 'partial' ? fee.paidAmount || Math.floor(fee.amount / 2) : fee.amount,
        remainingAmount: fee.status === 'partial' ? (fee.amount - (fee.paidAmount || 0)) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/schedule', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const schedule = buildSchedule(student.class);
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/notices', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const notices = await Notice.find({
      $or: [
        { targetAudience: { $in: ['student'] } },
        { targetClass: student.class?._id || student.class }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      notices: notices.map((notice) => ({
        id: notice._id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        date: formatDate(notice.createdAt),
        isUrgent: notice.isUrgent,
        attachment: notice.attachments?.[0] || null
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/library', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await getStudentContext(req.user.id);
    const books = await LibraryBook.find().sort({ dateAdded: -1 }).lean();
    const studentUserId = String(student.userId?._id || student.userId);

    const availableBooks = books.map((book) => ({
      id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category,
      copies: book.availableQuantity ?? book.quantity ?? 0,
      rating: 0
    }));

    const issuedBooks = books.flatMap((book) => (book.issues || [])
      .filter((issue) => String(issue.issuedTo) === studentUserId)
      .map((issue) => ({
        id: `${book._id}-${issue.issuedDate}`,
        title: book.title,
        author: book.author,
        issuedDate: formatDate(issue.issuedDate),
        dueDate: formatDate(issue.dueDate),
        daysLeft: issue.dueDate ? Math.ceil((new Date(issue.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
        status: issue.status
      })));

    res.json({ success: true, books: availableBooks, issuedBooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
