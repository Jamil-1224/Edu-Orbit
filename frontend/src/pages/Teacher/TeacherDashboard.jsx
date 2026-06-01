import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  School,
  Users,
  BarChart3,
  Bell
} from 'lucide-react'
import { buildTeacherSections, formatDate, formatDateTime, getTeacherSectionKey, safeText } from './teacherSections'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_HOST = import.meta.env.VITE_API_BASE || API_URL.replace(/\/api\/?$/, '')

const StatCard = ({ icon: Icon, label, value, tone, trend }) => (
  <div className={`${tone.bg} rounded-2xl p-5 border ${tone.border} shadow-sm`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`text-sm font-medium ${tone.text}`}>{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="font-semibold">{Math.abs(trend)}%</span>
            <span className="text-slate-500">vs previous month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${tone.iconBg}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
)

const SummaryCard = ({ label, value, helper, icon: Icon, tone = 'slate' }) => {
  const tones = {
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-600' }
  }

  const current = tones[tone] || tones.slate

  return (
    <div className={`${current.bg} rounded-2xl border ${current.border} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${current.iconBg}`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

const FieldWrapper = ({ field, value, onChange, options = [] }) => {
  const className = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  if (field.type === 'checkbox-group') {
    const selectedValues = Array.isArray(value) ? value.map(String) : []

    const toggleValue = (optionValue) => {
      const normalizedValue = String(optionValue)
      const nextValues = selectedValues.includes(normalizedValue)
        ? selectedValues.filter((item) => item !== normalizedValue)
        : [...selectedValues, normalizedValue]

      onChange(nextValues)
    }

    return (
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selectedValues.includes(String(option.value))

          return (
            <label key={String(option.value)} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          )
        })}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return <textarea className={`${className} min-h-[110px]`} value={value || ''} onChange={onChange} placeholder={field.placeholder || ''} />
  }

  if (field.type === 'select') {
    return (
      <select className={className} value={value || ''} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    )
  }

  return <input className={className} type={field.type || 'text'} value={value || ''} onChange={onChange} placeholder={field.placeholder || ''} />
}

const TeacherDashboard = () => {
  const location = useLocation()
  const sectionKey = getTeacherSectionKey(location.pathname)
  const [lookups, setLookups] = useState({ students: [], classes: [], subjects: [] })
  const [dashboardData, setDashboardData] = useState(null)
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [bulkClassId, setBulkClassId] = useState('')
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10))
  const [bulkStudents, setBulkStudents] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkSearchQuery, setBulkSearchQuery] = useState('')
  const [submissionsModal, setSubmissionsModal] = useState({ open: false, assignmentId: null, submissions: [], drafts: {}, readerUrl: '' })

  const sections = useMemo(() => buildTeacherSections(lookups), [lookups])
  const section = sections[sectionKey] || sections.dashboard

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [dashboardRes, classesRes, subjectsRes, noticesRes] = await Promise.all([
          axios.get(`${API_URL}/teacher/dashboard`),
          axios.get(`${API_URL}/teacher/classes`),
          axios.get(`${API_URL}/teacher/subjects`),
          axios.get(`${API_URL}/teacher/notices`)
        ])

        const dashboard = dashboardRes.data.data || null
        setDashboardData(dashboard)

        const classList = classesRes.data.classes || []
        const allStudents = []
        for (const classItem of classList) {
          try {
            const studentsResponse = await axios.get(`${API_URL}/teacher/classes/${classItem._id}/students`)
            allStudents.push(...(studentsResponse.data.students || []))
          } catch (innerError) {
            continue
          }
        }

        const assignedSubjects = subjectsRes.data.subjects || []

        const nextLookups = {
          students: allStudents,
          classes: classList,
          subjects: assignedSubjects
        }

        setLookups(nextLookups)
        if (!bulkClassId && classList.length) {
          setBulkClassId(classList[0]._id)
        }

        if (section.key === 'dashboard') {
          setRecords([])
        } else if (section.endpoint === 'notices') {
          setRecords(noticesRes.data.notices || [])
        }
      } catch (lookupError) {
        setError(lookupError.response?.data?.message || 'Failed to load teacher data')
      } finally {
        setLoading(false)
      }
    }

    loadLookups()
  }, [])

  useEffect(() => {
    const loadSectionData = async () => {
      setLoading(true)
      setError('')
      setEditingId(null)
      setForm(section.initialForm || {})

      try {
        if (section.key === 'dashboard') {
          const response = await axios.get(`${API_URL}/teacher/dashboard`)
          setDashboardData(response.data.data || null)
          setRecords([])
        } else {
          const response = await axios.get(`${API_URL}/teacher/${section.endpoint}`)
          setRecords(response.data[section.responseKey] || [])
        }
      } catch (sectionError) {
        setError(sectionError.response?.data?.message || `Failed to load ${section.title.toLowerCase()}`)
      } finally {
        setLoading(false)
      }
    }

    loadSectionData()
  }, [sectionKey, section.endpoint, section.key, section.initialForm, section.responseKey, section.title])

  useEffect(() => {
    if (section.key !== 'attendance') return
    if (!bulkClassId) {
      setBulkStudents([])
      return
    }
    const loadClassAttendanceStudents = async (classId = bulkClassId) => {
      setBulkLoading(true)
      setBulkMessage('')
      try {
        const response = await axios.get(`${API_URL}/teacher/attendance/class/${classId}/students`)
        const students = (response.data.students || []).map((student) => ({
          ...student,
          status: 'absent',
          remarks: ''
        }))

        // dedupe by id to avoid duplicate rows
        const map = {}
        for (const s of students) map[String(s.id)] = s
        const unique = Object.values(map)
        setBulkStudents(unique)
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load class attendance sheet')
      } finally {
        setBulkLoading(false)
      }
    }

    loadClassAttendanceStudents()
  }, [bulkClassId, section.key])

  const refreshCurrentSection = async () => {
    setLoading(true)
    setError('')
    try {
      if (section.key === 'dashboard') {
        const response = await axios.get(`${API_URL}/teacher/dashboard`)
        setDashboardData(response.data.data || null)
      } else {
        const response = await axios.get(`${API_URL}/teacher/${section.endpoint}`)
        setRecords(response.data[section.responseKey] || [])
      }
    } catch (refreshError) {
      setError(refreshError.response?.data?.message || 'Failed to refresh teacher data')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, event) => {
    const value = event?.target ? event.target.value : event

    setForm((current) => ({ ...current, [field.name]: value }))
  }

  const handleEdit = (record) => {
    if (!section.toFormValues) return
    setEditingId(record._id || record.id)
    setForm(section.toFormValues(record))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (record) => {
    const recordId = record._id || record.id
    if (!recordId) return

    if (!window.confirm('Delete this record?')) return

    try {
      await axios.delete(`${API_URL}/teacher/${section.endpoint}/${recordId}`)
      await refreshCurrentSection()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Failed to delete record')
    }
  }

  const updateSubmissionDraft = (studentId, field, value) => {
    setSubmissionsModal((current) => ({
      ...current,
      drafts: {
        ...(current.drafts || {}),
        [String(studentId)]: {
          ...(current.drafts?.[String(studentId)] || {}),
          [field]: value
        }
      }
    }))
  }

  const handleMarkSubmission = async (submission) => {
    try {
      const draft = submissionsModal.drafts?.[String(submission.studentId)] || {}
      await axios.put(`${API_URL}/teacher/assignments/${submissionsModal.assignmentId}/grade`, {
        studentId: submission.studentId,
        marksObtained: draft.marksObtained,
        feedback: draft.feedback
      })

      const res = await axios.get(`${API_URL}/teacher/assignments/${submissionsModal.assignmentId}/submissions`)
      const submissions = (res.data.submissions || []).map((s) => ({
        ...s,
        fileUrl: s.submittedFile ? `${API_HOST}${s.submittedFile}` : ''
      }))

      const drafts = submissions.reduce((accumulator, item) => {
        accumulator[String(item.studentId)] = {
          marksObtained: item.marksObtained ?? '',
          feedback: item.feedback || ''
        }
        return accumulator
      }, {})

      setSubmissionsModal((current) => ({
        ...current,
        submissions,
        drafts
      }))

      await refreshCurrentSection()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save submission mark')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = { ...form }

      if (section.key === 'routine' && payload.periods) {
        try {
          const parsed = JSON.parse(payload.periods)
          if (!Array.isArray(parsed)) {
            setError('Periods JSON must be a JSON array (example: [{"periodNumber":1,"startTime":"09:00","endTime":"09:40","subject":"..."}]).')
            return
          }
          payload.periods = parsed
        } catch (parseError) {
          setError(`Periods JSON is invalid: ${parseError.message}`)
          return
        }
      }

      const url = editingId ? `${API_URL}/teacher/${section.endpoint}/${editingId}` : `${API_URL}/teacher/${section.endpoint}`
      const method = editingId ? 'put' : 'post'

      if (section.key === 'routine' && !editingId) {
        await axios.put(url, payload)
      } else {
        await axios[method](url, payload)
      }

      setEditingId(null)
      setForm(section.initialForm || {})
      await refreshCurrentSection()
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const updateBulkStudent = (studentId, field, value) => {
    setBulkStudents((current) => current.map((item) => (
      String(item.id) === String(studentId)
        ? { ...item, [field]: value }
        : item
    )))
  }

  const attendanceSheetStats = useMemo(() => {
    const normalizeStatus = (value) => {
      const status = String(value || '').trim().toLowerCase()
      if (['present', 'absent', 'late', 'leave'].includes(status)) return status
      return 'absent'
    }

    return bulkStudents.reduce((accumulator, student) => {
      const status = normalizeStatus(student.status)
      accumulator.total += 1
      accumulator[status] += 1
      return accumulator
    }, { total: 0, present: 0, absent: 0, leave: 0, late: 0 })
  }, [bulkStudents])

  const visibleBulkStudents = useMemo(() => {
    const query = bulkSearchQuery.trim().toLowerCase()
    if (!query) return bulkStudents

    return bulkStudents.filter((student) => {
      const name = String(student.name || '').toLowerCase()
      const roll = String(student.rollNumber || '').toLowerCase()
      return name.includes(query) || roll.includes(query)
    })
  }, [bulkStudents, bulkSearchQuery])

  const statusTone = (status) => {
    switch (status) {
      case 'present': return 'border-emerald-300 bg-emerald-50 text-emerald-700'
      case 'absent': return 'border-rose-300 bg-rose-50 text-rose-700'
      case 'leave': return 'border-blue-300 bg-blue-50 text-blue-700'
      case 'late': return 'border-amber-300 bg-amber-50 text-amber-700'
      default: return 'border-slate-300 bg-slate-50 text-slate-700'
    }
  }

  const handleBulkAttendanceSubmit = async () => {
    if (!bulkClassId || !bulkDate) {
      setBulkMessage('Please select class and date for attendance')
      return
    }

    if (!bulkStudents.length) {
      setBulkMessage('No students found in selected class')
      return
    }

    setBulkSaving(true)
    setBulkMessage('')
    setError('')

    try {
      const records = bulkStudents.map((student) => ({
        studentId: student.id,
        status: student.status || 'present',
        remarks: student.remarks || ''
      }))

      const response = await axios.post(`${API_URL}/teacher/attendance/bulk`, {
        classId: bulkClassId,
        date: bulkDate,
        records
      })

      const summariesByStudent = (response.data.summaries || []).reduce((accumulator, summary) => {
        accumulator[String(summary.studentId)] = summary
        return accumulator
      }, {})

      setBulkStudents((current) => current.map((student) => {
        const summary = summariesByStudent[String(student.id)]
        if (!summary) return student
        return {
          ...student,
          attendanceSummary: {
            totalDays: summary.totalDays,
            presentDays: summary.presentDays,
            attendancePercentage: summary.attendancePercentage
          }
        }
      }))

      setBulkMessage(`Attendance saved for ${response.data.updatedCount || records.length} students`)
      // Refresh class student list to reflect any class membership changes
      await axios.get(`${API_URL}/teacher/attendance/class/${bulkClassId}/students`)
        .then((res) => {
          const students = (res.data.students || []).map((student) => ({ ...student, status: 'absent', remarks: '' }))
          const map = {}
          for (const s of students) map[String(s.id)] = s
          setBulkStudents(Object.values(map))
        })
        .catch(() => {})
      await refreshCurrentSection()
    } catch (bulkError) {
      setError(bulkError.response?.data?.message || 'Failed to submit class attendance')
    } finally {
      setBulkSaving(false)
    }
  }

  const setAllBulkStatus = (status) => {
    setBulkStudents((current) => current.map((student) => ({
      ...student,
      status
    })))
  }

  const renderBulkAttendance = () => {
    if (section.key !== 'attendance') return null

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Whole Class Attendance</h3>
            <p className="text-sm text-slate-500 mt-1">Spreadsheet-style attendance sheet for quick class marking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setAllBulkStatus('present')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">All Present</button>
            <button type="button" onClick={() => setAllBulkStatus('absent')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">All Absent</button>
            <button type="button" onClick={() => setAllBulkStatus('late')} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">All Late</button>
            <button type="button" onClick={() => setAllBulkStatus('leave')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">All Leave</button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{attendanceSheetStats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Present</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{attendanceSheetStats.present}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Absent</p>
            <p className="mt-2 text-2xl font-bold text-rose-700">{attendanceSheetStats.absent || 0}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Late</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{attendanceSheetStats.late || 0}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Leave</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{attendanceSheetStats.leave || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={bulkClassId}
              onChange={(event) => setBulkClassId(event.target.value)}
            >
              <option value="">Select class</option>
              {(lookups.classes || []).map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name}{classItem.section ? `-${classItem.section}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={bulkDate}
              onChange={(event) => setBulkDate(event.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleBulkAttendanceSubmit}
              disabled={bulkSaving || bulkLoading || !bulkClassId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {bulkSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {bulkSaving ? 'Saving...' : 'Save Whole Class'}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Search students</label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={bulkSearchQuery}
            onChange={(event) => setBulkSearchQuery(event.target.value)}
            placeholder="Search by student name or roll number"
          />
        </div>

        {bulkMessage && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{bulkMessage}</div>}

        {bulkLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading class students...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">#</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Student</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Roll</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Present</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Absent</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Late</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Leave</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {visibleBulkStudents.map((student, index) => {
                    const currentStatus = student.status || 'present'

                    return (
                      <tr key={student.id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{student.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{student.rollNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => updateBulkStudent(student.id, 'status', 'present')}
                            className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 font-semibold transition ${currentStatus === 'present' ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            Present
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => updateBulkStudent(student.id, 'status', 'absent')}
                            className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 font-semibold transition ${currentStatus === 'absent' ? 'border-rose-500 bg-rose-600 text-white' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                          >
                            Absent
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => updateBulkStudent(student.id, 'status', 'late')}
                            className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 font-semibold transition ${currentStatus === 'late' ? 'border-amber-500 bg-amber-600 text-white' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                          >
                            Late
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => updateBulkStudent(student.id, 'status', 'leave')}
                            className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 font-semibold transition ${currentStatus === 'leave' ? 'border-blue-500 bg-blue-600 text-white' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            Leave
                          </button>
                        </td>
                        <td className="px-4 py-3 min-w-[220px]">
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={student.remarks || ''}
                            onChange={(event) => updateBulkStudent(student.id, 'remarks', event.target.value)}
                            placeholder="Optional remarks"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone(currentStatus)}`}>
                            {currentStatus}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!visibleBulkStudents.length && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">No students match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSectionDashboard = () => {
    const stats = dashboardData?.stats || {}

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Assigned Classes" value={stats.assignedClasses || 0} tone={{ bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-600' }} />
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} tone={{ bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-600' }} />
          <StatCard icon={ClipboardList} label="Attendance Rate" value={`${stats.attendanceRate || 0}%`} tone={{ bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-600' }} />
          <StatCard icon={Calendar} label="Realtime" value="Live" tone={{ bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-600' }} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Live Status</h3>
          <div className="flex flex-wrap gap-4">
            <SummaryCard label="Attendance Rate" value={`${stats.attendanceRate || 0}%`} helper="Average across assigned classes" icon={CheckCircle2} tone="emerald" />
            <SummaryCard label="Realtime" value="Connected" helper="Updates from admin/teacher" icon={Activity} tone="blue" />
          </div>
        </div>
      </div>
    )
  }

  const renderList = () => {
    if (!records.length) {
      return <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">No records found.</div>
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {section.columns.map((column) => (
                  <th key={column.label} className="px-4 py-3 text-left font-semibold text-slate-600">{column.label}</th>
                ))}
                {section.canCreate && <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.map((record, index) => {
                const rowId = record._id || record.id || index
                return (
                  <tr key={rowId} className="hover:bg-slate-50/70">
                    {section.columns.map((column) => (
                      <td key={column.label} className="px-4 py-3 text-slate-700">
                        {column.render ? column.render(record) : safeText(record[column.accessor])}
                      </td>
                    ))}
                    {section.canCreate && section.supportsDelete !== false && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {section.endpoint === 'assignments' && (() => {
                            const subs = record.submissions || []
                            const unread = subs.filter((s) => !s.viewed).length
                            if (unread > 0) {
                              return (
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.put(`${API_URL}/teacher/assignments/${record._id || record.id}/submissions/mark-read`)
                                      await refreshCurrentSection()
                                    } catch (err) {
                                      setError(err.response?.data?.message || 'Failed to mark submissions read')
                                    }
                                  }}
                                  className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  Mark read ({unread})
                                </button>
                              )
                            }
                            return null
                          })()}

                          <button
                            onClick={async () => {
                              try {
                                const res = await axios.get(`${API_URL}/teacher/assignments/${record._id || record.id}/submissions`)
                                const submissions = (res.data.submissions || []).map((s) => ({
                                  ...s,
                                  fileUrl: s.submittedFile ? `${API_HOST}${s.submittedFile}` : ''
                                }))
                                const drafts = submissions.reduce((accumulator, item) => {
                                  accumulator[String(item.studentId)] = {
                                    marksObtained: item.marksObtained ?? '',
                                    feedback: item.feedback || ''
                                  }
                                  return accumulator
                                }, {})
                                setSubmissionsModal({ open: true, assignmentId: record._id || record.id, submissions, drafts, readerUrl: '' })
                              } catch (err) {
                                setError(err.response?.data?.message || 'Failed to load submissions')
                              }
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Submissions
                          </button>

                          <button onClick={() => handleEdit(record)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Edit</button>
                          <button onClick={() => handleDelete(record)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderForm = () => {
    if (section.key === 'attendance') return null
    if (!section.canCreate || !section.fields?.length) return null

    return (
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{editingId ? `Edit ${section.title}` : section.createLabel}</h3>
            <p className="text-sm text-slate-500 mt-1">Save live records to MongoDB.</p>
          </div>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(section.initialForm || {}) }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel Edit</button>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {section.fields.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
              <FieldWrapper
                field={field}
                value={form[field.name]}
                onChange={(event) => handleFieldChange(field, event)}
                options={field.options || []}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingId ? 'Update' : 'Save'}
          </button>
          <button type="button" onClick={() => { setEditingId(null); setForm(section.initialForm || {}) }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Plus size={16} />
            Reset
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
          <School size={14} />
          {section.title}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{section.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200">{section.description}</p>
      </div>
      {submissionsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Submissions</h3>
              <button onClick={() => setSubmissionsModal({ open: false, assignmentId: null, submissions: [], drafts: {}, readerUrl: '' })} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Roll</th>
                    <th className="px-3 py-2 text-left">Submitted</th>
                    <th className="px-3 py-2 text-left">Viewed</th>
                    <th className="px-3 py-2 text-left">Mark</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsModal.submissions.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2">{s.rollNumber || '—'}</td>
                      <td className="px-3 py-2">{s.submittedDate ? new Date(s.submittedDate).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2">{s.viewed ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 min-w-[240px]">
                        <div className="flex flex-col gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={submissionsModal.drafts?.[String(s.studentId)]?.marksObtained ?? ''}
                            onChange={(event) => updateSubmissionDraft(s.studentId, 'marksObtained', event.target.value)}
                            placeholder="Marks"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                          />
                          <input
                            type="text"
                            value={submissionsModal.drafts?.[String(s.studentId)]?.feedback ?? ''}
                            onChange={(event) => updateSubmissionDraft(s.studentId, 'feedback', event.target.value)}
                            placeholder="Feedback"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleMarkSubmission(s)}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Save Mark
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.fileUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSubmissionsModal((current) => ({ ...current, readerUrl: s.fileUrl }))}
                                className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                Read
                              </button>
                              <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Download</a>
                            </>
                          ) : <span className="text-slate-500">No file</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!submissionsModal.submissions.length && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No submissions yet.</td></tr>
                  )}
                </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Read Preview</p>
                    <p className="text-xs text-slate-500">Open a submission to preview it here.</p>
                  </div>
                  {submissionsModal.readerUrl && (
                    <button
                      type="button"
                      onClick={() => setSubmissionsModal((current) => ({ ...current, readerUrl: '' }))}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {submissionsModal.readerUrl ? (
                  <iframe
                    title="Submission Preview"
                    src={submissionsModal.readerUrl}
                    className="h-[520px] w-full rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                    No submission selected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-blue-600" size={28} />
            <p className="mt-3 text-sm text-slate-500">Loading {section.title.toLowerCase()}...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{section.description}</p>
            </div>
            <button onClick={refreshCurrentSection} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {section.key === 'dashboard' && renderSectionDashboard()}

          {section.key !== 'dashboard' && (
            <>
              {renderBulkAttendance()}
              {renderForm()}
              {renderList()}
            </>
          )}

          {section.key === 'dashboard' && lookups.classes?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
                <Users className="mx-auto text-blue-600 mb-2" size={28} />
                <p className="font-semibold text-slate-900">My Classes</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                <ClipboardList className="mx-auto text-emerald-600 mb-2" size={28} />
                <p className="font-semibold text-slate-900">Attendance</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center">
                <BarChart3 className="mx-auto text-amber-600 mb-2" size={28} />
                <p className="font-semibold text-slate-900">Marks</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
                <Bell className="mx-auto text-rose-600 mb-2" size={28} />
                <p className="font-semibold text-slate-900">Notices</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard