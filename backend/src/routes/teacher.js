const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../middleware/auth');
const { getTeacherDashboardData } = require('../services/dashboardService');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const Notice = require('../models/Notice');

const router = express.Router();

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return Boolean(value);
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (error) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return value ? [value] : [];
};

const buildEmployeeId = () => `TCH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

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

const ensureTeacherProfile = async (userId) => {
  let teacher = await Teacher.findOne({ userId });
  if (teacher) return teacher;

  const user = await User.findById(userId).lean();
  if (!user || user.role !== 'teacher') {
    const error = new Error('Teacher account is invalid');
    error.status = 403;
    throw error;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      teacher = await Teacher.create({
        userId,
        employeeId: buildEmployeeId(),
        qualifications: [],
        assignedClasses: [],
        assignedSubjects: [],
        designation: 'Teacher'
      });
      break;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  if (!teacher) {
    throw new Error('Failed to create teacher profile');
  }

  return teacher;
};

const populateTeacherContext = async (userId) => {
  await ensureTeacherProfile(userId);

  return Teacher.findOne({ userId })
    .populate('userId', 'name email phone profileImage')
    .populate('assignedClasses', 'name section academicYear room subjects routines totalStudents')
    .populate('assignedSubjects', 'name code')
    .lean();
};

const getTeacherContextOrThrow = async (userId) => {
  const teacher = await populateTeacherContext(userId);
  if (!teacher) {
    const error = new Error('Teacher profile not found');
    error.status = 404;
    throw error;
  }

  return teacher;
};

const getAllowedClassIds = async (teacher) => {
  const assigned = (teacher.assignedClasses || []).map((item) => String(item._id || item));
  if (assigned.length) return assigned;

  const teacherClasses = await Class.find({ classTeacherId: teacher._id }).select('_id').lean();
  if (teacherClasses.length) return teacherClasses.map((item) => String(item._id));

  return [];
};

const getAllowedSubjectIds = async (teacher, allowedClassIds = []) => {
  const assigned = (teacher.assignedSubjects || []).map((item) => String(item._id || item));
  if (assigned.length) return assigned;

  if (allowedClassIds.length) {
    const classDocs = await Class.find({ _id: { $in: allowedClassIds } }).select('subjects').lean();
    const ids = new Set();
    classDocs.forEach((classDoc) => {
      (classDoc.subjects || []).forEach((subjectId) => ids.add(String(subjectId)));
    });
    if (ids.size) return Array.from(ids);
  }

  return [];
};

const populateClass = (query) => query.populate('classTeacherId', 'userId employeeId designation').populate({ path: 'classTeacherId', populate: { path: 'userId', select: 'name email' } }).populate('subjects', 'name code');

const summarizeAttendanceRecords = (records) => {
  // Deduplicate records by date (one record per student per day)
  if (!records || !records.length) return { total: 0, present: 0, percentage: 0 };

  const byDate = {};
  for (const r of records) {
    // normalize date to YYYY-MM-DD in UTC to avoid timezone duplicates
    const d = r.date ? new Date(r.date) : null;
    const key = d ? d.toISOString().slice(0, 10) : String(Math.random());
    // keep the latest record for that date
    if (!byDate[key] || new Date(r._id?.getTimestamp?.() || r._id?._bsontype || 0) > new Date(byDate[key].date || 0)) {
      byDate[key] = r;
    }
  }

  const uniqueRecords = Object.values(byDate);
  const total = uniqueRecords.length;
  const present = uniqueRecords.filter((item) => item.status === 'present' || item.status === 'late').length;
  return {
    total,
    present,
    percentage: total ? Number(((present / total) * 100).toFixed(1)) : 0
  };
};

router.get('/dashboard', authenticate, authorize('teacher'), async (req, res) => {
  try {
    await ensureTeacherProfile(req.user.id);
    const data = await getTeacherDashboardData(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/classes', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const classes = await populateClass(Class.find({ _id: { $in: classIds } }).sort({ name: 1, section: 1 })).lean();

    res.json({ success: true, classes });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/subjects', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const subjectIds = await getAllowedSubjectIds(teacher, classIds);
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).sort({ name: 1 }).lean();

    res.json({ success: true, subjects });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/classes/:classId/students', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    if (!classIds.includes(String(req.params.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const students = await Student.find({ class: req.params.classId })
      .populate('userId', 'name email phone profileImage')
      .populate('class', 'name section academicYear')
      .sort({ rollNumber: 1 })
      .lean();

    const attendance = await Attendance.find({ classId: req.params.classId }).select('studentId status').lean();
    const attendanceByStudent = attendance.reduce((accumulator, item) => {
      const key = String(item.studentId);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    const studentWithSummary = students.map((student) => {
      const summary = summarizeAttendanceRecords(attendanceByStudent[String(student._id)] || []);
      return {
        ...student,
        attendanceSummary: {
          totalDays: summary.total,
          presentDays: summary.present,
          attendancePercentage: summary.percentage
        }
      };
    });

    res.json({ success: true, students: studentWithSummary });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/attendance', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    const attendance = await Attendance.find({ classId: { $in: classIds } })
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .sort({ date: -1 })
      .lean();

    const summary = attendance.reduce((accumulator, record) => {
      accumulator.total += 1;
      accumulator[record.status] = (accumulator[record.status] || 0) + 1;
      if (record.status === 'present' || record.status === 'late') accumulator.present += 1;
      return accumulator;
    }, { total: 0, present: 0, absent: 0, leave: 0, late: 0 });

    summary.attendancePercentage = summary.total ? Number(((summary.present / summary.total) * 100).toFixed(1)) : 0;

    res.json({ success: true, attendance, summary });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/attendance/class/:classId/students', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const { classId } = req.params;

    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const students = await Student.find({ class: classId })
      .populate('userId', 'name email')
      .sort({ rollNumber: 1 })
      .lean();

    const attendance = await Attendance.find({ classId }).select('studentId status date').lean();
    const attendanceByStudent = attendance.reduce((accumulator, item) => {
      const key = String(item.studentId);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    const rows = students.map((student) => {
      const summary = summarizeAttendanceRecords(attendanceByStudent[String(student._id)] || []);
      return {
        id: student._id,
        name: student.userId?.name || 'Student',
        rollNumber: student.rollNumber,
        attendanceSummary: {
          totalDays: summary.total,
          presentDays: summary.present,
          attendancePercentage: summary.percentage
        }
      };
    });

    res.json({ success: true, students: rows });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post('/attendance/bulk', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const { classId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || !records.length) {
      return res.status(400).json({ success: false, message: 'classId, date, and records are required' });
    }

    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const normalizedDate = toDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ success: false, message: 'Invalid attendance date' });
    }

    const operations = records
      .filter((record) => record.studentId && record.status)
      .map((record) => Attendance.findOneAndUpdate(
        { studentId: record.studentId, classId, date: normalizedDate },
        {
          studentId: record.studentId,
          classId,
          date: normalizedDate,
          status: record.status,
          remarks: record.remarks || '',
          recordedBy: teacher._id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ));

    await Promise.all(operations);

    const students = await Student.find({ class: classId }).select('_id').lean();
    const studentIds = students.map((item) => item._id);
    const attendance = await Attendance.find({ classId, studentId: { $in: studentIds } }).select('studentId status').lean();
    const attendanceByStudent = attendance.reduce((accumulator, item) => {
      const key = String(item.studentId);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    const summaries = studentIds.map((studentId) => {
      const summary = summarizeAttendanceRecords(attendanceByStudent[String(studentId)] || []);
      return {
        studentId,
        totalDays: summary.total,
        presentDays: summary.present,
        attendancePercentage: summary.percentage
      };
    });

    res.status(201).json({
      success: true,
      message: 'Class attendance recorded',
      updatedCount: operations.length,
      summaries
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post('/attendance', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { studentId, classId, date, status, remarks } = req.body;
    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Student, class, date, and status are required' });
    }

    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, classId, date: toDate(date) },
      { studentId, classId, date: toDate(date), status, remarks, recordedBy: teacher._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .lean();

    res.status(201).json({ success: true, message: 'Attendance recorded', attendance });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/attendance/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const existing = await Attendance.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (!classIds.includes(String(existing.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this record' });
    }

    const { studentId, classId, date, status, remarks } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        ...(studentId !== undefined && { studentId }),
        ...(classId !== undefined && { classId }),
        ...(date !== undefined && { date: toDate(date) }),
        ...(status !== undefined && { status }),
        ...(remarks !== undefined && { remarks })
      },
      { new: true }
    )
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .lean();

    res.json({ success: true, message: 'Attendance updated', attendance: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.delete('/attendance/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const existing = await Attendance.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (!classIds.includes(String(existing.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this record' });
    }

    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Attendance deleted' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/marks', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    const marks = await Marks.find({ classId: { $in: classIds } })
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .sort({ recordedDate: -1 })
      .lean();

    res.json({ success: true, marks });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post('/marks', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { studentId, classId, subjectId, exam, marks, maxMarks, remarks, recordedDate } = req.body;
    if (!studentId || !classId || !subjectId || !exam || marks === undefined) {
      return res.status(400).json({ success: false, message: 'Student, class, subject, exam, and marks are required' });
    }

    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const subjectIds = await getAllowedSubjectIds(teacher, classIds);

    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    if (subjectIds.length && !subjectIds.includes(String(subjectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this subject' });
    }

    const total = toNumber(maxMarks, 100) || 100;
    const score = toNumber(marks);
    const percentage = total ? Number(((score / total) * 100).toFixed(1)) : 0;

    const created = await Marks.create({
      studentId,
      classId,
      subjectId,
      exam,
      marks: score,
      maxMarks: total,
      percentage,
      grade: gradeFromPercentage(percentage),
      remarks,
      recordedBy: teacher._id,
      recordedDate: toDate(recordedDate) || new Date()
    });

    const result = await Marks.findById(created._id)
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .lean();

    res.status(201).json({ success: true, message: 'Marks uploaded', result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/marks/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const existing = await Marks.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Marks record not found' });
    }

    const classIds = await getAllowedClassIds(teacher);
    const subjectIds = await getAllowedSubjectIds(teacher, classIds);
    if (!classIds.includes(String(existing.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }
    if (subjectIds.length && !subjectIds.includes(String(existing.subjectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this subject' });
    }

    const { studentId, classId, subjectId, exam, marks, maxMarks, remarks, recordedDate } = req.body;
    const total = maxMarks !== undefined ? toNumber(maxMarks, 100) : toNumber(existing.maxMarks, 100);
    const score = marks !== undefined ? toNumber(marks) : toNumber(existing.marks);
    const percentage = total ? Number(((score / total) * 100).toFixed(1)) : 0;

    const updated = await Marks.findByIdAndUpdate(
      req.params.id,
      {
        ...(studentId !== undefined && { studentId }),
        ...(classId !== undefined && { classId }),
        ...(subjectId !== undefined && { subjectId }),
        ...(exam !== undefined && { exam }),
        ...(marks !== undefined && { marks: score }),
        ...(maxMarks !== undefined && { maxMarks: total }),
        ...(remarks !== undefined && { remarks }),
        ...(recordedDate !== undefined && { recordedDate: toDate(recordedDate) || existing.recordedDate }),
        percentage,
        grade: gradeFromPercentage(percentage),
        recordedBy: teacher._id
      },
      { new: true }
    )
      .populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } })
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .lean();

    res.json({ success: true, message: 'Marks updated', result: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.delete('/marks/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const existing = await Marks.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Marks record not found' });
    }

    const classIds = await getAllowedClassIds(teacher);
    const subjectIds = await getAllowedSubjectIds(teacher, classIds);
    if (!classIds.includes(String(existing.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }
    if (subjectIds.length && !subjectIds.includes(String(existing.subjectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this subject' });
    }

    await Marks.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Marks deleted' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/assignments', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    const assignments = await Assignment.find({ classId: { $in: classIds } })
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .populate({ path: 'submissions.studentId', populate: { path: 'userId', select: 'name' }, select: 'rollNumber userId' })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/assignments/:assignmentId/submissions', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate({ path: 'submissions.studentId', populate: { path: 'userId', select: 'name email' }, select: 'rollNumber userId' })
      .lean();

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (!classIds.includes(String(assignment.classId))) return res.status(403).json({ success: false, message: 'You do not have access to this assignment' });

    const submissions = (assignment.submissions || []).map((s) => ({
      studentId: s.studentId?._id || s.studentId,
      name: s.studentId?.userId?.name || 'Student',
      rollNumber: s.studentId?.rollNumber || '',
      submittedFile: s.submittedFile || '',
      submittedDate: s.submittedDate || null,
      marksObtained: s.marksObtained,
      feedback: s.feedback,
      viewed: Boolean(s.viewed)
    }));

    res.json({ success: true, submissions });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post('/assignments', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { classId, subjectId, title, description, instructions, dueDate, totalMarks, attachments } = req.body;
    if (!classId || !subjectId || !title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Class, subject, title, and due date are required' });
    }

    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const subjectIds = await getAllowedSubjectIds(teacher, classIds);

    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    if (subjectIds.length && !subjectIds.includes(String(subjectId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this subject' });
    }

    const assignment = await Assignment.create({
      classId,
      subjectId,
      title,
      description,
      instructions,
      assignedBy: teacher._id,
      dueDate: toDate(dueDate),
      totalMarks: toNumber(totalMarks, 10),
      attachments: toArray(attachments)
    });

    const result = await Assignment.findById(assignment._id)
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .lean();

    res.status(201).json({ success: true, message: 'Assignment created', assignment: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/assignments/:assignmentId/grade', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const classIds = await getAllowedClassIds(teacher);
    if (!classIds.includes(String(assignment.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this assignment' });
    }

    const { studentId, marksObtained, feedback } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const nextSubmissions = [...(assignment.submissions || [])];
    const existingIndex = nextSubmissions.findIndex((entry) => String(entry.studentId) === String(studentId));
    const submission = {
      studentId,
      submittedFile: nextSubmissions[existingIndex]?.submittedFile || '',
      submittedDate: nextSubmissions[existingIndex]?.submittedDate || null,
      marksObtained: marksObtained !== undefined ? toNumber(marksObtained) : nextSubmissions[existingIndex]?.marksObtained,
      feedback: feedback !== undefined ? feedback : nextSubmissions[existingIndex]?.feedback,
      gradedDate: new Date()
    };

    if (existingIndex >= 0) {
      nextSubmissions[existingIndex] = submission;
    } else {
      nextSubmissions.push(submission);
    }

    assignment.submissions = nextSubmissions;
    await assignment.save();

    const updated = await Assignment.findById(assignment._id)
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .lean();

    res.json({ success: true, message: 'Assignment graded', assignment: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/assignments/:assignmentId/submissions/mark-read', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const classIds = await getAllowedClassIds(teacher);
    if (!classIds.includes(String(assignment.classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this assignment' });
    }

    const nextSubmissions = (assignment.submissions || []).map((s) => ({
      ...s.toObject ? s.toObject() : s,
      viewed: true
    }));

    assignment.submissions = nextSubmissions;
    await assignment.save();

    const updated = await Assignment.findById(assignment._id)
      .populate('classId', 'name section academicYear')
      .populate('subjectId', 'name code')
      .lean();

    res.json({ success: true, message: 'All submissions marked read', assignment: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/routine', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);
    const classes = await Class.find({ _id: { $in: classIds } }).populate('subjects', 'name code').lean();

    const routine = classes.flatMap((classDoc) =>
      (classDoc.routines || []).map((entry) => ({
        classId: classDoc._id,
        className: /^class\s+/i.test(String(classDoc.name || '').trim()) ? classDoc.name : `Class ${classDoc.name}`.trim(),
        day: entry.day,
        periods: (entry.periods || []).map((period) => ({
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          subject: period.subject || null,
          teacher: period.teacher || null
        }))
      }))
    );

    res.json({ success: true, routine });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/routine', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const { classId, day, periods } = req.body;
    const normalizedDay = String(day || '').trim();

    if (!classId || !normalizedDay || !Array.isArray(periods)) {
      return res.status(400).json({ success: false, message: 'classId, day, and periods are required' });
    }

    const classIds = await getAllowedClassIds(teacher);
    if (!classIds.includes(String(classId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const nextRoutines = Array.isArray(classDoc.routines) ? [...classDoc.routines] : [];
    const index = nextRoutines.findIndex((entry) => String(entry.day || '').trim().toLowerCase() === normalizedDay.toLowerCase());

    const shouldLookupSubjects = periods.some((period) => {
      if (!period) return false;
      let value = period.subject;
      if (value && typeof value === 'object') {
        value = value._id || value.id || value.value;
      }
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      return Boolean(trimmed) && !mongoose.Types.ObjectId.isValid(trimmed);
    });

    const subjectDocs = shouldLookupSubjects
      ? await Subject.find({ _id: { $in: classDoc.subjects || [] } }).select('_id name code').lean()
      : null;

    const normalizeSubjectId = (value) => {
      if (!value) return null;

      let raw = value;
      if (raw && typeof raw === 'object') {
        raw = raw._id || raw.id || raw.value;
      }

      if (typeof raw === 'string') {
        raw = raw.trim();
      }

      if (!raw) return null;

      if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) {
        return raw;
      }

      if (!subjectDocs || !Array.isArray(subjectDocs)) {
        const error = new Error('Subject must be a valid id (ObjectId).');
        error.status = 400;
        throw error;
      }

      const lowered = String(raw).toLowerCase();
      const match = subjectDocs.find((subject) =>
        String(subject.code || '').toLowerCase() === lowered
        || String(subject.name || '').toLowerCase() === lowered
      );

      if (!match) {
        const error = new Error(`Unknown subject '${raw}'. Use subject id or a subject code/name from the selected class.`);
        error.status = 400;
        throw error;
      }

      return match._id;
    };

    const normalizeTeacherId = (value) => {
      if (!value) return teacher._id;
      let raw = value;
      if (raw && typeof raw === 'object') {
        raw = raw._id || raw.id || raw.value;
      }
      if (typeof raw === 'string') raw = raw.trim();
      if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) return raw;
      return teacher._id;
    };

    const normalizedPeriods = periods.map((period, periodIndex) => {
      if (!period || typeof period !== 'object') {
        const error = new Error(`Periods JSON entry at index ${periodIndex} must be an object.`);
        error.status = 400;
        throw error;
      }

      return {
        periodNumber: toNumber(period.periodNumber),
        startTime: typeof period.startTime === 'string' ? period.startTime.trim() : period.startTime,
        endTime: typeof period.endTime === 'string' ? period.endTime.trim() : period.endTime,
        subject: normalizeSubjectId(period.subject),
        teacher: normalizeTeacherId(period.teacher)
      };
    });

    if (index >= 0) {
      nextRoutines[index].periods = normalizedPeriods;
    } else {
      nextRoutines.push({ day: normalizedDay, periods: normalizedPeriods });
    }

    classDoc.routines = nextRoutines;
    classDoc.updatedAt = new Date();
    await classDoc.save();

    const updated = await Class.findById(classId).populate('subjects', 'name code').lean();
    res.json({ success: true, message: 'Routine updated', routine: updated.routines });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.get('/notices', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const classIds = await getAllowedClassIds(teacher);

    const notices = await Notice.find({
      $or: [
        { targetAudience: { $in: ['teacher'] } },
        { targetClass: { $in: classIds } },
        { createdBy: req.user.id }
      ]
    })
      .populate('createdBy', 'name email role')
      .populate('targetClass', 'name section academicYear')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notices });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.post('/notices', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const { title, content, category, attachments, targetAudience, targetClass, isUrgent, expiryDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const audience = toArray(targetAudience).length ? toArray(targetAudience) : ['student'];
    const classIds = await getAllowedClassIds(teacher);
    const normalizedTargetClass = targetClass ? String(targetClass) : null;

    if (normalizedTargetClass && !classIds.includes(normalizedTargetClass)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const notice = await Notice.create({
      title,
      content,
      category: category || 'general',
      attachments: toArray(attachments),
      createdBy: req.user.id,
      targetAudience: audience,
      targetClass: normalizedTargetClass,
      isUrgent: toBoolean(isUrgent),
      expiryDate: toDate(expiryDate)
    });

    const createdNotice = await Notice.findById(notice._id)
      .populate('createdBy', 'name email role')
      .populate('targetClass', 'name section academicYear')
      .lean();

    res.status(201).json({ success: true, message: 'Notice created', notice: createdNotice });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/notices/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await getTeacherContextOrThrow(req.user.id);
    const existing = await Notice.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (String(existing.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own notices' });
    }

    const classIds = await getAllowedClassIds(teacher);
    const { title, content, category, attachments, targetAudience, targetClass, isUrgent, expiryDate } = req.body;
    const normalizedTargetClass = targetClass ? String(targetClass) : null;

    if (normalizedTargetClass && !classIds.includes(normalizedTargetClass)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this class' });
    }

    const updated = await Notice.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(attachments !== undefined && { attachments: toArray(attachments) }),
        ...(targetAudience !== undefined && { targetAudience: toArray(targetAudience).length ? toArray(targetAudience) : ['student'] }),
        ...(targetClass !== undefined && { targetClass: normalizedTargetClass }),
        ...(isUrgent !== undefined && { isUrgent: toBoolean(isUrgent) }),
        ...(expiryDate !== undefined && { expiryDate: toDate(expiryDate) }),
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('targetClass', 'name section academicYear')
      .lean();

    res.json({ success: true, message: 'Notice updated', notice: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.delete('/notices/:id', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const existing = await Notice.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (String(existing.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own notices' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// Get teacher profile (populated with user, classes and subjects)
router.get('/profile', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await populateTeacherContext(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

router.put('/profile', authenticate, authorize('teacher'), async (req, res) => {
  try {
    await ensureTeacherProfile(req.user.id);
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { qualifications, specialization, assignedClasses, assignedSubjects, dateOfJoining, salary, experience, designation, department, certifications } = req.body;

    if (qualifications !== undefined) teacher.qualifications = toArray(qualifications);
    if (specialization !== undefined) teacher.specialization = specialization;
    if (assignedClasses !== undefined) teacher.assignedClasses = toArray(assignedClasses);
    if (assignedSubjects !== undefined) teacher.assignedSubjects = toArray(assignedSubjects);
    if (dateOfJoining !== undefined) teacher.dateOfJoining = toDate(dateOfJoining);
    if (salary !== undefined) teacher.salary = toNumber(salary);
    if (experience !== undefined) teacher.experience = toNumber(experience);
    if (designation !== undefined) teacher.designation = designation;
    if (department !== undefined) teacher.department = department;
    if (certifications !== undefined) teacher.certifications = toArray(certifications);

    teacher.updatedAt = new Date();
    await teacher.save();

    const updated = await populateTeacherContext(req.user.id);
    res.json({ success: true, message: 'Profile updated', teacher: updated });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;