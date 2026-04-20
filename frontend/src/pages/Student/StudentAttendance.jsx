import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, TrendingUp, AlertCircle, Download } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StudentAttendance = () => {
  const [monthFilter, setMonthFilter] = useState('')
  const [attendance, setAttendance] = useState([])
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0, late: 0, attendancePercentage: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/attendance`)
        const records = response.data.attendance || []
        setAttendance(records)
        setSummary(response.data.summary || { total: 0, present: 0, absent: 0, leave: 0, late: 0, attendancePercentage: 0 })
        const latestDate = records[0]?.date
        setMonthFilter(latestDate ? latestDate.slice(0, 7) : new Date().toISOString().slice(0, 7))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance')
      } finally {
        setLoading(false)
      }
    }

    loadAttendance()
  }, [])

  const filteredAttendance = useMemo(() => {
    if (!monthFilter) return attendance
    return attendance.filter((record) => (record.date || '').slice(0, 7) === monthFilter)
  }, [attendance, monthFilter])

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-50 border-l-4 border-green-500'
      case 'absent': return 'bg-red-50 border-l-4 border-red-500'
      case 'leave': return 'bg-yellow-50 border-l-4 border-yellow-500'
      case 'late': return 'bg-orange-50 border-l-4 border-orange-500'
      default: return 'bg-gray-50 border-l-4 border-gray-500'
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'present': return 'badge-green'
      case 'absent': return 'badge-red'
      case 'leave': return 'badge-yellow'
      case 'late': return 'badge-orange'
      default: return 'badge-blue'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">Loaded from MongoDB</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download size={20} />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card"><p className="text-sm text-gray-600">Total Classes</p><p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Present</p><p className="text-3xl font-bold text-green-600 mt-2">{summary.present}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Absent</p><p className="text-3xl font-bold text-red-600 mt-2">{summary.absent}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Leave</p><p className="text-3xl font-bold text-yellow-600 mt-2">{summary.leave}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Attendance %</p><p className="text-3xl font-bold text-blue-600 mt-2">{summary.attendancePercentage}%</p></div>
      </div>

      {summary.attendancePercentage < 75 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-900">Low Attendance Warning</p>
            <p className="text-sm text-red-800 mt-1">Your attendance is below 75%.</p>
          </div>
        </div>
      )}

      <div className="card">
        <label className="form-label">Filter by Month</label>
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="form-input max-w-xs" />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} />Attendance Records</h3>
        <div className="space-y-3">
          {filteredAttendance.length ? filteredAttendance.map((record) => (
            <div key={record.id} className={`p-4 rounded-lg ${getStatusColor(record.status)}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-1">{record.remarks || record.className || 'Attendance record'}</p>
                </div>
                <span className={`badge ${getStatusBadgeColor(record.status)} capitalize`}>{record.status}</span>
              </div>
            </div>
          )) : <div className="text-sm text-gray-500">No attendance records found for this month.</div>}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20} />Attendance Trend</h3>
        <div className="flex items-end gap-1 h-32">
          {filteredAttendance.slice(0, 10).map((record, index) => {
            const height = record.status === 'present' ? 90 : record.status === 'late' ? 75 : record.status === 'leave' ? 50 : 30
            return <div key={index} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${height}%` }} title={record.status} />
          })}
        </div>
      </div>
    </div>
  )
}

export default StudentAttendance
