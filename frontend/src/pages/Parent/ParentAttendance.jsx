import React, { useState } from 'react'
import { Calendar, TrendingUp, AlertCircle, Filter } from 'lucide-react'

const ParentAttendance = () => {
  const [selectedChild, setSelectedChild] = useState(1)
  const [monthFilter, setMonthFilter] = useState('2024-12')

  const children = [
    { id: 1, name: 'Aarav Kumar', class: '10-A' },
    { id: 2, name: 'Anaya Kumar', class: '8-B' }
  ]

  const attendanceData = {
    1: [
      { date: '2024-12-01', status: 'present', subject: 'Mathematics' },
      { date: '2024-12-02', status: 'present', subject: 'English' },
      { date: '2024-12-03', status: 'absent', subject: 'Science' },
      { date: '2024-12-04', status: 'present', subject: 'History' },
      { date: '2024-12-05', status: 'present', subject: 'Mathematics' },
      { date: '2024-12-06', status: 'leave', subject: 'English' },
      { date: '2024-12-09', status: 'present', subject: 'Science' },
      { date: '2024-12-10', status: 'present', subject: 'Mathematics' },
      { date: '2024-12-11', status: 'late', subject: 'English' },
      { date: '2024-12-12', status: 'present', subject: 'History' },
    ],
    2: [
      { date: '2024-12-01', status: 'present', subject: 'English' },
      { date: '2024-12-02', status: 'present', subject: 'Mathematics' },
      { date: '2024-12-03', status: 'present', subject: 'Science' },
      { date: '2024-12-04', status: 'present', subject: 'History' },
      { date: '2024-12-05', status: 'present', subject: 'Mathematics' },
      { date: '2024-12-06', status: 'present', subject: 'English' },
      { date: '2024-12-09', status: 'present', subject: 'Science' },
      { date: '2024-12-10', status: 'absent', subject: 'Mathematics' },
      { date: '2024-12-11', status: 'present', subject: 'English' },
      { date: '2024-12-12', status: 'present', subject: 'History' },
    ]
  }

  const calculateStats = (data) => {
    return {
      present: data.filter(d => d.status === 'present').length,
      absent: data.filter(d => d.status === 'absent').length,
      leave: data.filter(d => d.status === 'leave').length,
      late: data.filter(d => d.status === 'late').length,
      total: data.length,
      percentage: Math.round((data.filter(d => d.status === 'present').length / data.length) * 100)
    }
  }

  const currentData = attendanceData[selectedChild] || []
  const stats = calculateStats(currentData)
  const currentChild = children.find(c => c.id === selectedChild)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Child's Attendance</h1>
        <p className="text-gray-600 mt-1">Monitor your child's attendance record</p>
      </div>

      {/* Child Selector */}
      <div className="card">
        <label className="form-label">Select Child</label>
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(Number(e.target.value))}
          className="form-input max-w-xs"
        >
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.name} ({child.class})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Classes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Leave</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.leave}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Attendance %</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.percentage}%</p>
        </div>
      </div>

      {/* Alert */}
      {stats.percentage < 75 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-900">Attendance Below 75%</p>
            <p className="text-sm text-red-800 mt-1">
              {currentChild?.name}'s attendance has fallen below 75%. Please ensure regular attendance to avoid academic issues.
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card">
        <label className="form-label">Filter by Month</label>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="form-input max-w-xs"
        />
      </div>

      {/* Attendance List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Attendance Records
        </h3>
        <div className="space-y-3">
          {currentData.map((record, index) => (
            <div key={index} className={`p-4 rounded-lg ${getStatusColor(record.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{record.subject}</p>
                </div>
                <span className={`badge ${getStatusBadgeColor(record.status)} capitalize`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Attendance Trend
        </h3>
        <div className="flex items-end gap-1 h-32">
          {[85, 90, 88, 92, 85, 80, 90, 95, 88, 92].map((percentage, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
              style={{ height: `${percentage}%` }}
              title={`Day ${index + 1}: ${percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Parent Notes */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Important Notes</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Regular attendance is crucial for academic success</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Students must maintain at least 75% attendance to be eligible for exams</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Please inform the school in case of authorized absences</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>This data is updated daily by the school administration</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ParentAttendance
