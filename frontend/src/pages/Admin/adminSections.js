const TARGET_AUDIENCE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' },
  { label: 'Parent', value: 'parent' }
]

const NOTICE_CATEGORY_OPTIONS = [
  { label: 'General', value: 'general' },
  { label: 'Academic', value: 'academic' },
  { label: 'Event', value: 'event' },
  { label: 'Alert', value: 'alert' },
  { label: 'Holiday', value: 'holiday' }
]

const EVENT_TYPE_OPTIONS = [
  { label: 'Academic', value: 'academic' },
  { label: 'Sports', value: 'sports' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'Other', value: 'other' }
]

const SUBJECT_CATEGORY_OPTIONS = [
  { label: 'Academic', value: 'academic' },
  { label: 'Reference', value: 'reference' },
  { label: 'Non-fiction', value: 'non-fiction' },
  { label: 'Fiction', value: 'fiction' },
  { label: 'Other', value: 'other' }
]

const FEE_TYPE_OPTIONS = [
  { label: 'Tuition', value: 'tuition' },
  { label: 'Transport', value: 'transport' },
  { label: 'Library', value: 'library' },
  { label: 'Activity', value: 'activity' },
  { label: 'Examination', value: 'examination' },
  { label: 'Other', value: 'other' }
]

const FEE_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Partial', value: 'partial' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' }
]

const ATTENDANCE_STATUS_OPTIONS = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Leave', value: 'leave' },
  { label: 'Late', value: 'late' }
]

const EXAM_OPTIONS = [
  { label: 'Midterm', value: 'midterm' },
  { label: 'Final', value: 'final' },
  { label: 'Unit Test', value: 'unit-test' },
  { label: 'Assignment', value: 'assignment' }
]

const USER_ROLE_OPTIONS = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Parent', value: 'parent' },
  { label: 'Admin', value: 'admin' }
]

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Check', value: 'check' },
  { label: 'Online', value: 'online' },
  { label: 'Bank Transfer', value: 'bank-transfer' }
]

const BOOK_CATEGORY_OPTIONS = [
  { label: 'Academic', value: 'academic' },
  { label: 'Reference', value: 'reference' },
  { label: 'Non-fiction', value: 'non-fiction' },
  { label: 'Fiction', value: 'fiction' },
  { label: 'Other', value: 'other' }
]

const safeText = (value) => (value === null || value === undefined || value === '' ? '—' : String(value))

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`

const joinValues = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return safeText(value)
}

const buildSelectOptions = (items, getLabel) =>
  (items || []).map((item) => ({
    label: getLabel(item),
    value: item._id
  }))

const withEmptyOption = (options, label = 'Select an option') => [
  { label, value: '' },
  ...options
]

const getClassLabel = (classItem) => {
  const rawName = String(classItem.name || '').trim()
  return /^class\s+/i.test(rawName) ? rawName : `Class ${rawName}`.trim()
}
const getStudentLabel = (student) => `${student.userId?.name || 'Student'}${student.rollNumber ? ` (${student.rollNumber})` : ''}`
const getTeacherLabel = (teacher) => `${teacher.userId?.name || 'Teacher'}${teacher.employeeId ? ` (${teacher.employeeId})` : ''}`
const getSubjectLabel = (subject) => `${subject.name}${subject.code ? ` (${subject.code})` : ''}`

const sectionKeys = [
  'dashboard',
  'students',
  'teachers',
  'classes',
  'subjects',
  'attendance',
  'results',
  'assignments',
  'fees',
  'library',
  'notices',
  'events',
  'reports'
]

const getAdminSectionKey = (pathname = '') => {
  const cleanPath = pathname.replace(/\/+$/, '')
  const parts = cleanPath.split('/').filter(Boolean)
  if (parts.length < 2) return 'dashboard'
  return sectionKeys.includes(parts[1]) ? parts[1] : 'dashboard'
}

const buildSections = (lookups = {}) => {
  const classOptions = withEmptyOption(buildSelectOptions(lookups.classes, getClassLabel))
  const teacherOptions = withEmptyOption(buildSelectOptions(lookups.teachers, getTeacherLabel))
  const studentOptions = withEmptyOption(buildSelectOptions(lookups.students, getStudentLabel))
  const subjectOptions = withEmptyOption(buildSelectOptions(lookups.subjects, getSubjectLabel))

  return {
    dashboard: {
      key: 'dashboard',
      title: 'Admin Dashboard',
      description: 'Live school overview powered by MongoDB.',
      endpoint: 'dashboard',
      responseKey: 'data',
      canCreate: false
    },
    students: {
      key: 'students',
      title: 'Manage Students',
      description: 'Create and maintain student records.',
      endpoint: 'students',
      responseKey: 'students',
      canCreate: true,
      createLabel: 'Add Student',
      initialForm: {
        name: '',
        email: '',
        password: '',
        phone: '',
        rollNumber: '',
        enrollmentNumber: '',
        classId: '',
        dateOfAdmission: '',
        bloodGroup: '',
        emergencyContact: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        medicalConditions: ''
      },
      toFormValues: (record) => ({
        name: record.userId?.name || '',
        email: record.userId?.email || '',
        password: '',
        phone: record.userId?.phone || '',
        rollNumber: record.rollNumber || '',
        enrollmentNumber: record.enrollmentNumber || '',
        classId: record.class?._id || record.class || '',
        dateOfAdmission: record.dateOfAdmission ? String(record.dateOfAdmission).slice(0, 10) : '',
        bloodGroup: record.bloodGroup || '',
        emergencyContact: record.emergencyContact || '',
        guardianName: record.guardianName || '',
        guardianPhone: record.guardianPhone || '',
        guardianEmail: record.guardianEmail || '',
        medicalConditions: record.medicalConditions || ''
      }),
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: false, placeholder: 'Leave blank when editing' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'rollNumber', label: 'Roll Number', type: 'text', required: true },
        { name: 'enrollmentNumber', label: 'Enrollment Number', type: 'text' },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'dateOfAdmission', label: 'Date of Admission', type: 'date' },
        { name: 'bloodGroup', label: 'Blood Group', type: 'text' },
        { name: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
        { name: 'guardianName', label: 'Guardian Name', type: 'text' },
        { name: 'guardianPhone', label: 'Guardian Phone', type: 'text' },
        { name: 'guardianEmail', label: 'Guardian Email', type: 'email' },
        { name: 'medicalConditions', label: 'Medical Conditions', type: 'textarea' }
      ],
      columns: [
        { label: 'Student', render: (record) => record.userId?.name || 'Unnamed' },
        { label: 'Roll No', render: (record) => record.rollNumber || '—' },
        { label: 'Class', render: (record) => (record.class ? getClassLabel(record.class) : '—') },
        { label: 'Email', render: (record) => record.userId?.email || '—' },
        { label: 'Phone', render: (record) => record.userId?.phone || '—' },
        { label: 'Fees Due', render: (record) => formatCurrency(record.fees?.dueAmount) }
      ]
    },
    teachers: {
      key: 'teachers',
      title: 'Manage Teachers',
      description: 'Create and maintain teacher records.',
      endpoint: 'teachers',
      responseKey: 'teachers',
      canCreate: true,
      createLabel: 'Add Teacher',
      initialForm: {
        name: '',
        email: '',
        password: '',
        phone: '',
        employeeId: '',
        qualifications: '',
        specialization: '',
        assignedClasses: [],
        assignedSubjects: [],
        dateOfJoining: '',
        salary: '',
        experience: '',
        designation: '',
        department: '',
        certifications: ''
      },
      toFormValues: (record) => ({
        name: record.userId?.name || '',
        email: record.userId?.email || '',
        password: '',
        phone: record.userId?.phone || '',
        employeeId: record.employeeId || '',
        qualifications: joinValues(record.qualifications),
        specialization: record.specialization || '',
        assignedClasses: (record.assignedClasses || []).map((item) => item._id || item),
        assignedSubjects: (record.assignedSubjects || []).map((item) => item._id || item),
        dateOfJoining: record.dateOfJoining ? String(record.dateOfJoining).slice(0, 10) : '',
        salary: record.salary || '',
        experience: record.experience || '',
        designation: record.designation || '',
        department: record.department || '',
        certifications: joinValues(record.certifications)
      }),
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', placeholder: 'Leave blank when editing' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'employeeId', label: 'Employee ID', type: 'text', required: true },
        { name: 'qualifications', label: 'Qualifications', type: 'textarea', placeholder: 'Separate with commas' },
        { name: 'specialization', label: 'Specialization', type: 'text' },
        { name: 'assignedClasses', label: 'Assigned Classes', type: 'multiSelect', options: classOptions },
        { name: 'assignedSubjects', label: 'Assigned Subjects', type: 'multiSelect', options: subjectOptions },
        { name: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
        { name: 'salary', label: 'Salary', type: 'number' },
        { name: 'experience', label: 'Experience (Years)', type: 'number' },
        { name: 'designation', label: 'Designation', type: 'text' },
        { name: 'department', label: 'Department', type: 'text' },
        { name: 'certifications', label: 'Certifications', type: 'textarea', placeholder: 'Separate with commas' }
      ],
      columns: [
        { label: 'Teacher', render: (record) => record.userId?.name || 'Unnamed' },
        { label: 'Employee ID', render: (record) => record.employeeId || '—' },
        { label: 'Designation', render: (record) => record.designation || '—' },
        { label: 'Department', render: (record) => record.department || '—' },
        { label: 'Classes', render: (record) => (record.assignedClasses || []).length },
        { label: 'Subjects', render: (record) => (record.assignedSubjects || []).length }
      ]
    },
    classes: {
      key: 'classes',
      title: 'Manage Classes',
      description: 'Configure class groups and routines.',
      endpoint: 'classes',
      responseKey: 'classes',
      canCreate: true,
      createLabel: 'Add Class',
      initialForm: {
        name: '',
        classTeacherId: '',
        academicYear: '',
        totalStudents: '',
        room: '',
        startTime: '',
        endTime: '',
        subjects: [],
        routines: ''
      },
      toFormValues: (record) => ({
        name: record.name || '',
        classTeacherId: record.classTeacherId?._id || record.classTeacherId || '',
        academicYear: record.academicYear || '',
        totalStudents: record.totalStudents || '',
        room: record.room || '',
        startTime: record.timings?.startTime || '',
        endTime: record.timings?.endTime || '',
        subjects: (record.subjects || []).map((item) => item._id || item),
        routines: record.routines ? JSON.stringify(record.routines, null, 2) : ''
      }),
      fields: [
        { name: 'name', label: 'Class Name', type: 'text', required: true, placeholder: 'Use grade only: 8, 9, 10' },
        { name: 'classTeacherId', label: 'Class Teacher', type: 'select', options: teacherOptions },
        { name: 'academicYear', label: 'Academic Year', type: 'text', required: true },
        { name: 'totalStudents', label: 'Total Students', type: 'number' },
        { name: 'room', label: 'Room', type: 'text' },
        { name: 'startTime', label: 'Start Time', type: 'time' },
        { name: 'endTime', label: 'End Time', type: 'time' },
        { name: 'subjects', label: 'Subjects', type: 'multiSelect', options: subjectOptions },
        { name: 'routines', label: 'Routines JSON', type: 'textarea', placeholder: 'Optional JSON array of weekly routines' }
      ],
      columns: [
        { label: 'Class', render: (record) => getClassLabel(record) },
        { label: 'Academic Year', render: (record) => record.academicYear || '—' },
        { label: 'Teacher', render: (record) => record.classTeacherId?.userId?.name || '—' },
        { label: 'Students', render: (record) => record.totalStudents ?? 0 },
        { label: 'Room', render: (record) => record.room || '—' },
        { label: 'Subjects', render: (record) => (record.subjects || []).length }
      ]
    },
    subjects: {
      key: 'subjects',
      title: 'Manage Subjects',
      description: 'Maintain the subject catalog for the school.',
      endpoint: 'subjects',
      responseKey: 'subjects',
      canCreate: true,
      createLabel: 'Add Subject',
      initialForm: {
        name: '',
        code: '',
        description: '',
        creditHours: '',
        maxMarks: 100,
        passingMarks: 35
      },
      toFormValues: (record) => ({
        name: record.name || '',
        code: record.code || '',
        description: record.description || '',
        creditHours: record.creditHours || '',
        maxMarks: record.maxMarks || 100,
        passingMarks: record.passingMarks || 35
      }),
      fields: [
        { name: 'name', label: 'Subject Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'creditHours', label: 'Credit Hours', type: 'number' },
        { name: 'maxMarks', label: 'Max Marks', type: 'number' },
        { name: 'passingMarks', label: 'Passing Marks', type: 'number' }
      ],
      columns: [
        { label: 'Subject', render: (record) => record.name || '—' },
        { label: 'Code', render: (record) => record.code || '—' },
        { label: 'Credit Hours', render: (record) => record.creditHours || '—' },
        { label: 'Passing Marks', render: (record) => record.passingMarks || '—' },
        { label: 'Max Marks', render: (record) => record.maxMarks || '—' }
      ]
    },
    attendance: {
      key: 'attendance',
      title: 'Attendance',
      description: 'Record daily attendance across classes.',
      endpoint: 'attendance',
      responseKey: 'attendance',
      canCreate: true,
      createLabel: 'Record Attendance',
      initialForm: {
        studentId: '',
        classId: '',
        date: '',
        status: 'present',
        remarks: '',
        recordedBy: ''
      },
      toFormValues: (record) => ({
        studentId: record.studentId?._id || record.studentId || '',
        classId: record.classId?._id || record.classId || '',
        date: record.date ? String(record.date).slice(0, 10) : '',
        status: record.status || 'present',
        remarks: record.remarks || '',
        recordedBy: record.recordedBy?._id || record.recordedBy || ''
      }),
      fields: [
        { name: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ATTENDANCE_STATUS_OPTIONS, required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'recordedBy', label: 'Recorded By', type: 'select', options: teacherOptions }
      ],
      columns: [
        { label: 'Student', render: (record) => getStudentLabel(record.studentId || {}) },
        { label: 'Class', render: (record) => (record.classId ? getClassLabel(record.classId) : '—') },
        { label: 'Date', render: (record) => formatDate(record.date) },
        { label: 'Status', render: (record) => safeText(record.status) },
        { label: 'Remarks', render: (record) => safeText(record.remarks) }
      ]
    },
    results: {
      key: 'results',
      title: 'Results',
      description: 'Record marks and grade performance.',
      endpoint: 'results',
      responseKey: 'results',
      canCreate: true,
      createLabel: 'Add Result',
      initialForm: {
        studentId: '',
        classId: '',
        subjectId: '',
        exam: 'midterm',
        marks: '',
        maxMarks: 100,
        remarks: '',
        recordedBy: '',
        recordedDate: ''
      },
      toFormValues: (record) => ({
        studentId: record.studentId?._id || record.studentId || '',
        classId: record.classId?._id || record.classId || '',
        subjectId: record.subjectId?._id || record.subjectId || '',
        exam: record.exam || 'midterm',
        marks: record.marks || '',
        maxMarks: record.maxMarks || 100,
        remarks: record.remarks || '',
        recordedBy: record.recordedBy?._id || record.recordedBy || '',
        recordedDate: record.recordedDate ? String(record.recordedDate).slice(0, 10) : ''
      }),
      fields: [
        { name: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions, required: true },
        { name: 'exam', label: 'Exam', type: 'select', options: EXAM_OPTIONS, required: true },
        { name: 'marks', label: 'Marks', type: 'number', required: true },
        { name: 'maxMarks', label: 'Max Marks', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'recordedBy', label: 'Recorded By', type: 'select', options: teacherOptions },
        { name: 'recordedDate', label: 'Recorded Date', type: 'date' }
      ],
      columns: [
        { label: 'Student', render: (record) => getStudentLabel(record.studentId || {}) },
        { label: 'Class', render: (record) => (record.classId ? getClassLabel(record.classId) : '—') },
        { label: 'Subject', render: (record) => record.subjectId?.name || '—' },
        { label: 'Exam', render: (record) => safeText(record.exam) },
        { label: 'Marks', render: (record) => `${record.marks || 0}/${record.maxMarks || 0}` },
        { label: 'Percentage', render: (record) => `${record.percentage || 0}%` },
        { label: 'Grade', render: (record) => safeText(record.grade) }
      ]
    },
    assignments: {
      key: 'assignments',
      title: 'Assignments',
      description: 'Assign work to classes with due dates and marks.',
      endpoint: 'assignments',
      responseKey: 'assignments',
      canCreate: true,
      createLabel: 'Assign Task',
      initialForm: {
        classId: '',
        subjectId: '',
        title: '',
        description: '',
        instructions: '',
        assignedBy: '',
        dueDate: '',
        totalMarks: 10,
        attachments: ''
      },
      toFormValues: (record) => ({
        classId: record.classId?._id || record.classId || '',
        subjectId: record.subjectId?._id || record.subjectId || '',
        title: record.title || '',
        description: record.description || '',
        instructions: record.instructions || '',
        assignedBy: record.assignedBy?._id || record.assignedBy || '',
        dueDate: record.dueDate ? String(record.dueDate).slice(0, 10) : '',
        totalMarks: record.totalMarks || 10,
        attachments: joinValues(record.attachments)
      }),
      fields: [
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions, required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'instructions', label: 'Instructions', type: 'textarea' },
        { name: 'assignedBy', label: 'Assigned By', type: 'select', options: teacherOptions },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'totalMarks', label: 'Total Marks', type: 'number' },
        { name: 'attachments', label: 'Attachments', type: 'textarea', placeholder: 'Comma separated URLs' }
      ],
      columns: [
        { label: 'Title', render: (record) => record.title || '—' },
        { label: 'Class', render: (record) => (record.classId ? getClassLabel(record.classId) : '—') },
        { label: 'Subject', render: (record) => record.subjectId?.name || '—' },
        { label: 'Due Date', render: (record) => formatDate(record.dueDate) },
        { label: 'Marks', render: (record) => record.totalMarks || 0 },
        { label: 'Submissions', render: (record) => (record.submissions || []).length }
      ]
    },
    fees: {
      key: 'fees',
      title: 'Fees Management',
      description: 'Track student fee records and payment status.',
      endpoint: 'fees',
      responseKey: 'fees',
      canCreate: true,
      createLabel: 'Add Fee Record',
      initialForm: {
        studentId: '',
        academicYear: '',
        feeType: 'tuition',
        amount: '',
        dueDate: '',
        paidDate: '',
        status: 'pending',
        transactionId: '',
        paymentMethod: '',
        remarks: ''
      },
      toFormValues: (record) => ({
        studentId: record.studentId?._id || record.studentId || '',
        academicYear: record.academicYear || '',
        feeType: record.feeType || 'tuition',
        amount: record.amount || '',
        dueDate: record.dueDate ? String(record.dueDate).slice(0, 10) : '',
        paidDate: record.paidDate ? String(record.paidDate).slice(0, 10) : '',
        status: record.status || 'pending',
        transactionId: record.transactionId || '',
        paymentMethod: record.paymentMethod || '',
        remarks: record.remarks || ''
      }),
      fields: [
        { name: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
        { name: 'academicYear', label: 'Academic Year', type: 'text', required: true },
        { name: 'feeType', label: 'Fee Type', type: 'select', options: FEE_TYPE_OPTIONS, required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'dueDate', label: 'Due Date', type: 'date' },
        { name: 'paidDate', label: 'Paid Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: FEE_STATUS_OPTIONS },
        { name: 'transactionId', label: 'Transaction ID', type: 'text' },
        { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
      ],
      columns: [
        { label: 'Student', render: (record) => getStudentLabel(record.studentId || {}) },
        { label: 'Fee Type', render: (record) => safeText(record.feeType) },
        { label: 'Amount', render: (record) => formatCurrency(record.amount) },
        { label: 'Status', render: (record) => safeText(record.status) },
        { label: 'Due Date', render: (record) => formatDate(record.dueDate) },
        { label: 'Paid Date', render: (record) => formatDate(record.paidDate) }
      ]
    },
    library: {
      key: 'library',
      title: 'Library',
      description: 'Maintain the school book catalog and inventory.',
      endpoint: 'library',
      responseKey: 'books',
      canCreate: true,
      createLabel: 'Add Book',
      initialForm: {
        bookId: '',
        title: '',
        author: '',
        publisher: '',
        isbn: '',
        publicationYear: '',
        category: 'other',
        quantity: 1,
        availableQuantity: 1,
        location: '',
        price: '',
        coverImage: ''
      },
      toFormValues: (record) => ({
        bookId: record.bookId || '',
        title: record.title || '',
        author: record.author || '',
        publisher: record.publisher || '',
        isbn: record.isbn || '',
        publicationYear: record.publicationYear || '',
        category: record.category || 'other',
        quantity: record.quantity || 1,
        availableQuantity: record.availableQuantity || 1,
        location: record.location || '',
        price: record.price || '',
        coverImage: record.coverImage || ''
      }),
      fields: [
        { name: 'bookId', label: 'Book ID', type: 'text', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'author', label: 'Author', type: 'text', required: true },
        { name: 'publisher', label: 'Publisher', type: 'text' },
        { name: 'isbn', label: 'ISBN', type: 'text' },
        { name: 'publicationYear', label: 'Publication Year', type: 'number' },
        { name: 'category', label: 'Category', type: 'select', options: BOOK_CATEGORY_OPTIONS },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'availableQuantity', label: 'Available Quantity', type: 'number' },
        { name: 'location', label: 'Location', type: 'text' },
        { name: 'price', label: 'Price', type: 'number' },
        { name: 'coverImage', label: 'Cover Image URL', type: 'text' }
      ],
      columns: [
        { label: 'Book ID', render: (record) => record.bookId || '—' },
        { label: 'Title', render: (record) => record.title || '—' },
        { label: 'Author', render: (record) => record.author || '—' },
        { label: 'Category', render: (record) => safeText(record.category) },
        { label: 'Quantity', render: (record) => record.quantity ?? 0 },
        { label: 'Available', render: (record) => record.availableQuantity ?? 0 }
      ]
    },
    notices: {
      key: 'notices',
      title: 'Notices',
      description: 'Publish school notices for selected audiences.',
      endpoint: 'notices',
      responseKey: 'notices',
      canCreate: true,
      createLabel: 'Add Notice',
      initialForm: {
        title: '',
        content: '',
        category: 'general',
        attachments: '',
        targetAudience: ['student'],
        targetClass: '',
        isUrgent: false,
        expiryDate: ''
      },
      toFormValues: (record) => ({
        title: record.title || '',
        content: record.content || '',
        category: record.category || 'general',
        attachments: joinValues(record.attachments),
        targetAudience: record.targetAudience || ['student'],
        targetClass: record.targetClass?._id || record.targetClass || '',
        isUrgent: Boolean(record.isUrgent),
        expiryDate: record.expiryDate ? String(record.expiryDate).slice(0, 10) : ''
      }),
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'content', label: 'Content', type: 'textarea', required: true },
        { name: 'category', label: 'Category', type: 'select', options: NOTICE_CATEGORY_OPTIONS },
        { name: 'attachments', label: 'Attachments', type: 'textarea', placeholder: 'Comma separated URLs' },
        { name: 'targetAudience', label: 'Target Audience', type: 'multiSelect', options: TARGET_AUDIENCE_OPTIONS },
        { name: 'targetClass', label: 'Target Class', type: 'select', options: classOptions },
        { name: 'isUrgent', label: 'Urgent Notice', type: 'checkbox' },
        { name: 'expiryDate', label: 'Expiry Date', type: 'date' }
      ],
      columns: [
        { label: 'Title', render: (record) => record.title || '—' },
        { label: 'Category', render: (record) => safeText(record.category) },
        { label: 'Audience', render: (record) => joinValues(record.targetAudience) },
        { label: 'Urgent', render: (record) => (record.isUrgent ? 'Yes' : 'No') },
        { label: 'Created', render: (record) => formatDateTime(record.createdAt) }
      ]
    },
    events: {
      key: 'events',
      title: 'Events',
      description: 'Plan school events and student registrations.',
      endpoint: 'events',
      responseKey: 'events',
      canCreate: true,
      createLabel: 'Add Event',
      initialForm: {
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        eventType: 'other',
        organizer: '',
        targetAudience: ['student'],
        maxAttendees: '',
        poster: '',
        attachments: ''
      },
      toFormValues: (record) => ({
        title: record.title || '',
        description: record.description || '',
        startDate: record.startDate ? String(record.startDate).slice(0, 10) : '',
        endDate: record.endDate ? String(record.endDate).slice(0, 10) : '',
        startTime: record.startTime || '',
        endTime: record.endTime || '',
        location: record.location || '',
        eventType: record.eventType || 'other',
        organizer: record.organizer?._id || record.organizer || '',
        targetAudience: record.targetAudience || ['student'],
        maxAttendees: record.maxAttendees || '',
        poster: record.poster || '',
        attachments: joinValues(record.attachments)
      }),
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date' },
        { name: 'startTime', label: 'Start Time', type: 'time' },
        { name: 'endTime', label: 'End Time', type: 'time' },
        { name: 'location', label: 'Location', type: 'text' },
        { name: 'eventType', label: 'Type', type: 'select', options: EVENT_TYPE_OPTIONS },
        { name: 'organizer', label: 'Organizer', type: 'select', options: teacherOptions },
        { name: 'targetAudience', label: 'Target Audience', type: 'multiSelect', options: TARGET_AUDIENCE_OPTIONS },
        { name: 'maxAttendees', label: 'Max Attendees', type: 'number' },
        { name: 'poster', label: 'Poster URL', type: 'text' },
        { name: 'attachments', label: 'Attachments', type: 'textarea', placeholder: 'Comma separated URLs' }
      ],
      columns: [
        { label: 'Title', render: (record) => record.title || '—' },
        { label: 'Type', render: (record) => safeText(record.eventType) },
        { label: 'Start Date', render: (record) => formatDate(record.startDate) },
        { label: 'Location', render: (record) => safeText(record.location) },
        { label: 'Audience', render: (record) => joinValues(record.targetAudience) }
      ]
    },
    reports: {
      key: 'reports',
      title: 'Reports',
      description: 'Operational summaries and risk areas.',
      endpoint: 'reports',
      responseKey: 'report',
      canCreate: false
    }
  }
}

export {
  ATTENDANCE_STATUS_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FEE_STATUS_OPTIONS,
  FEE_TYPE_OPTIONS,
  NOTICE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  USER_ROLE_OPTIONS,
  buildSections,
  formatCurrency,
  formatDate,
  formatDateTime,
  getAdminSectionKey,
  joinValues,
  safeText
}