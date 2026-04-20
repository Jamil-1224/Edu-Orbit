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
  DollarSign,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Users,
  BookMarked,
  ClipboardList,
  BarChart3,
  Library,
  Bell,
  CalendarDays,
  School
} from 'lucide-react'
import { buildSections, formatCurrency, formatDate, formatDateTime, getAdminSectionKey, joinValues, safeText } from './adminSections'

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
  const styles = {
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-600' }
  }

  const current = styles[tone] || styles.slate

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
  const commonClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  if (field.type === 'textarea') {
    return (
      <textarea
        className={`${commonClass} min-h-[110px]`}
        value={value || ''}
        onChange={onChange}
        placeholder={field.placeholder || ''}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select className={commonClass} value={value || ''} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'multiSelect') {
    const selectedValues = Array.isArray(value) ? value.map(String) : []

    const toggleOption = (optionValue) => {
      const normalized = String(optionValue)
      const exists = selectedValues.includes(normalized)
      const nextValues = exists
        ? selectedValues.filter((item) => item !== normalized)
        : [...selectedValues, normalized]
      onChange(nextValues)
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 text-xs text-slate-500">Select one or more subjects</div>
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-auto pr-1">
          {options.filter((option) => option.value).map((option) => (
            <label key={option.value} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={selectedValues.includes(String(option.value))}
                onChange={() => toggleOption(option.value)}
              />
              <span className="text-sm text-slate-700">{option.label}</span>
            </label>
          ))}
          {!options.filter((option) => option.value).length && (
            <div className="text-sm text-slate-500">No subjects available</div>
          )}
        </div>
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>{field.label}</span>
      </label>
    )
  }

  return (
    <input
      className={commonClass}
      type={field.type || 'text'}
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder || ''}
    />
  )
}

const getValueByPath = (record, accessor) => {
  if (!accessor) return ''
  return accessor.split('.').reduce((accumulator, key) => (accumulator ? accumulator[key] : undefined), record)
}

const resolveSelectOptions = (field) => field.options || []

const AdminDashboard = () => {
  const location = useLocation()
  const sectionKey = getAdminSectionKey(location.pathname)
  const [lookups, setLookups] = useState({ students: [], teachers: [], classes: [], subjects: [] })
  const [records, setRecords] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sections = useMemo(() => buildSections(lookups), [lookups])
  const section = sections[sectionKey] || sections.dashboard

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/students`),
          axios.get(`${API_URL}/admin/teachers`),
          axios.get(`${API_URL}/admin/classes`),
          axios.get(`${API_URL}/admin/subjects`)
        ])

        setLookups({
          students: studentsRes.data.students || [],
          teachers: teachersRes.data.teachers || [],
          classes: classesRes.data.classes || [],
          subjects: subjectsRes.data.subjects || []
        })
      } catch (lookupError) {
        setError(lookupError.response?.data?.message || 'Failed to load admin lookups')
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
          const response = await axios.get(`${API_URL}/admin/dashboard`)
          setDashboardData(response.data.data || null)
          setRecords([])
        } else if (section.key === 'reports') {
          const response = await axios.get(`${API_URL}/admin/reports`)
          setReportData(response.data.report || null)
          setRecords([])
        } else {
          const response = await axios.get(`${API_URL}/admin/${section.endpoint}`)
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

  const refreshCurrentSection = async () => {
    setLoading(true)
    setError('')
    try {
      if (section.key === 'dashboard') {
        const response = await axios.get(`${API_URL}/admin/dashboard`)
        setDashboardData(response.data.data || null)
      } else if (section.key === 'reports') {
        const response = await axios.get(`${API_URL}/admin/reports`)
        setReportData(response.data.report || null)
      } else {
        const response = await axios.get(`${API_URL}/admin/${section.endpoint}`)
        setRecords(response.data[section.responseKey] || [])
      }
    } catch (refreshError) {
      setError(refreshError.response?.data?.message || 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, rawValue) => {
    const nextValue = Array.isArray(rawValue)
      ? rawValue
      : field.type === 'checkbox'
      ? rawValue.target.checked
      : field.type === 'multiSelect'
        ? Array.from(rawValue.target.selectedOptions).map((option) => option.value)
        : rawValue.target.value

    setForm((current) => ({
      ...current,
      [field.name]: nextValue
    }))
  }

  const handleEdit = (record) => {
    if (!section.toFormValues) return
    setEditingId(record._id)
    setForm(section.toFormValues(record))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete ${section.title.toLowerCase().replace('manage ', '')}?`)) {
      return
    }

    try {
      await axios.delete(`${API_URL}/admin/${section.endpoint}/${record._id}`)
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
      const url = editingId ? `${API_URL}/admin/${section.endpoint}/${editingId}` : `${API_URL}/admin/${section.endpoint}`
      const method = editingId ? 'put' : 'post'

      await axios[method](url, payload)
      setEditingId(null)
      setForm(section.initialForm || {})
      await refreshCurrentSection()
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const summaryCards = useMemo(() => {
    if (section.key === 'dashboard') {
      const stats = dashboardData?.stats || {}
      return [
        { label: 'Students', value: stats.totalStudents || 0, helper: 'Active student records', icon: Users, tone: 'blue' },
        { label: 'Teachers', value: stats.totalTeachers || 0, helper: 'Staff records', icon: School, tone: 'emerald' },
        { label: 'Classes', value: stats.totalClasses || 0, helper: 'Configured class groups', icon: BookOpen, tone: 'amber' },
        { label: 'Assignments', value: dashboardData?.recentActivities?.filter((item) => item.type === 'assignment').length || 0, helper: 'Recent assignment tasks', icon: ClipboardList, tone: 'rose' }
      ]
    }

    if (section.key === 'reports') {
      const summary = reportData?.summary || {}
      return [
        { label: 'Attendance', value: `${summary.attendanceRate || 0}%`, helper: 'Overall attendance rate', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Average Marks', value: `${summary.averageMarks || 0}%`, helper: 'Across all results', icon: BarChart3, tone: 'blue' },
        { label: 'Pending Fees', value: formatCurrency(summary.pendingFeesAmount || 0), helper: 'Unpaid fee balance', icon: DollarSign, tone: 'amber' },
        { label: 'Events', value: summary.events || 0, helper: 'Scheduled events', icon: CalendarDays, tone: 'rose' }
      ]
    }

    return []
  }, [dashboardData, reportData, section.key])

  const renderField = (field) => {
    const options = resolveSelectOptions(field)

    return (
      <div key={field.name} className={field.type === 'checkbox' ? 'col-span-1 md:col-span-2' : ''}>
        {field.type !== 'checkbox' && (
          <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
        )}
        <FieldWrapper
          field={field}
          value={form[field.name]}
          onChange={(event) => handleFieldChange(field, event)}
          options={options}
        />
      </div>
    )
  }

  const renderTable = () => {
    if (!section.columns || !records.length) {
      return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">No records found.</div>
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {section.columns.map((column) => (
                  <th key={column.label} className="px-4 py-3 text-left font-semibold text-slate-600">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-slate-50/70">
                  {section.columns.map((column) => (
                    <td key={column.label} className="px-4 py-3 text-slate-700">
                      {column.render ? column.render(record) : safeText(getValueByPath(record, column.accessor))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    const stats = dashboardData?.stats || {}
    const recentActivities = dashboardData?.recentActivities || []
    const upcomingEvents = dashboardData?.upcomingEvents || []
    const notices = dashboardData?.notices || []

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} tone={{ bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-600' }} trend={0} />
          <StatCard icon={School} label="Total Teachers" value={stats.totalTeachers || 0} tone={{ bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-600' }} trend={0} />
          <StatCard icon={BookOpen} label="Total Classes" value={stats.totalClasses || 0} tone={{ bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-600' }} trend={0} />
          <StatCard icon={DollarSign} label="Fee Collection" value={`${stats.feeCollectionRate || 0}%`} tone={{ bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-600' }} trend={0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Attendance Rate" value={`${stats.attendanceRate || 0}%`} helper="Overall school attendance" icon={CheckCircle2} tone="emerald" />
          <SummaryCard label="Pending Fees" value={formatCurrency(stats.pendingFeesAmount || 0)} helper="Outstanding balance" icon={DollarSign} tone="amber" />
          <SummaryCard label="Average Class Size" value={stats.averageClassSize || 0} helper="Average students per class" icon={Users} tone="blue" />
          <SummaryCard label="Total Fees" value={formatCurrency(stats.totalFees || 0)} helper="All tracked fee records" icon={FileText} tone="slate" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-4">
              {recentActivities.length ? recentActivities.map((activity, index) => (
                <div key={`${activity.title}-${index}`} className="flex gap-4 rounded-2xl border border-slate-100 p-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${activity.type === 'assignment' ? 'bg-blue-600' : activity.type === 'event' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {activity.type === 'assignment' ? <ClipboardList size={18} className="text-white" /> : activity.type === 'event' ? <Calendar size={18} className="text-white" /> : <Bell size={18} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{activity.description}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDateTime(activity.timestamp)}</p>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No recent activity yet.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Calendar size={20} className="text-blue-600" />
              Upcoming Events
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length ? upcomingEvents.map((event, index) => (
                <div key={`${event.title}-${index}`} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(event.date)}</p>
                  {event.location && <p className="text-xs text-slate-500 mt-1">{event.location}</p>}
                </div>
              )) : <div className="text-sm text-slate-500">No upcoming events.</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
            <Users className="mx-auto text-blue-600 mb-2" size={28} />
            <p className="font-semibold text-slate-900">Manage Students</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <School className="mx-auto text-emerald-600 mb-2" size={28} />
            <p className="font-semibold text-slate-900">Manage Teachers</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center">
            <ClipboardList className="mx-auto text-amber-600 mb-2" size={28} />
            <p className="font-semibold text-slate-900">Assign Tasks</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
            <FileText className="mx-auto text-rose-600 mb-2" size={28} />
            <p className="font-semibold text-slate-900">Generate Reports</p>
          </div>
        </div>

        {notices.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" />
              Recent Notices
            </h3>
            <div className="space-y-3">
              {notices.map((notice, index) => (
                <div key={`${notice.title}-${index}`} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{notice.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderReports = () => {
    const summary = reportData?.summary || {}
    const lowAttendanceStudents = reportData?.lowAttendanceStudents || []
    const feeSummary = reportData?.feeSummary || []
    const recentResults = reportData?.recentResults || []

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Low Attendance Students</h3>
            <div className="space-y-3">
              {lowAttendanceStudents.length ? lowAttendanceStudents.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{student.rollNumber} · {student.className}</p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{student.attendanceRate}%</span>
                </div>
              )) : <div className="text-sm text-slate-500">No attendance issues detected.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Fee Summary</h3>
            <div className="space-y-3">
              {feeSummary.length ? feeSummary.map((fee) => (
                <div key={fee.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{fee.student}</p>
                      <p className="text-xs text-slate-500 mt-1">{fee.rollNumber}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(fee.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Status: {safeText(fee.status)} · Due: {formatDate(fee.dueDate)}</p>
                </div>
              )) : <div className="text-sm text-slate-500">No fee records available.</div>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Results</h3>
          <div className="space-y-3">
            {recentResults.length ? recentResults.map((result) => (
              <div key={result.id} className="rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{result.student}</p>
                  <p className="text-xs text-slate-500 mt-1">{result.rollNumber} · {result.className} · {result.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{result.percentage}%</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{result.grade}</span>
                </div>
              </div>
            )) : <div className="text-sm text-slate-500">No result data available.</div>}
          </div>
        </div>
      </div>
    )
  }

  const fields = section.fields || []
  const showForm = section.canCreate && fields.length > 0

  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
          <LayoutDashboard size={14} />
          {section.title}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{section.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200">{section.description}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

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
            <button
              onClick={refreshCurrentSection}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {section.key === 'dashboard' && renderDashboard()}
          {section.key === 'reports' && renderReports()}

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editingId ? `Edit ${section.title.replace('Manage ', '')}` : section.createLabel}</h3>
                  <p className="text-sm text-slate-500 mt-1">Use this form to save live records to MongoDB.</p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setForm(section.initialForm || {})
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.map(renderField)}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setForm(section.initialForm || {})
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus size={16} />
                  Reset
                </button>
              </div>
            </form>
          )}

          {section.key !== 'dashboard' && section.key !== 'reports' && renderTable()}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard