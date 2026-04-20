const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getAdminDashboardData } = require('../services/dashboardService');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const Event = require('../models/Event');
const LibraryBook = require('../models/Library');

const router = express.Router();

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    if (value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
    }

    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return value ? [value] : [];
};

const toJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getGrade = (percentage) => {
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

const enrichMarks = (payload) => {
  const marks = toNumber(payload.marks);
  const maxMarks = toNumber(payload.maxMarks, 100) || 100;
  const percentage = maxMarks ? Number(((marks / maxMarks) * 100).toFixed(1)) : 0;

  return {
    ...payload,
    marks,
    maxMarks,
    percentage,
    grade: payload.grade || getGrade(percentage),
    recordedDate: toDate(payload.recordedDate) || new Date()
  };
};

const populateStudent = (query) => query.populate('userId', 'name email phone profileImage role').populate('class', 'name section academicYear room');
const populateTeacher = (query) => query.populate('userId', 'name email phone profileImage role').populate('assignedClasses', 'name section academicYear').populate('assignedSubjects', 'name code');
const populateClass = (query) => query.populate('classTeacherId', 'employeeId designation department').populate({ path: 'classTeacherId', select: 'employeeId designation department', populate: { path: 'userId', select: 'name email phone' } }).populate('subjects', 'name code');
const populateAssignment = (query) => query.populate('classId', 'name section academicYear').populate('subjectId', 'name code').populate({ path: 'assignedBy', select: 'employeeId', populate: { path: 'userId', select: 'name email' } });
const populateMarks = (query) => query.populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } }).populate('classId', 'name section academicYear').populate('subjectId', 'name code').populate({ path: 'recordedBy', select: 'employeeId', populate: { path: 'userId', select: 'name email' } });
const populateAttendance = (query) => query.populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } }).populate('classId', 'name section academicYear').populate({ path: 'recordedBy', select: 'employeeId', populate: { path: 'userId', select: 'name email' } });
const populateFee = (query) => query.populate({ path: 'studentId', select: 'rollNumber class userId', populate: { path: 'userId', select: 'name email' } });
const populateNotice = (query) => query.populate('createdBy', 'name email role').populate('targetClass', 'name section academicYear');
const populateEvent = (query) => query.populate('organizer', 'name email role');
const populateLibrary = (query) => query.populate('issues.issuedTo', 'name email role');

router.get('/dashboard', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const data = await getAdminDashboardData();
  res.json({ success: true, data });
}));

router.get('/students', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const students = await populateStudent(Student.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, students });
}));

router.post('/students', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, phone, rollNumber, enrollmentNumber, classId, parentId, dateOfAdmission, bloodGroup, emergencyContact, guardianName, guardianPhone, guardianEmail, medicalConditions } = req.body;

  if (!name || !email || !password || !rollNumber || !classId) {
    return res.status(400).json({ success: false, message: 'Name, email, password, roll number, and class are required' });
  }

  const user = await User.create({ name, email, password, phone, role: 'student' });

  try {
    const student = await Student.create({
      userId: user._id,
      rollNumber,
      enrollmentNumber,
      class: classId,
      parentId: parentId || null,
      dateOfAdmission: toDate(dateOfAdmission),
      bloodGroup,
      emergencyContact,
      guardianName,
      guardianPhone,
      guardianEmail,
      medicalConditions,
      fees: {
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        lastPaidDate: null
      }
    });

    const createdStudent = await populateStudent(Student.findById(student._id)).lean();
    res.status(201).json({ success: true, message: 'Student created', student: createdStudent });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
}));

router.put('/students/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const user = await User.findById(student.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Linked user not found' });
  }

  const { name, email, password, phone, rollNumber, enrollmentNumber, classId, parentId, dateOfAdmission, bloodGroup, emergencyContact, guardianName, guardianPhone, guardianEmail, medicalConditions } = req.body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (password) user.password = password;

  if (rollNumber !== undefined) student.rollNumber = rollNumber;
  if (enrollmentNumber !== undefined) student.enrollmentNumber = enrollmentNumber;
  if (classId !== undefined) student.class = classId;
  if (parentId !== undefined) student.parentId = parentId || null;
  if (dateOfAdmission !== undefined) student.dateOfAdmission = toDate(dateOfAdmission);
  if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
  if (emergencyContact !== undefined) student.emergencyContact = emergencyContact;
  if (guardianName !== undefined) student.guardianName = guardianName;
  if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
  if (guardianEmail !== undefined) student.guardianEmail = guardianEmail;
  if (medicalConditions !== undefined) student.medicalConditions = medicalConditions;

  user.updatedAt = new Date();
  student.updatedAt = new Date();
  await user.save();
  await student.save();

  const updatedStudent = await populateStudent(Student.findById(student._id)).lean();
  res.json({ success: true, message: 'Student updated', student: updatedStudent });
}));

router.delete('/students/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  await User.findByIdAndDelete(student.userId);
  await Student.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Student deleted' });
}));

router.get('/teachers', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const teachers = await populateTeacher(Teacher.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, teachers });
}));

router.post('/teachers', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, phone, employeeId, qualifications, specialization, assignedClasses, assignedSubjects, dateOfJoining, salary, experience, designation, department, certifications } = req.body;

  if (!name || !email || !password || !employeeId) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and employee ID are required' });
  }

  const user = await User.create({ name, email, password, phone, role: 'teacher' });

  try {
    const teacher = await Teacher.create({
      userId: user._id,
      employeeId,
      qualifications: toArray(qualifications),
      specialization,
      assignedClasses: toArray(assignedClasses),
      assignedSubjects: toArray(assignedSubjects),
      dateOfJoining: toDate(dateOfJoining),
      salary: toNumber(salary),
      experience: toNumber(experience),
      designation,
      department,
      certifications: toArray(certifications)
    });

    const createdTeacher = await populateTeacher(Teacher.findById(teacher._id)).lean();
    res.status(201).json({ success: true, message: 'Teacher created', teacher: createdTeacher });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
}));

router.put('/teachers/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  const user = await User.findById(teacher.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Linked user not found' });
  }

  const { name, email, password, phone, employeeId, qualifications, specialization, assignedClasses, assignedSubjects, dateOfJoining, salary, experience, designation, department, certifications } = req.body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (password) user.password = password;

  if (employeeId !== undefined) teacher.employeeId = employeeId;
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

  user.updatedAt = new Date();
  teacher.updatedAt = new Date();
  await user.save();
  await teacher.save();

  const updatedTeacher = await populateTeacher(Teacher.findById(teacher._id)).lean();
  res.json({ success: true, message: 'Teacher updated', teacher: updatedTeacher });
}));

router.delete('/teachers/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  await User.findByIdAndDelete(teacher.userId);
  await Teacher.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Teacher deleted' });
}));

router.get('/classes', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const classes = await populateClass(Class.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, classes });
}));

router.post('/classes', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, section, classTeacherId, academicYear, totalStudents, room, startTime, endTime, subjects, routines } = req.body;

  if (!name || !academicYear) {
    return res.status(400).json({ success: false, message: 'Name and academic year are required' });
  }

  const createdClass = await Class.create({
    name,
    section: section || '',
    classTeacherId: classTeacherId || null,
    academicYear,
    totalStudents: toNumber(totalStudents),
    room,
    timings: { startTime, endTime },
    subjects: toArray(subjects),
    routines: toJsonArray(routines)
  });

  const classDoc = await populateClass(Class.findById(createdClass._id)).lean();
  res.status(201).json({ success: true, message: 'Class created', class: classDoc });
}));

router.put('/classes/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, section, classTeacherId, academicYear, totalStudents, room, startTime, endTime, subjects, routines } = req.body;

  const updatedClass = await Class.findByIdAndUpdate(
    req.params.id,
    {
      ...(name !== undefined && { name }),
      ...(section !== undefined && { section: section || '' }),
      ...(classTeacherId !== undefined && { classTeacherId: classTeacherId || null }),
      ...(academicYear !== undefined && { academicYear }),
      ...(totalStudents !== undefined && { totalStudents: toNumber(totalStudents) }),
      ...(room !== undefined && { room }),
      ...(startTime !== undefined || endTime !== undefined ? { timings: { startTime, endTime } } : {}),
      ...(subjects !== undefined && { subjects: toArray(subjects) }),
      ...(routines !== undefined && { routines: toJsonArray(routines) }),
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!updatedClass) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  const classDoc = await populateClass(Class.findById(updatedClass._id)).lean();
  res.json({ success: true, message: 'Class updated', class: classDoc });
}));

router.delete('/classes/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const deletedClass = await Class.findByIdAndDelete(req.params.id);
  if (!deletedClass) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  res.json({ success: true, message: 'Class deleted' });
}));

router.get('/subjects', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const subjects = await Subject.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, subjects });
}));

router.post('/subjects', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, code, description, creditHours, maxMarks, passingMarks } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  const subject = await Subject.create({
    name,
    code,
    description,
    creditHours: toNumber(creditHours),
    maxMarks: toNumber(maxMarks, 100),
    passingMarks: toNumber(passingMarks, 35)
  });

  res.status(201).json({ success: true, message: 'Subject created', subject });
}));

router.put('/subjects/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, code, description, creditHours, maxMarks, passingMarks } = req.body;

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description }),
      ...(creditHours !== undefined && { creditHours: toNumber(creditHours) }),
      ...(maxMarks !== undefined && { maxMarks: toNumber(maxMarks, 100) }),
      ...(passingMarks !== undefined && { passingMarks: toNumber(passingMarks, 35) }),
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  res.json({ success: true, message: 'Subject updated', subject });
}));

router.delete('/subjects/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  res.json({ success: true, message: 'Subject deleted' });
}));

router.get('/attendance', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const attendance = await populateAttendance(Attendance.find().sort({ date: -1 })).lean();
  res.json({ success: true, attendance });
}));

router.post('/attendance', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { studentId, classId, date, status, remarks, recordedBy } = req.body;

  if (!studentId || !classId || !date || !status) {
    return res.status(400).json({ success: false, message: 'Student, class, date, and status are required' });
  }

  const record = await Attendance.create({
    studentId,
    classId,
    date: toDate(date),
    status,
    remarks,
    recordedBy: recordedBy || null
  });

  const populated = await populateAttendance(Attendance.findById(record._id)).lean();
  res.status(201).json({ success: true, message: 'Attendance recorded', attendance: populated });
}));

router.put('/attendance/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { studentId, classId, date, status, remarks, recordedBy } = req.body;

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      ...(studentId !== undefined && { studentId }),
      ...(classId !== undefined && { classId }),
      ...(date !== undefined && { date: toDate(date) }),
      ...(status !== undefined && { status }),
      ...(remarks !== undefined && { remarks }),
      ...(recordedBy !== undefined && { recordedBy: recordedBy || null })
    },
    { new: true }
  );

  if (!attendance) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  const populated = await populateAttendance(Attendance.findById(attendance._id)).lean();
  res.json({ success: true, message: 'Attendance updated', attendance: populated });
}));

router.delete('/attendance/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndDelete(req.params.id);
  if (!attendance) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  res.json({ success: true, message: 'Attendance deleted' });
}));

router.get('/results', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const results = await populateMarks(Marks.find().sort({ recordedDate: -1 })).lean();
  res.json({ success: true, results });
}));

router.post('/results', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { studentId, classId, subjectId, exam, marks, maxMarks, remarks, recordedBy, recordedDate } = req.body;

  if (!studentId || !classId || !subjectId || !exam || marks === undefined) {
    return res.status(400).json({ success: false, message: 'Student, class, subject, exam, and marks are required' });
  }

  const result = await Marks.create({
    studentId,
    classId,
    subjectId,
    exam,
    ...enrichMarks({ marks, maxMarks, remarks, recordedBy, recordedDate })
  });

  const populated = await populateMarks(Marks.findById(result._id)).lean();
  res.status(201).json({ success: true, message: 'Result recorded', result: populated });
}));

router.put('/results/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const existing = await Marks.findById(req.params.id).lean();
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Result not found' });
  }

  const { studentId, classId, subjectId, exam, marks, maxMarks, remarks, recordedBy, recordedDate } = req.body;
  const payload = {};

  if (studentId !== undefined) payload.studentId = studentId;
  if (classId !== undefined) payload.classId = classId;
  if (subjectId !== undefined) payload.subjectId = subjectId;
  if (exam !== undefined) payload.exam = exam;
  if (marks !== undefined) payload.marks = toNumber(marks);
  if (maxMarks !== undefined) payload.maxMarks = toNumber(maxMarks, 100);
  if (remarks !== undefined) payload.remarks = remarks;
  if (recordedBy !== undefined) payload.recordedBy = recordedBy || null;
  if (recordedDate !== undefined) payload.recordedDate = toDate(recordedDate);

  const nextMarks = payload.marks !== undefined ? payload.marks : toNumber(existing.marks);
  const nextMaxMarks = payload.maxMarks !== undefined ? payload.maxMarks : toNumber(existing.maxMarks, 100);
  if (payload.marks !== undefined || payload.maxMarks !== undefined) {
    const percentage = nextMaxMarks ? Number(((nextMarks / nextMaxMarks) * 100).toFixed(1)) : 0;
    payload.percentage = percentage;
    payload.grade = getGrade(percentage);
  }

  const result = await Marks.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!result) {
    return res.status(404).json({ success: false, message: 'Result not found' });
  }

  const populated = await populateMarks(Marks.findById(result._id)).lean();
  res.json({ success: true, message: 'Result updated', result: populated });
}));

router.delete('/results/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await Marks.findByIdAndDelete(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Result not found' });
  }

  res.json({ success: true, message: 'Result deleted' });
}));

router.get('/assignments', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const assignments = await populateAssignment(Assignment.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, assignments });
}));

router.post('/assignments', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { classId, subjectId, title, description, instructions, assignedBy, dueDate, totalMarks, attachments } = req.body;

  if (!classId || !subjectId || !title || !dueDate) {
    return res.status(400).json({ success: false, message: 'Class, subject, title, and due date are required' });
  }

  const assignment = await Assignment.create({
    classId,
    subjectId,
    title,
    description,
    instructions,
    assignedBy: assignedBy || null,
    dueDate: toDate(dueDate),
    totalMarks: toNumber(totalMarks, 10),
    attachments: toArray(attachments)
  });

  const populated = await populateAssignment(Assignment.findById(assignment._id)).lean();
  res.status(201).json({ success: true, message: 'Assignment created', assignment: populated });
}));

router.put('/assignments/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { classId, subjectId, title, description, instructions, assignedBy, dueDate, totalMarks, attachments } = req.body;

  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    {
      ...(classId !== undefined && { classId }),
      ...(subjectId !== undefined && { subjectId }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(instructions !== undefined && { instructions }),
      ...(assignedBy !== undefined && { assignedBy: assignedBy || null }),
      ...(dueDate !== undefined && { dueDate: toDate(dueDate) }),
      ...(totalMarks !== undefined && { totalMarks: toNumber(totalMarks, 10) }),
      ...(attachments !== undefined && { attachments: toArray(attachments) })
    },
    { new: true }
  );

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const populated = await populateAssignment(Assignment.findById(assignment._id)).lean();
  res.json({ success: true, message: 'Assignment updated', assignment: populated });
}));

router.delete('/assignments/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  res.json({ success: true, message: 'Assignment deleted' });
}));

router.get('/fees', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const fees = await populateFee(Fee.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, fees });
}));

router.post('/fees', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { studentId, academicYear, feeType, amount, dueDate, paidDate, status, transactionId, paymentMethod, remarks } = req.body;

  if (!studentId || !academicYear || !feeType || amount === undefined) {
    return res.status(400).json({ success: false, message: 'Student, academic year, fee type, and amount are required' });
  }

  const fee = await Fee.create({
    studentId,
    academicYear,
    feeType,
    amount: toNumber(amount),
    dueDate: toDate(dueDate),
    paidDate: toDate(paidDate),
    status,
    transactionId,
    paymentMethod,
    remarks
  });

  const populated = await populateFee(Fee.findById(fee._id)).lean();
  res.status(201).json({ success: true, message: 'Fee created', fee: populated });
}));

router.put('/fees/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { studentId, academicYear, feeType, amount, dueDate, paidDate, status, transactionId, paymentMethod, remarks } = req.body;

  const fee = await Fee.findByIdAndUpdate(
    req.params.id,
    {
      ...(studentId !== undefined && { studentId }),
      ...(academicYear !== undefined && { academicYear }),
      ...(feeType !== undefined && { feeType }),
      ...(amount !== undefined && { amount: toNumber(amount) }),
      ...(dueDate !== undefined && { dueDate: toDate(dueDate) }),
      ...(paidDate !== undefined && { paidDate: toDate(paidDate) }),
      ...(status !== undefined && { status }),
      ...(transactionId !== undefined && { transactionId }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(remarks !== undefined && { remarks })
    },
    { new: true }
  );

  if (!fee) {
    return res.status(404).json({ success: false, message: 'Fee record not found' });
  }

  const populated = await populateFee(Fee.findById(fee._id)).lean();
  res.json({ success: true, message: 'Fee updated', fee: populated });
}));

router.delete('/fees/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) {
    return res.status(404).json({ success: false, message: 'Fee record not found' });
  }

  res.json({ success: true, message: 'Fee deleted' });
}));

router.get('/library', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const books = await populateLibrary(LibraryBook.find().sort({ dateAdded: -1 })).lean();
  res.json({ success: true, books });
}));

router.post('/library', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { bookId, title, author, publisher, isbn, publicationYear, category, quantity, availableQuantity, location, price, coverImage } = req.body;

  if (!bookId || !title || !author) {
    return res.status(400).json({ success: false, message: 'Book ID, title, and author are required' });
  }

  const book = await LibraryBook.create({
    bookId,
    title,
    author,
    publisher,
    isbn,
    publicationYear: toNumber(publicationYear),
    category,
    quantity: toNumber(quantity, 1),
    availableQuantity: availableQuantity !== undefined ? toNumber(availableQuantity) : toNumber(quantity, 1),
    location,
    price: toNumber(price),
    coverImage
  });

  res.status(201).json({ success: true, message: 'Book created', book });
}));

router.put('/library/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { bookId, title, author, publisher, isbn, publicationYear, category, quantity, availableQuantity, location, price, coverImage } = req.body;

  const book = await LibraryBook.findByIdAndUpdate(
    req.params.id,
    {
      ...(bookId !== undefined && { bookId }),
      ...(title !== undefined && { title }),
      ...(author !== undefined && { author }),
      ...(publisher !== undefined && { publisher }),
      ...(isbn !== undefined && { isbn }),
      ...(publicationYear !== undefined && { publicationYear: toNumber(publicationYear) }),
      ...(category !== undefined && { category }),
      ...(quantity !== undefined && { quantity: toNumber(quantity, 1) }),
      ...(availableQuantity !== undefined && { availableQuantity: toNumber(availableQuantity) }),
      ...(location !== undefined && { location }),
      ...(price !== undefined && { price: toNumber(price) }),
      ...(coverImage !== undefined && { coverImage })
    },
    { new: true }
  );

  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  res.json({ success: true, message: 'Book updated', book });
}));

router.delete('/library/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const book = await LibraryBook.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  res.json({ success: true, message: 'Book deleted' });
}));

router.get('/notices', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const notices = await populateNotice(Notice.find().sort({ createdAt: -1 })).lean();
  res.json({ success: true, notices });
}));

router.post('/notices', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { title, content, category, attachments, createdBy, targetAudience, targetClass, isUrgent, expiryDate } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const audiences = toArray(targetAudience);
  const notice = await Notice.create({
    title,
    content,
    category,
    attachments: toArray(attachments),
    createdBy: createdBy || req.user.id,
    targetAudience: audiences.length ? audiences : ['student'],
    targetClass: targetClass || null,
    isUrgent: Boolean(isUrgent),
    expiryDate: toDate(expiryDate)
  });

  const populated = await populateNotice(Notice.findById(notice._id)).lean();
  res.status(201).json({ success: true, message: 'Notice created', notice: populated });
}));

router.put('/notices/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { title, content, category, attachments, createdBy, targetAudience, targetClass, isUrgent, expiryDate } = req.body;

  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(attachments !== undefined && { attachments: toArray(attachments) }),
      ...(createdBy !== undefined && { createdBy: createdBy || null }),
      ...(targetAudience !== undefined && { targetAudience: toArray(targetAudience) }),
      ...(targetClass !== undefined && { targetClass: targetClass || null }),
      ...(isUrgent !== undefined && { isUrgent: Boolean(isUrgent) }),
      ...(expiryDate !== undefined && { expiryDate: toDate(expiryDate) })
    },
    { new: true }
  );

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  const populated = await populateNotice(Notice.findById(notice._id)).lean();
  res.json({ success: true, message: 'Notice updated', notice: populated });
}));

router.delete('/notices/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  res.json({ success: true, message: 'Notice deleted' });
}));

router.get('/events', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const events = await populateEvent(Event.find().sort({ startDate: -1 })).lean();
  res.json({ success: true, events });
}));

router.post('/events', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, startTime, endTime, location, eventType, organizer, targetAudience, maxAttendees, poster, attachments } = req.body;

  if (!title || !startDate) {
    return res.status(400).json({ success: false, message: 'Title and start date are required' });
  }

  const event = await Event.create({
    title,
    description,
    startDate: toDate(startDate),
    endDate: toDate(endDate),
    startTime,
    endTime,
    location,
    eventType,
    organizer: organizer || req.user.id,
    targetAudience: toArray(targetAudience),
    maxAttendees: toNumber(maxAttendees),
    poster,
    attachments: toArray(attachments)
  });

  const populated = await populateEvent(Event.findById(event._id)).lean();
  res.status(201).json({ success: true, message: 'Event created', event: populated });
}));

router.put('/events/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, startTime, endTime, location, eventType, organizer, targetAudience, maxAttendees, poster, attachments } = req.body;

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: toDate(startDate) }),
      ...(endDate !== undefined && { endDate: toDate(endDate) }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(location !== undefined && { location }),
      ...(eventType !== undefined && { eventType }),
      ...(organizer !== undefined && { organizer: organizer || null }),
      ...(targetAudience !== undefined && { targetAudience: toArray(targetAudience) }),
      ...(maxAttendees !== undefined && { maxAttendees: toNumber(maxAttendees) }),
      ...(poster !== undefined && { poster }),
      ...(attachments !== undefined && { attachments: toArray(attachments) })
    },
    { new: true }
  );

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const populated = await populateEvent(Event.findById(event._id)).lean();
  res.json({ success: true, message: 'Event updated', event: populated });
}));

router.delete('/events/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  res.json({ success: true, message: 'Event deleted' });
}));

router.get('/reports', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const [students, teachers, classes, subjects, attendance, results, assignments, fees, books, notices, events] = await Promise.all([
    Student.find().populate('userId', 'name email').populate('class', 'name section').lean(),
    Teacher.find().populate('userId', 'name email').lean(),
    Class.find().populate('subjects', 'name code').lean(),
    Subject.find().lean(),
    Attendance.find().populate({ path: 'studentId', select: 'rollNumber userId', populate: { path: 'userId', select: 'name email' } }).populate('classId', 'name section').lean(),
    Marks.find().populate({ path: 'studentId', select: 'rollNumber userId', populate: { path: 'userId', select: 'name email' } }).populate('classId', 'name section').populate('subjectId', 'name code').lean(),
    Assignment.find().populate('classId', 'name section').populate('subjectId', 'name code').lean(),
    Fee.find().populate({ path: 'studentId', select: 'rollNumber userId', populate: { path: 'userId', select: 'name email' } }).lean(),
    LibraryBook.find().lean(),
    Notice.find().sort({ createdAt: -1 }).limit(10).lean(),
    Event.find().sort({ startDate: 1 }).limit(10).lean()
  ]);

  const pendingFeesAmount = fees.reduce((sum, fee) => sum + (fee.status === 'paid' ? 0 : toNumber(fee.amount)), 0);
  const paidFeeCount = fees.filter((fee) => fee.status === 'paid').length;
  const attendanceRate = attendance.length
    ? Number(((attendance.filter((record) => ['present', 'late'].includes(record.status)).length / attendance.length) * 100).toFixed(1))
    : 0;
  const averageMarks = results.length
    ? Number((results.reduce((sum, record) => sum + toNumber(record.percentage), 0) / results.length).toFixed(1))
    : 0;

  res.json({
    success: true,
    report: {
      summary: {
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        subjects: subjects.length,
        attendanceRate,
        averageMarks,
        totalAssignments: assignments.length,
        totalFees: fees.length,
        paidFees: paidFeeCount,
        pendingFeesAmount,
        libraryBooks: books.length,
        notices: notices.length,
        events: events.length
      },
      lowAttendanceStudents: students
        .map((student) => {
          const studentRecords = attendance.filter((record) => String(record.studentId?._id || record.studentId) === String(student._id));
          const studentRate = studentRecords.length
            ? Number(((studentRecords.filter((record) => ['present', 'late'].includes(record.status)).length / studentRecords.length) * 100).toFixed(1))
            : 0;

          return {
            id: student._id,
            name: student.userId?.name || 'Student',
            rollNumber: student.rollNumber,
            className: student.class ? `${student.class.name}${student.class.section ? `-${student.class.section}` : ''}` : 'Unassigned',
            attendanceRate: studentRate
          };
        })
        .filter((student) => student.attendanceRate > 0 && student.attendanceRate < 75)
        .sort((a, b) => a.attendanceRate - b.attendanceRate)
        .slice(0, 10),
      feeSummary: fees.slice(0, 10).map((fee) => ({
        id: fee._id,
        student: fee.studentId?.userId?.name || 'Student',
        rollNumber: fee.studentId?.rollNumber || '',
        amount: fee.amount,
        status: fee.status,
        dueDate: fee.dueDate || null
      })),
      recentResults: results.slice(0, 10).map((result) => ({
        id: result._id,
        student: result.studentId?.userId?.name || 'Student',
        rollNumber: result.studentId?.rollNumber || '',
        className: result.classId ? `${result.classId.name}${result.classId.section ? `-${result.classId.section}` : ''}` : '',
        subject: result.subjectId?.name || 'Subject',
        percentage: result.percentage,
        grade: result.grade
      }))
    }
  });
}));

module.exports = router;
