import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BarChart3, FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={32} />
      </div>
    </div>
  </div>
)

const StudentDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/dashboard`)
        setData(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">{error}</div>
  }

  const stats = data?.stats || {}
  const schedule = data?.schedule || []
  const recentGrades = data?.recentGrades || []
  const pendingAssignments = data?.pendingAssignments || []
  const upcomingEvents = data?.upcomingEvents || []

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600 mt-2">Live academic overview from MongoDB.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={TrendingUp}
                label="GPA"
                value={stats.gpa || 0}
                color="bg-blue-500"
              />
              <StatCard
                icon={BarChart3}
                label="Attendance"
                value={`${stats.attendancePercentage || 0}%`}
                color="bg-green-500"
              />
              <StatCard
                icon={FileText}
                label="Assignments"
                value={stats.assignmentCount || 0}
                color="bg-purple-500"
              />
              <StatCard
                icon={DollarSign}
                label="Fee Status"
                value={stats.feeStatus || 'N/A'}
                color="bg-orange-500"
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Class Schedule */}
              <div className="lg:col-span-2 card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  This Week's Schedule
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Day</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Subject</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Room</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.length ? schedule.map((session, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{session.day}</td>
                          <td className="py-2 px-2 font-semibold text-gray-900">{session.subject}</td>
                          <td className="py-2 px-2">{session.startTime || 'TBD'} - {session.endTime || 'TBD'}</td>
                          <td className="py-2 px-2 text-gray-600">{session.teacher}</td>
                        </tr>
                      )) : (
                        <tr><td className="py-4 text-gray-500" colSpan="4">No class routine available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Grades */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Recent Grades
                </h3>
                <div className="space-y-3">
                  {recentGrades.length ? recentGrades.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-gray-900">{item.subject}</p>
                        <span className="badge badge-blue">{item.grade}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{item.percentage}%</p>
                    </div>
                  )) : <div className="text-sm text-gray-500">No marks available yet.</div>}
                </div>
              </div>
            </div>

            {/* Pending Assignments and Events */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Assignments */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Pending Assignments
                </h3>
                <div className="space-y-3">
                  {pendingAssignments.length ? pendingAssignments.map((assignment, index) => (
                    <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="font-semibold text-gray-900">{assignment.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                      <p className="text-xs text-red-600 font-semibold mt-2">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  )) : <div className="text-sm text-gray-500">No pending assignments.</div>}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Upcoming Events
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.length ? upcomingEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{event.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</p>
                        </div>
                        <span className="badge badge-blue text-xs">{event.type}</span>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">No upcoming events.</div>}
                </div>
              </div>
            </div>
          </>
        }
      />
    </Routes>
  )
}

export default StudentDashboard
