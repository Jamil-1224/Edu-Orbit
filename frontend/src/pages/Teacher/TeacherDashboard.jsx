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

    const loadClassAttendanceStudents = async () => {
      setBulkLoading(true)
      setBulkMessage('')
      try {
        const response = await axios.get(`${API_URL}/teacher/attendance/class/${bulkClassId}/students`)
        const students = (response.data.students || []).map((student) => ({
          ...student,
          status: 'present',
          remarks: ''
        }))
        setBulkStudents(students)
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
    const value = field.type === 'select'
      ? event.target.value
      : event.target.value

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = { ...form }

      if (section.key === 'routine' && payload.periods) {
        payload.periods = JSON.parse(payload.periods)
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
            <p className="text-sm text-slate-500 mt-1">Mark attendance for all students and auto-update attendance percentages.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setAllBulkStatus('present')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">All Present</button>
            <button type="button" onClick={() => setAllBulkStatus('absent')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">All Absent</button>
            <button type="button" onClick={() => setAllBulkStatus('late')} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">All Late</button>
            <button type="button" onClick={() => setAllBulkStatus('leave')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">All Leave</button>
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

        {bulkMessage && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{bulkMessage}</div>}

        {bulkLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading class students...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Roll No</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Remarks</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bulkStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-slate-700">{student.name}</td>
                    <td className="px-4 py-3 text-slate-700">{student.rollNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={student.status || 'present'}
                        onChange={(event) => updateBulkStudent(student.id, 'status', event.target.value)}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="leave">Leave</option>
                        <option value="late">Late</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={student.remarks || ''}
                        onChange={(event) => updateBulkStudent(student.id, 'remarks', event.target.value)}
                        placeholder="Optional"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{student.attendanceSummary?.attendancePercentage || 0}%</td>
                  </tr>
                ))}
                {!bulkStudents.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No students found in this class. Add students with class assignment from the Admin Students section.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderSectionDashboard = () => {
    const stats = dashboardData?.stats || {}
    const schedule = dashboardData?.schedule || []
    const recentActivities = dashboardData?.recentActivities || []

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Assigned Classes" value={stats.assignedClasses || 0} tone={{ bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-600' }} trend={0} />
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} tone={{ bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-600' }} trend={0} />
          <StatCard icon={ClipboardList} label="Pending Assignments" value={stats.pendingAssignments || 0} tone={{ bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-600' }} trend={0} />
          <StatCard icon={Calendar} label="Today's Classes" value={stats.todayClasses || 0} tone={{ bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-600' }} trend={0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard label="Attendance Rate" value={`${stats.attendanceRate || 0}%`} helper="Average across assigned classes" icon={CheckCircle2} tone="emerald" />
          <SummaryCard label="Status" value="Live" helper="MongoDB connected data view" icon={Activity} tone="blue" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Today's Schedule
            </h3>
            <div className="space-y-3">
              {schedule.length ? schedule.map((session, index) => (
                <div key={`${session.className}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-semibold text-blue-600">{session.startTime || 'TBD'}</div>
                    <div>
                      <p className="font-semibold text-slate-900">{session.subject}</p>
                      <p className="text-sm text-slate-500">Class {session.className} • {session.room}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Period {session.periodNumber || 'N/A'}</span>
                </div>
              )) : <div className="text-sm text-slate-500">No schedule available.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Summary</h3>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Attendance</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.attendanceRate || 0}%</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm text-slate-500">Assigned Classes</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.assignedClasses || 0}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.totalStudents || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.length ? recentActivities.map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-slate-700">{activity.title} - {activity.description}</p>
                <p className="ml-auto text-xs text-slate-400">{formatDateTime(activity.timestamp)}</p>
              </div>
            )) : <div className="text-sm text-slate-500">No recent activity.</div>}
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