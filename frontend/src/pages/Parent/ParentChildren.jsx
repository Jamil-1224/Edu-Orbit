import React, { useState } from 'react'
import { Users, BarChart3, User, TrendingUp, Phone, Mail } from 'lucide-react'

const ParentChildren = () => {
  const [selectedChildId, setSelectedChildId] = useState(1)

  const children = [
    {
      id: 1,
      name: 'Aarav Kumar',
      rollNumber: '2024-001',
      class: '10-A',
      admissionDate: '2023-04-15',
      dateOfBirth: '2009-06-20',
      imageUrl: 'https://via.placeholder.com/100',
      stats: {
        attendance: 88,
        averageMarks: 85,
        totalSubjects: 6,
        classRank: 8,
        recentAssignments: 3,
        totalNotices: 5
      },
      performance: 'Good',
      performanceColor: 'green'
    },
    {
      id: 2,
      name: 'Anaya Kumar',
      rollNumber: '2024-045',
      class: '8-B',
      admissionDate: '2022-04-10',
      dateOfBirth: '2011-08-12',
      imageUrl: 'https://via.placeholder.com/100',
      stats: {
        attendance: 92,
        averageMarks: 90,
        totalSubjects: 7,
        classRank: 3,
        recentAssignments: 2,
        totalNotices: 4
      },
      performance: 'Excellent',
      performanceColor: 'blue'
    }
  ]

  const selectedChild = children.find(c => c.id === selectedChildId)

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'bg-blue-50 border-blue-200'
      case 'Good': return 'bg-green-50 border-green-200'
      case 'Average': return 'bg-yellow-50 border-yellow-200'
      case 'Needs Improvement': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getPerformanceBadgeColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'bg-blue-500'
      case 'Good': return 'bg-green-500'
      case 'Average': return 'bg-yellow-500'
      case 'Needs Improvement': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-600 mt-1">Manage and monitor your children's academic progress</p>
      </div>

      {/* Children Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={`card cursor-pointer transition-all ${
              selectedChildId === child.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-4">
              <img
                src={child.imageUrl}
                alt={child.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-600">Roll No: {child.rollNumber}</p>
                <p className="text-sm text-gray-600">{child.class}</p>
              </div>
              <div className="text-right">
                <span className={`badge ${getPerformanceBadgeColor(child.performance)} text-white px-3 py-1`}>
                  {child.performance}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Child Details */}
      {selectedChild && (
        <div className="space-y-6">
          {/* Overview Card */}
          <div className={`card p-6 border-2 ${getPerformanceColor(selectedChild.performance)}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side - Child Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedChild.name}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Roll Number:</span>
                    <span className="font-semibold text-gray-900">{selectedChild.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-semibold text-gray-900">{selectedChild.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedChild.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedChild.admissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Quick Stats */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedChild.stats.attendance}%</p>
                    <p className="text-xs text-gray-600 mt-1">Attendance</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedChild.stats.averageMarks}%</p>
                    <p className="text-xs text-gray-600 mt-1">Avg. Marks</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">#{selectedChild.stats.classRank}</p>
                    <p className="text-xs text-gray-600 mt-1">Class Rank</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selectedChild.stats.totalSubjects}</p>
                    <p className="text-xs text-gray-600 mt-1">Subjects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mt-2">{selectedChild.stats.attendance}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${selectedChild.stats.attendance}%` }}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Average Marks</p>
                <BarChart3 size={20} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600 mt-2">{selectedChild.stats.averageMarks}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${selectedChild.stats.averageMarks}%` }}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Class Rank</p>
                <User size={20} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600 mt-2">#{selectedChild.stats.classRank}</p>
              <p className="text-xs text-gray-600 mt-3">Out of {selectedChild.stats.totalSubjects * 4} students</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="#" className="card text-center hover:shadow-lg transition-shadow">
              <BarChart3 className="mx-auto text-blue-600 mb-2" size={32} />
              <p className="font-semibold text-gray-900 text-sm">View Results</p>
            </a>
            <a href="#" className="card text-center hover:shadow-lg transition-shadow">
              <Users className="mx-auto text-green-600 mb-2" size={32} />
              <p className="font-semibold text-gray-900 text-sm">Attendance</p>
            </a>
            <a href="#" className="card text-center hover:shadow-lg transition-shadow">
              <Mail className="mx-auto text-purple-600 mb-2" size={32} />
              <p className="font-semibold text-gray-900 text-sm">Notices</p>
            </a>
            <a href="#" className="card text-center hover:shadow-lg transition-shadow">
              <Phone className="mx-auto text-orange-600 mb-2" size={32} />
              <p className="font-semibold text-gray-900 text-sm">Communicate</p>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentChildren
