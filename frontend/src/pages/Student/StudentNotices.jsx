import React, { useEffect, useMemo, useState } from 'react'
import { Bell, Download, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StudentNotices = () => {
  const [filter, setFilter] = useState('all')
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/notices`)
        setNotices(response.data.notices || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notices')
      } finally {
        setLoading(false)
      }
    }
    loadNotices()
  }, [])

  const filteredNotices = useMemo(() => (filter === 'all' ? notices : notices.filter((notice) => notice.category === filter)), [filter, notices])
  const unreadCount = notices.filter((notice) => !notice.isRead).length
  const urgentCount = notices.filter((notice) => notice.isUrgent && !notice.isRead).length
  const getCategoryColor = (category) => ({ event: 'bg-blue-50 border-l-4 border-blue-500', academic: 'bg-green-50 border-l-4 border-green-500', holiday: 'bg-purple-50 border-l-4 border-purple-500', alert: 'bg-red-50 border-l-4 border-red-500' }[category] || 'bg-gray-50 border-l-4 border-gray-500')
  const getCategoryBadgeColor = (category) => ({ event: 'badge-blue', academic: 'badge-green', holiday: 'badge-purple', alert: 'badge-red' }[category] || 'badge-gray')

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`${API_URL}/student/notices/${id}/read`)
      setNotices((current) => current.map((notice) => (notice.id === id ? { ...notice, isRead: true } : notice)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark notice as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/student/notices/${id}`)
      setNotices((current) => current.filter((notice) => notice.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove notice')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">Live announcements from the database</p>
        </div>
        <div className="flex gap-4">
          {urgentCount > 0 && <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg"><p className="text-sm font-semibold">{urgentCount} Urgent</p></div>}
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg"><p className="text-sm font-semibold">{unreadCount} Unread</p></div>
        </div>
      </div>

      <div className="card">
        <label className="form-label">Filter by Category</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input max-w-xs">
          <option value="all">All Notices</option>
          <option value="event">Events</option>
          <option value="academic">Academic</option>
          <option value="holiday">Holidays</option>
          <option value="alert">Alerts</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredNotices.length ? filteredNotices.map((notice) => (
          <div key={notice.id} className={`card p-6 ${getCategoryColor(notice.category)} ${!notice.isRead ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                  {notice.isUrgent && <span className="badge bg-red-500 text-white text-xs animate-pulse">URGENT</span>}
                  {!notice.isRead && <span className="badge bg-blue-500 text-white text-xs">NEW</span>}
                </div>
                <span className={`badge ${getCategoryBadgeColor(notice.category)} text-xs mb-3`}>{notice.category}</span>
                <p className="text-gray-700 mb-3">{notice.content}</p>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gray-600">{notice.date ? new Date(notice.date).toLocaleDateString() : 'N/A'}</p>
                  {notice.attachment && <button className="btn btn-sm btn-secondary flex items-center gap-1"><Download size={16} />Download</button>}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {!notice.isRead && <button onClick={() => handleMarkAsRead(notice.id)} className="btn btn-sm btn-primary">Mark as Read</button>}
              <button onClick={() => handleDelete(notice.id)} className="btn btn-sm btn-secondary"><Trash2 size={16} /></button>
            </div>
          </div>
        )) : <div className="card text-center py-12"><Bell className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-600">No notices in this category</p></div>}
      </div>
    </div>
  )
}

export default StudentNotices
