import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Users, BarChart3, DollarSign, AlertCircle, Calendar, CheckCircle } from 'lucide-react'
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

const ParentDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/parent/dashboard`)
        setData(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load parent dashboard')
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
  const children = data?.children || []
  const alerts = data?.alerts || []
  const notices = data?.notices || []
  const upcomingEvents = data?.upcomingEvents || []

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-gray-600 mt-2">Live overview of your children’s progress and school activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Users}
                label="Children"
                value={stats.totalChildren || 0}
                color="bg-blue-500"
              />
              <StatCard
                icon={BarChart3}
                label="Avg Attendance"
                value={`${stats.overallAttendance || 0}%`}
                color="bg-green-500"
              />
              <StatCard
                icon={DollarSign}
                label="Pending Fees"
                value={`₹${(stats.pendingFees || 0).toLocaleString()}`}
                color="bg-orange-500"
              />
              <StatCard
                icon={CheckCircle}
                label="Fee Status"
                value={stats.feeStatus || 'N/A'}
                color="bg-purple-500"
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* My Children */}
              <div className="lg:col-span-2 card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users size={20} />
                  My Children
                </h3>
                <div className="space-y-4">
                  {children.length ? children.map((child, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-semibold text-gray-900">{child.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Class</p>
                          <p className="font-semibold text-gray-900">{child.class}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Attendance</p>
                          <p className="font-semibold text-green-600">{child.attendance}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">GPA</p>
                          <p className="font-semibold text-blue-600">{child.gpa}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button className="btn btn-sm btn-primary">View Details</button>
                        <button className="btn btn-sm btn-secondary">View Marks</button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">No linked children found.</div>}
                </div>
              </div>

              {/* Quick Summary */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Attendance</p>
                    <p className="text-2xl font-bold text-green-600">{stats.overallAttendance || 0}%</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average GPA</p>
                    <p className="text-2xl font-bold text-blue-600">{children.length ? (children.reduce((sum, child) => sum + (child.gpa || 0), 0) / children.length).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending Fees</p>
                    <p className="text-2xl font-bold text-orange-600">₹{(stats.pendingFees || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts and Notices */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" />
                  Important Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.length ? alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded border-l-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                      <p className={`font-semibold ${alert.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'}`}>{alert.title}</p>
                      <p className={`text-sm mt-1 ${alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>{alert.description}</p>
                    </div>
                  )) : <div className="text-sm text-gray-500">No alerts.</div>}
                </div>
              </div>

              {/* School Events */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Upcoming Events
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.length ? upcomingEvents.map((item, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.date ? new Date(item.date).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  )) : <div className="text-sm text-gray-500">No upcoming events.</div>}
                </div>
              </div>
            </div>

            <div className="mt-6 card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-blue-500" />
                School Notices
              </h3>
              <div className="space-y-3">
                {notices.length ? notices.map((notice, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{notice.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
                  </div>
                )) : <div className="text-sm text-gray-500">No notices available.</div>}
              </div>
            </div>
          </>
        }
      />
    </Routes>
  )
}

export default ParentDashboard
