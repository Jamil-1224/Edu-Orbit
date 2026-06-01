import React, { useEffect, useMemo, useState } from 'react'
import { Bell, Download } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const ParentNotices = () => {
  const [filter, setFilter] = useState('all')
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const response = await axios.get(`${API_URL}/parent/notices`)
        setNotices(response.data.notices || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notices')
      } finally {
        setLoading(false)
      }
    }

    loadNotices()
  }, [])

  const filteredNotices = useMemo(
    () => (filter === 'all' ? notices : notices.filter((notice) => notice.category === filter)),
    [filter, notices]
  )

  const unreadCount = notices.filter((notice) => !notice.isRead).length
  const urgentCount = notices.filter((notice) => notice.isUrgent && !notice.isRead).length

  const getCategoryColor = (category) => ({
    event: 'bg-blue-50 border-l-4 border-blue-500',
    academic: 'bg-green-50 border-l-4 border-green-500',
    holiday: 'bg-purple-50 border-l-4 border-purple-500',
    alert: 'bg-red-50 border-l-4 border-red-500'
  }[category] || 'bg-gray-50 border-l-4 border-gray-500')

  const getCategoryBadgeColor = (category) => ({
    event: 'badge-blue',
    academic: 'badge-green',
    holiday: 'badge-purple',
    alert: 'badge-red'
  }[category] || 'badge-gray')

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Notices</h1>
          <p className="mt-1 text-gray-600">Notices from teachers and school administration</p>
        </div>
        <div className="flex gap-4">
          {urgentCount > 0 && (
            <div className="rounded-lg bg-red-100 px-4 py-2 text-red-800">
              <p className="text-sm font-semibold">{urgentCount} Urgent</p>
            </div>
          )}
          <div className="rounded-lg bg-blue-100 px-4 py-2 text-blue-800">
            <p className="text-sm font-semibold">{unreadCount} Unread</p>
          </div>
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
                <div className="mb-2 flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                  {notice.isUrgent && <span className="badge bg-red-500 text-white text-xs animate-pulse">URGENT</span>}
                  {!notice.isRead && <span className="badge bg-blue-500 text-white text-xs">NEW</span>}
                </div>
                <span className={`badge ${getCategoryBadgeColor(notice.category)} mb-3 text-xs`}>{notice.category}</span>
                <p className="mb-3 text-gray-700">{notice.content}</p>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gray-600">{notice.date ? new Date(notice.date).toLocaleDateString() : 'N/A'}</p>
                  {notice.attachment && (
                    <button className="btn btn-sm btn-secondary flex items-center gap-1">
                      <Download size={16} />
                      Download
                    </button>
                  )}
                </div>
                {!!notice.targetAudience?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notice.targetAudience.map((audience) => (
                      <span key={audience} className="badge badge-gray text-xs">{audience}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="card py-12 text-center">
            <Bell className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No notices in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ParentNotices