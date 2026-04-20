import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  Library,
  Bell,
  BarChart3,
  ClipboardList,
  User,
  BookMarked,
  AlertCircle,
  Settings
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuthStore()
  const location = useLocation()

  const roleMenus = {
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Manage Students', icon: Users, path: '/admin/students' },
      { label: 'Manage Teachers', icon: Users, path: '/admin/teachers' },
      { label: 'Manage Classes', icon: BookOpen, path: '/admin/classes' },
      { label: 'Manage Subjects', icon: BookMarked, path: '/admin/subjects' },
      { label: 'Attendance', icon: ClipboardList, path: '/admin/attendance' },
      { label: 'Results', icon: BarChart3, path: '/admin/results' },
      { label: 'Assignments', icon: FileText, path: '/admin/assignments' },
      { label: 'Fees Management', icon: DollarSign, path: '/admin/fees' },
      { label: 'Library', icon: Library, path: '/admin/library' },
      { label: 'Notices', icon: Bell, path: '/admin/notices' },
      { label: 'Events', icon: Calendar, path: '/admin/events' },
      { label: 'Reports', icon: FileText, path: '/admin/reports' }
    ],
    teacher: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
      { label: 'My Classes', icon: BookOpen, path: '/teacher/classes' },
      { label: 'Attendance', icon: ClipboardList, path: '/teacher/attendance' },
      { label: 'Marks', icon: BarChart3, path: '/teacher/marks' },
      { label: 'Assignments', icon: FileText, path: '/teacher/assignments' },
      { label: 'Routine', icon: Calendar, path: '/teacher/routine' },
      { label: 'Notices', icon: Bell, path: '/teacher/notices' }
    ],
    student: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
      { label: 'My Profile', icon: User, path: '/student/profile' },
      { label: 'Attendance', icon: ClipboardList, path: '/student/attendance' },
      { label: 'My Results', icon: BarChart3, path: '/student/results' },
      { label: 'My Routine', icon: Calendar, path: '/student/routine' },
      { label: 'Assignments', icon: FileText, path: '/student/assignments' },
      { label: 'Notices', icon: Bell, path: '/student/notices' },
      { label: 'Library', icon: Library, path: '/student/library' },
      { label: 'My Fees', icon: DollarSign, path: '/student/fees' }
    ],
    parent: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
      { label: 'My Children', icon: Users, path: '/parent/children' },
      { label: 'Attendance', icon: ClipboardList, path: '/parent/attendance' },
      { label: 'Results', icon: BarChart3, path: '/parent/results' },
      { label: 'Notices', icon: Bell, path: '/parent/notices' },
      { label: 'Communication', icon: AlertCircle, path: '/parent/communication' }
    ]
  }

  const menuItems = roleMenus[user?.role] || []

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-0 lg:w-64'
        } bg-slate-800 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-400">Edu Orbit</h2>
          <p className="text-xs text-gray-400 capitalize mt-1">{user?.role}</p>
        </div>

        <nav className="mt-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    setIsOpen(false)
                  }
                }}
                className={`
                  flex items-center gap-3 px-6 py-3 transition-colors
                  ${
                    active
                      ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                      : 'text-gray-300 hover:bg-slate-700'
                  }
                `}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-64 p-6 border-t border-slate-700">
          <Link
            to="/settings"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
          >
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
