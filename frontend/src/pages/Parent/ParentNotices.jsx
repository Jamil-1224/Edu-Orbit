import React, { useState } from 'react'
import { Bell, Download, Trash2, Archive } from 'lucide-react'

const ParentNotices = () => {
  const [filter, setFilter] = useState('all')
  const [notices, setNotices] = useState([
    {
      id: 1,
      title: 'Annual Sports Day - December 20, 2024',
      content: 'The annual sports day will be held on December 20, 2024. All students are expected to participate. Parents are cordially invited to watch and support their children.',
      category: 'event',
      date: '2024-12-10',
      isUrgent: true,
      isRead: false,
      attachment: 'sports-day-schedule.pdf',
      targetAudience: ['Parents', 'Students']
    },
    {
      id: 2,
      title: 'Parent-Teacher Meeting Schedule',
      content: 'Parent-Teacher meetings are scheduled for December 27-28, 2024. We request all parents to attend to discuss their child\'s progress and performance.',
      category: 'general',
      date: '2024-12-08',
      isUrgent: true,
      isRead: false,
      attachment: null,
      targetAudience: ['Parents']
    },
    {
      id: 3,
      title: 'School Closure - Winter Holidays',
      content: 'The school will be closed from December 22, 2024 to January 1, 2025 for winter holidays. Classes will resume on January 2, 2025.',
      category: 'holiday',
      date: '2024-12-05',
      isUrgent: false,
      isRead: true,
      attachment: null,
      targetAudience: ['Parents', 'Students']
    },
    {
      id: 4,
      title: 'Fee Payment Reminder',
      content: 'This is a reminder that school fees for December are due by December 25, 2024. Please submit your fees through the online portal or visit the school office.',
      category: 'alert',
      date: '2024-12-03',
      isUrgent: true,
      isRead: false,
      attachment: null,
      targetAudience: ['Parents']
    },
    {
      id: 5,
      title: 'Science Exhibition Registrations',
      content: 'Registrations for the Science Exhibition are now open. Students interested in showcasing their projects should register by December 18, 2024. Parents support is appreciated.',
      category: 'academic',
      date: '2024-12-01',
      isUrgent: false,
      isRead: true,
      attachment: null,
      targetAudience: ['Parents', 'Students']
    },
    {
      id: 6,
      title: 'Library Extended Hours During Exam Season',
      content: 'The school library will remain open till 6:00 PM during the exam season. Students can use this time for additional study and research.',
      category: 'general',
      date: '2024-11-28',
      isUrgent: false,
      isRead: true,
      attachment: null,
      targetAudience: ['Students']
    }
  ])

  const getCategoryColor = (category) => {
    switch (category) {
      case 'event': return 'bg-blue-50 border-l-4 border-blue-500'
      case 'academic': return 'bg-green-50 border-l-4 border-green-500'
      case 'holiday': return 'bg-purple-50 border-l-4 border-purple-500'
      case 'alert': return 'bg-red-50 border-l-4 border-red-500'
      default: return 'bg-gray-50 border-l-4 border-gray-500'
    }
  }

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'event': return 'badge-blue'
      case 'academic': return 'badge-green'
      case 'holiday': return 'badge-purple'
      case 'alert': return 'badge-red'
      default: return 'badge-gray'
    }
  }

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.category === filter)

  const unreadCount = notices.filter(n => !n.isRead).length
  const urgentCount = notices.filter(n => n.isUrgent && !n.isRead).length

  const handleMarkAsRead = (id) => {
    setNotices(notices.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
  }

  const handleDelete = (id) => {
    setNotices(notices.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Notices</h1>
          <p className="text-gray-600 mt-1">Stay updated with important school announcements</p>
        </div>
        <div className="flex gap-4">
          {urgentCount > 0 && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold">{urgentCount} Urgent</p>
            </div>
          )}
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            <p className="text-sm font-semibold">{unreadCount} Unread</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <label className="form-label">Filter by Category</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-input max-w-xs"
        >
          <option value="all">All Notices</option>
          <option value="event">Events</option>
          <option value="academic">Academic</option>
          <option value="holiday">Holidays</option>
          <option value="alert">Alerts</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`card p-6 ${getCategoryColor(notice.category)} ${
                !notice.isRead ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                    {notice.isUrgent && (
                      <span className="badge bg-red-500 text-white text-xs animate-pulse">URGENT</span>
                    )}
                    {!notice.isRead && (
                      <span className="badge bg-blue-500 text-white text-xs">NEW</span>
                    )}
                  </div>
                  <span className={`badge ${getCategoryBadgeColor(notice.category)} text-xs mb-3`}>
                    {notice.category}
                  </span>
                  <p className="text-gray-700 mb-4 leading-relaxed">{notice.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {new Date(notice.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {notice.attachment && (
                      <button className="btn btn-sm btn-secondary flex items-center gap-1">
                        <Download size={16} />
                        Download
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {notice.targetAudience.map((audience, idx) => (
                      <span key={idx} className="badge badge-gray text-xs">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!notice.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notice.id)}
                      className="btn btn-sm btn-primary whitespace-nowrap"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="btn btn-sm btn-secondary"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No notices in this category</p>
          </div>
        )}
      </div>

      {/* Parent Tips */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Parent Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Check notices regularly to stay updated with school events and deadlines</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Mark important notices as read to keep your inbox organized</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Attend Parent-Teacher meetings to discuss your child's progress</span>
          </li>
          <li className="flex items-start gap-2">
            <span>→</span>
            <span>Subscribe to email notifications to receive notices instantly</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ParentNotices
