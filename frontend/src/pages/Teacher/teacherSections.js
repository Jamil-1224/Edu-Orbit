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

const getClassLabel = (classItem) => {
  const rawName = String(classItem.name || '').trim()
  return /^class\s+/i.test(rawName) ? rawName : `Class ${rawName}`.trim()
}

const buildSelectOptions = (items, getLabel) => (items || []).map((item) => ({ label: getLabel(item), value: item._id }))

const withEmptyOption = (options, label = 'Select an option') => [{ label, value: '' }, ...options]

const TEACHER_ATTENDANCE_STATUS_OPTIONS = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Leave', value: 'leave' },
  { label: 'Late', value: 'late' }
]

const TEACHER_EXAM_OPTIONS = [
  { label: 'Midterm', value: 'midterm' },
  { label: 'Final', value: 'final' },
  { label: 'Unit Test', value: 'unit-test' },
  { label: 'Assignment', value: 'assignment' }
]

const getTeacherSectionKey = (pathname = '') => {
  const cleanPath = pathname.replace(/\/+$/, '')
  if (cleanPath === '/teacher') return 'dashboard'
  const parts = cleanPath.split('/').filter(Boolean)
  return parts[1] || 'dashboard'
}

const buildTeacherSections = (lookups = {}) => {
  const classOptions = withEmptyOption(buildSelectOptions(lookups.classes, getClassLabel))
  const studentOptions = withEmptyOption(buildSelectOptions(lookups.students, (student) => `${student.userId?.name || 'Student'}${student.rollNumber ? ` (${student.rollNumber})` : ''}`))
  const subjectOptions = withEmptyOption(buildSelectOptions(lookups.subjects, (subject) => `${subject.name}${subject.code ? ` (${subject.code})` : ''}`))

  return {
    dashboard: {
      key: 'dashboard',
      title: 'Teacher Dashboard',
      description: 'Live teaching overview powered by MongoDB.',
      endpoint: 'dashboard',
      responseKey: 'data',
      canCreate: false
    },
    classes: {
      key: 'classes',
      title: 'My Classes',
      description: 'Classes assigned to the authenticated teacher.',
      endpoint: 'classes',
      responseKey: 'classes',
      canCreate: false,
      columns: [
        { label: 'Class', render: (record) => getClassLabel(record) },
        { label: 'Academic Year', render: (record) => record.academicYear || '—' },
        { label: 'Room', render: (record) => record.room || '—' },
        { label: 'Students', render: (record) => record.totalStudents ?? 0 },
        { label: 'Subjects', render: (record) => (record.subjects || []).length }
      ]
    },
    attendance: {
      key: 'attendance',
      title: 'Attendance',
      description: 'Record and review attendance for classes. Class means grade or section, subject means the lesson taught.',
      endpoint: 'attendance',
      responseKey: 'attendance',
      canCreate: false,
      createLabel: 'Record Attendance',
      initialForm: {
        studentId: '',
        classId: '',
        date: '',
        status: 'present',
        remarks: ''
      },
      toFormValues: (record) => ({
        studentId: record.studentId?._id || record.studentId || '',
        classId: record.classId?._id || record.classId || '',
        date: record.date ? String(record.date).slice(0, 10) : '',
        status: record.status || 'present',
        remarks: record.remarks || ''
      }),
      fields: [
        { name: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: TEACHER_ATTENDANCE_STATUS_OPTIONS, required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
      ],
      columns: [
        { label: 'Student', render: (record) => record.studentId?.userId?.name || '—' },
        { label: 'Class', render: (record) => (record.classId ? getClassLabel(record.classId) : '—') },
        { label: 'Date', render: (record) => formatDate(record.date) },
        { label: 'Status', render: (record) => safeText(record.status) },
        { label: 'Remarks', render: (record) => safeText(record.remarks) }
      ]
    },
    marks: {
      key: 'marks',
      title: 'Marks',
      description: 'Upload and maintain academic marks for classes and subjects.',
      endpoint: 'marks',
      responseKey: 'marks',
      canCreate: true,
      createLabel: 'Upload Marks',
      initialForm: {
        studentId: '',
        classId: '',
        subjectId: '',
        exam: 'midterm',
        marks: '',
        maxMarks: 100,
        remarks: '',
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
        recordedDate: record.recordedDate ? String(record.recordedDate).slice(0, 10) : ''
      }),
      fields: [
        { name: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions, required: true },
        { name: 'exam', label: 'Exam', type: 'select', options: TEACHER_EXAM_OPTIONS, required: true },
        { name: 'marks', label: 'Marks', type: 'number', required: true },
        { name: 'maxMarks', label: 'Max Marks', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'recordedDate', label: 'Recorded Date', type: 'date' }
      ],
      columns: [
        { label: 'Student', render: (record) => record.studentId?.userId?.name || '—' },
        { label: 'Class', render: (record) => (record.classId ? getClassLabel(record.classId) : '—') },
        { label: 'Subject', render: (record) => record.subjectId?.name || '—' },
        { label: 'Exam', render: (record) => safeText(record.exam) },
        { label: 'Score', render: (record) => `${record.marks || 0}/${record.maxMarks || 0}` },
        { label: 'Percentage', render: (record) => `${record.percentage || 0}%` },
        { label: 'Grade', render: (record) => safeText(record.grade) }
      ]
    },
    assignments: {
      key: 'assignments',
      title: 'Assignments',
      description: 'Create assignments for classes and subjects.',
      endpoint: 'assignments',
      responseKey: 'assignments',
      canCreate: true,
      createLabel: 'Create Assignment',
      initialForm: {
        classId: '',
        subjectId: '',
        title: '',
        description: '',
        instructions: '',
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
        dueDate: record.dueDate ? String(record.dueDate).slice(0, 10) : '',
        totalMarks: record.totalMarks || 10,
        attachments: Array.isArray(record.attachments) ? record.attachments.join(', ') : ''
      }),
      fields: [
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'subjectId', label: 'Subject', type: 'select', options: subjectOptions, required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'instructions', label: 'Instructions', type: 'textarea' },
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
    routine: {
      key: 'routine',
      title: 'Routine',
      description: 'Update routine entries for classes.',
      endpoint: 'routine',
      responseKey: 'routine',
      canCreate: true,
      supportsDelete: false,
      createLabel: 'Update Routine',
      initialForm: {
        classId: '',
        day: 'Monday',
        periods: ''
      },
      toFormValues: (record) => ({
        classId: record.classId || '',
        day: record.day || 'Monday',
        periods: record.periods ? JSON.stringify(record.periods, null, 2) : '[]'
      }),
      fields: [
        { name: 'classId', label: 'Class', type: 'select', options: classOptions, required: true },
        { name: 'day', label: 'Day', type: 'text', required: true },
        { name: 'periods', label: 'Periods JSON', type: 'textarea', required: true, placeholder: '[{"periodNumber":1,"startTime":"09:00","endTime":"09:40","subject":"..."}]' }
      ],
      columns: [
        { label: 'Class', render: (record) => record.className || (record.classId ? getClassLabel({ name: record.classId }) : '—') },
        { label: 'Day', render: (record) => safeText(record.day) },
        { label: 'Periods', render: (record) => (record.periods || []).length }
      ]
    },
    notices: {
      key: 'notices',
      title: 'Notices',
      description: 'See notices targeted to teachers or your classes.',
      endpoint: 'notices',
      responseKey: 'notices',
      canCreate: false,
      columns: [
        { label: 'Title', render: (record) => record.title || '—' },
        { label: 'Category', render: (record) => safeText(record.category) },
        { label: 'Audience', render: (record) => Array.isArray(record.targetAudience) ? record.targetAudience.join(', ') : '—' },
        { label: 'Urgent', render: (record) => (record.isUrgent ? 'Yes' : 'No') },
        { label: 'Created', render: (record) => formatDateTime(record.createdAt) }
      ]
    }
  }
}

export {
  buildTeacherSections,
  formatDate,
  formatDateTime,
  getTeacherSectionKey,
  safeText
}