const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const Event = require('../models/Event');

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

const toISO = (value) => (value ? new Date(value).toISOString() : null);

const summarizeAttendance = (records = []) => {
  if (!records.length) {
    return { total: 0, present: 0, attendanceRate: 0 };
  }

  const present = records.filter((record) => record.status === 'present' || record.status === 'late').length;
  return {
    total: records.length,
    present,
    attendanceRate: Number(((present / records.length) * 100).toFixed(1))
  };
};

const summarizeFees = (fees = []) => {
  const totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const paidFees = fees.filter((fee) => fee.status === 'paid').length;
  const pendingAmount = fees.reduce((sum, fee) => sum + (fee.status === 'paid' ? 0 : (fee.amount || 0)), 0);

  return {
    totalAmount,
    paidFees,
    totalFees: fees.length,
    collectionRate: fees.length ? Number(((paidFees / fees.length) * 100).toFixed(1)) : 0,
    pendingAmount
  };
};

const buildScheduleFromClass = (classDoc) => {
  if (!classDoc || !Array.isArray(classDoc.routines)) return [];

  return classDoc.routines
    .flatMap((routine) =>
      (routine.periods || []).map((period) => ({
        day: routine.day,
        periodNumber: period.periodNumber,
        startTime: period.startTime,
        endTime: period.endTime,
        subject: period.subject?.name || period.subject?.code || 'Subject',
        teacher: period.teacher?.name || 'Teacher'
      }))
    )
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.periodNumber - b.periodNumber);
};

const buildActivityFeed = (items, type, titleField, descriptionBuilder) =>
  items.map((item) => ({
    type,
    title: item[titleField],
    description: descriptionBuilder(item),
    timestamp: toISO(item.createdAt || item.recordedDate || item.dueDate || item.startDate)
  }));

const getAdminDashboardData = async () => {
  const [totalStudents, totalTeachers, totalClasses, feeStats, attendanceStats, notices, events, assignments] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Class.countDocuments(),
    Fee.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          paidFees: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          totalFees: { $sum: 1 },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 0, '$amount'] } }
        }
      }
    ]),
    Attendance.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentRecords: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } }
        }
      }
    ]),
    Notice.find().sort({ createdAt: -1 }).limit(5).lean(),
    Event.find({ startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(5).lean(),
    Assignment.find().populate('classId', 'name section').populate('subjectId', 'name code').sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const feeSummary = feeStats[0] || { totalAmount: 0, paidFees: 0, totalFees: 0, pendingAmount: 0 };
  const attendanceSummary = attendanceStats[0] || { totalRecords: 0, presentRecords: 0 };
  const collectionRate = feeSummary.totalFees ? Number(((feeSummary.paidFees / feeSummary.totalFees) * 100).toFixed(1)) : 0;
  const attendanceRate = attendanceSummary.totalRecords ? Number(((attendanceSummary.presentRecords / attendanceSummary.totalRecords) * 100).toFixed(1)) : 0;

  const recentActivities = [
    ...buildActivityFeed(notices, 'notice', 'title', (item) => item.content.slice(0, 120)),
    ...buildActivityFeed(events, 'event', 'title', (item) => item.description || item.location || 'Upcoming school event'),
    ...assignments.map((assignment) => ({
      type: 'assignment',
      title: assignment.title,
      description: `${assignment.classId?.name || 'Class'}${assignment.classId?.section ? ` ${assignment.classId.section}` : ''} • ${assignment.subjectId?.name || 'Subject'}`,
      timestamp: toISO(assignment.createdAt)
    }))
  ]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 8);

  return {
    stats: {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalFees: feeSummary.totalAmount,
      attendanceRate,
      feeCollectionRate: collectionRate,
      pendingFeesAmount: feeSummary.pendingAmount,
      averageClassSize: totalClasses ? Number((totalStudents / totalClasses).toFixed(1)) : 0
    },
    recentActivities,
    upcomingEvents: events.map((event) => ({
      title: event.title,
      date: toISO(event.startDate),
      type: event.eventType,
      location: event.location || null
    })),
    notices: notices.map((notice) => ({
      title: notice.title,
      category: notice.category,
      urgent: notice.isUrgent,
      createdAt: toISO(notice.createdAt)
    }))
  };
};

const getTeacherDashboardData = async (userId) => {
  const teacher = await Teacher.findOne({ userId }).populate('userId', 'name email profileImage').lean();

  if (!teacher) {
    return {
      profileReady: false,
      stats: {
        assignedClasses: 0,
        totalStudents: 0,
        pendingAssignments: 0,
        todayClasses: 0,
        attendanceRate: 0
      },
      classes: [],
      schedule: [],
      recentActivities: []
    };
  }

  const classIds = teacher.assignedClasses || [];
  const [classes, studentsCount, assignments, attendance, marks] = await Promise.all([
    Class.find({ _id: { $in: classIds } })
      .populate('classTeacherId', 'name')
      .populate('subjects', 'name code')
      .populate({ path: 'routines.periods.subject', select: 'name code' })
      .populate({ path: 'routines.periods.teacher', select: 'userId', populate: { path: 'userId', select: 'name' } })
      .lean(),
    Student.countDocuments({ class: { $in: classIds } }),
    Assignment.find({ classId: { $in: classIds } }).populate('classId', 'name section').populate('subjectId', 'name code').sort({ createdAt: -1 }).limit(10).lean(),
    Attendance.find({ classId: { $in: classIds } }).sort({ date: -1 }).limit(200).lean(),
    Marks.find({ classId: { $in: classIds } }).populate('subjectId', 'name code').populate('studentId', 'rollNumber').sort({ recordedDate: -1 }).limit(20).lean()
  ]);

  const todayName = dayOrder[new Date().getDay()];
  const todaySchedule = classes
    .flatMap((classDoc) =>
      (classDoc.routines || [])
        .filter((routine) => routine.day === todayName)
        .flatMap((routine) =>
          (routine.periods || []).map((period) => ({
            className: `${classDoc.name}${classDoc.section ? `-${classDoc.section}` : ''}`,
            subject: period.subject?.name || 'Subject',
            room: classDoc.room || 'Room not set',
            startTime: period.startTime,
            endTime: period.endTime,
            periodNumber: period.periodNumber
          }))
        )
    )
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const attendanceSummary = summarizeAttendance(attendance);
  const pendingAssignments = assignments.filter((assignment) => new Date(assignment.dueDate) >= new Date()).length;

  return {
    profileReady: true,
    profile: {
      name: teacher.userId?.name || 'Teacher',
      email: teacher.userId?.email || ''
    },
    stats: {
      assignedClasses: classes.length,
      totalStudents: studentsCount,
      pendingAssignments,
      todayClasses: todaySchedule.length,
      attendanceRate: attendanceSummary.attendanceRate
    },
    classes: classes.map((classDoc) => ({
      id: classDoc._id,
      name: classDoc.name,
      room: classDoc.room,
      totalStudents: classDoc.totalStudents || 0,
      academicYear: classDoc.academicYear
    })),
    schedule: todaySchedule,
    recentActivities: [
      ...assignments.slice(0, 4).map((assignment) => ({
        type: 'assignment',
        title: assignment.title,
        description: `${/^class\s+/i.test(String(assignment.classId?.name || '').trim()) ? assignment.classId?.name : `Class ${assignment.classId?.name || ''}`.trim()} • ${assignment.subjectId?.name || 'Subject'}`,
        timestamp: toISO(assignment.createdAt)
      })),
      ...marks.slice(0, 4).map((mark) => ({
        type: 'marks',
        title: `${mark.subjectId?.name || 'Subject'} marks uploaded`,
        description: `Student ${mark.studentId?.rollNumber || ''} scored ${mark.marks}/${mark.maxMarks}`,
        timestamp: toISO(mark.recordedDate)
      }))
    ].slice(0, 8)
  };
};

const getStudentDashboardData = async (userId) => {
  const student = await Student.findOne({ userId })
    .populate('userId', 'name email profileImage')
    .populate({
      path: 'class',
      populate: [
        { path: 'subjects', select: 'name code' },
        { path: 'routines.periods.subject', select: 'name code' },
        { path: 'routines.periods.teacher', select: 'userId', populate: { path: 'userId', select: 'name' } }
      ]
    })
    .lean();

  if (!student) {
    return {
      profileReady: false,
      stats: {
        gpa: 0,
        attendancePercentage: 0,
        assignmentCount: 0,
        feeStatus: 'No profile found'
      },
      schedule: [],
      recentGrades: [],
      pendingAssignments: [],
      upcomingEvents: [],
      feeSummary: { totalAmount: 0, paidFees: 0, totalFees: 0, collectionRate: 0, pendingAmount: 0 }
    };
  }

  const [attendance, marks, assignments, fees, notices, events] = await Promise.all([
    Attendance.find({ studentId: student._id }).sort({ date: -1 }).lean(),
    Marks.find({ studentId: student._id }).populate('subjectId', 'name code').sort({ recordedDate: -1 }).lean(),
    Assignment.find({ classId: student.class?._id || student.class }).populate('subjectId', 'name code').sort({ dueDate: 1 }).lean(),
    Fee.find({ studentId: student._id }).sort({ dueDate: -1 }).lean(),
    Notice.find({ targetAudience: { $in: ['student'] } }).sort({ createdAt: -1 }).limit(5).lean(),
    Event.find({ targetAudience: { $in: ['student'] }, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(5).lean()
  ]);

  const attendanceSummary = summarizeAttendance(attendance);
  const feeSummary = summarizeFees(fees);
  const latestSubjectMarks = new Map();

  marks.forEach((mark) => {
    const key = mark.subjectId?.name || mark.subjectId?.code || mark.subjectId?.toString();
    if (!latestSubjectMarks.has(key)) {
      latestSubjectMarks.set(key, mark);
    }
  });

  const averagePercentage = marks.length
    ? Number((marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / marks.length).toFixed(1))
    : 0;

  const gpa = marks.length
    ? Number((marks.reduce((sum, mark) => sum + gpaFromPercentage(mark.percentage || 0), 0) / marks.length).toFixed(2))
    : 0;

  const classDoc = student.class || null;
  const schedule = buildScheduleFromClass(classDoc);

  const pendingAssignments = assignments
    .filter((assignment) => new Date(assignment.dueDate) >= new Date())
    .map((assignment) => ({
      title: assignment.title,
      subject: assignment.subjectId?.name || 'Subject',
      dueDate: toISO(assignment.dueDate),
      status: 'pending'
    }));

  return {
    profileReady: true,
    profile: {
      name: student.userId?.name || 'Student',
      email: student.userId?.email || '',
      rollNumber: student.rollNumber,
      className: classDoc ? (/^class\s+/i.test(String(classDoc.name || '').trim()) ? classDoc.name : `Class ${classDoc.name}`.trim()) : ''
    },
    stats: {
      gpa,
      averagePercentage,
      attendancePercentage: attendanceSummary.attendanceRate,
      assignmentCount: pendingAssignments.length,
      feeStatus: feeSummary.totalFees ? `${feeSummary.collectionRate}% paid` : 'No dues'
    },
    schedule,
    recentGrades: Array.from(latestSubjectMarks.values()).slice(0, 5).map((mark) => ({
      subject: mark.subjectId?.name || 'Subject',
      grade: mark.grade || gradeFromPercentage(mark.percentage || 0),
      percentage: mark.percentage || 0
    })),
    pendingAssignments,
    upcomingEvents: events.map((event) => ({
      name: event.title,
      date: toISO(event.startDate),
      type: event.eventType
    })),
    notices: notices.map((notice) => ({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      urgent: notice.isUrgent
    })),
    feeSummary
  };
};

const getParentDashboardData = async (userId) => {
  const children = await Student.find({ parentId: userId })
    .populate('userId', 'name email profileImage')
    .populate('class')
    .lean();

  if (!children.length) {
    return {
      profileReady: false,
      stats: {
        totalChildren: 0,
        overallAttendance: 0,
        pendingFees: 0,
        feeStatus: 'No children linked'
      },
      children: [],
      alerts: [],
      notices: [],
      upcomingEvents: []
    };
  }

  const childData = await Promise.all(children.map(async (child) => {
    const [attendance, fees, marks] = await Promise.all([
      Attendance.find({ studentId: child._id }).sort({ date: -1 }).lean(),
      Fee.find({ studentId: child._id }).sort({ dueDate: -1 }).lean(),
      Marks.find({ studentId: child._id }).populate('subjectId', 'name code').sort({ recordedDate: -1 }).lean()
    ]);

    const attendanceSummary = summarizeAttendance(attendance);
    const feeSummary = summarizeFees(fees);
    const averagePercentage = marks.length
      ? Number((marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / marks.length).toFixed(1))
      : 0;

    return {
      id: child._id,
      name: child.userId?.name || 'Child',
      className: child.class ? (/^class\s+/i.test(String(child.class.name || '').trim()) ? child.class.name : `Class ${child.class.name}`.trim()) : '',
      attendance: attendanceSummary.attendanceRate,
      gpa: Number((marks.length ? marks.reduce((sum, mark) => sum + gpaFromPercentage(mark.percentage || 0), 0) / marks.length : 0).toFixed(2)),
      averagePercentage,
      pendingFees: feeSummary.pendingAmount,
      feeStatus: feeSummary.collectionRate ? `${feeSummary.collectionRate}% paid` : 'Pending'
    };
  }));

  const overallAttendance = childData.length
    ? Number((childData.reduce((sum, child) => sum + child.attendance, 0) / childData.length).toFixed(1))
    : 0;

  const pendingFees = childData.reduce((sum, child) => sum + child.pendingFees, 0);

  const [notices, events] = await Promise.all([
    Notice.find({ targetAudience: { $in: ['parent'] } }).sort({ createdAt: -1 }).limit(5).lean(),
    Event.find({ targetAudience: { $in: ['parent'] }, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(5).lean()
  ]);

  const alerts = childData.flatMap((child) => {
    const childAlerts = [];
    if (child.attendance < 85) {
      childAlerts.push({
        title: 'Attendance Alert',
        description: `${child.name}'s attendance is ${child.attendance}%`,
        severity: 'warning'
      });
    }
    if (child.pendingFees > 0) {
      childAlerts.push({
        title: 'Fee Reminder',
        description: `₹${child.pendingFees.toLocaleString()} pending for ${child.name}`,
        severity: 'critical'
      });
    }
    return childAlerts;
  });

  return {
    profileReady: true,
    stats: {
      totalChildren: childData.length,
      overallAttendance,
      pendingFees,
      feeStatus: pendingFees > 0 ? 'Pending' : 'Clear'
    },
    children: childData,
    alerts,
    notices: notices.map((notice) => ({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      urgent: notice.isUrgent
    })),
    upcomingEvents: events.map((event) => ({
      title: event.title,
      date: toISO(event.startDate),
      type: event.eventType,
      location: event.location || null
    }))
  };
};

module.exports = {
  getAdminDashboardData,
  getTeacherDashboardData,
  getStudentDashboardData,
  getParentDashboardData
};