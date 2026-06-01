import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import TeacherDashboard from './pages/Teacher/TeacherDashboard'
import TeacherProfile from './pages/Teacher/TeacherProfile'
import StudentDashboard from './pages/Student/StudentDashboard'
import ParentDashboard from './pages/Parent/ParentDashboard'
import NotFoundPage from './pages/NotFoundPage'

// Student Pages
import StudentProfile from './pages/Student/StudentProfile'
import StudentAttendance from './pages/Student/StudentAttendance'
import StudentResults from './pages/Student/StudentResults'
import StudentAssignments from './pages/Student/StudentAssignments'
import StudentNotices from './pages/Student/StudentNotices'

// Parent Pages
import ParentChildren from './pages/Parent/ParentChildren'
import ParentAttendance from './pages/Parent/ParentAttendance'
import ParentResults from './pages/Parent/ParentResults'
import ParentNotices from './pages/Parent/ParentNotices'
import ParentCommunication from './pages/Parent/ParentCommunication'

function App() {
  const { token, user, initializeAuth } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeAuth()
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notices"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentNotices />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentChildren />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/results"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/notices"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/communication"
            element={
              <ProtectedRoute requiredRole="parent">
                <ParentCommunication />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}

export default App
