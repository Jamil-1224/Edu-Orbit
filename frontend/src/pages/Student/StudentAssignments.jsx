import React, { useEffect, useMemo, useState } from 'react'
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StudentAssignments = () => {
  const [filter, setFilter] = useState('all')
  const [submitModal, setSubmitModal] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/assignments`)
        setAssignments(response.data.assignments || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [])

  const filteredAssignments = useMemo(() => (
    filter === 'all' ? assignments : assignments.filter((assignment) => assignment.status === filter)
  ), [assignments, filter])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted': return <CheckCircle className="text-green-600" size={20} />
      case 'pending': return <Clock className="text-blue-600" size={20} />
      case 'overdue': return <AlertCircle className="text-red-600" size={20} />
      default: return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-green-50 border-l-4 border-green-500'
      case 'pending': return 'bg-blue-50 border-l-4 border-blue-500'
      case 'overdue': return 'bg-red-50 border-l-4 border-red-500'
      default: return 'bg-gray-50'
    }
  }

  const handleSubmit = async () => {
    if (!submitModal || !uploadFile) return
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      await axios.post(`${API_URL}/student/assignments/${submitModal}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const response = await axios.get(`${API_URL}/student/assignments`)
      setAssignments(response.data.assignments || [])
      setSubmitModal(null)
      setUploadFile(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment')
    }
  }

  const stats = useMemo(() => {
    const submitted = assignments.filter((assignment) => assignment.status === 'submitted')
    const average = submitted.length
      ? Math.round(submitted.reduce((sum, assignment) => sum + ((assignment.marks / assignment.maxMarks) * 100), 0) / submitted.length)
      : 0

    return {
      total: assignments.length,
      submitted: submitted.length,
      pending: assignments.filter((assignment) => assignment.status === 'pending').length,
      overdue: assignments.filter((assignment) => assignment.status === 'overdue').length,
      avgScore: average
    }
  }, [assignments])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600 mt-1">Assignments loaded from MongoDB</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card"><p className="text-sm text-gray-600">Total</p><p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Submitted</p><p className="text-3xl font-bold text-green-600 mt-2">{stats.submitted}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Pending</p><p className="text-3xl font-bold text-blue-600 mt-2">{stats.pending}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Overdue</p><p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Avg Score</p><p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgScore}%</p></div>
      </div>

      <div className="card">
        <label className="form-label">Filter by Status</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input max-w-xs">
          <option value="all">All Assignments</option>
          <option value="submitted">Submitted</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredAssignments.length ? filteredAssignments.map((assignment) => (
          <div key={assignment.id} className={`card p-6 ${getStatusColor(assignment.status)}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-start gap-3">
                  {getStatusIcon(assignment.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3"><span className="badge badge-blue text-xs">{assignment.subject}</span><span className="badge badge-gray text-xs">{assignment.teacher}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Due Date</p>
                <p className="font-semibold text-gray-900">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</p>
                {assignment.status === 'submitted' && assignment.submittedDate && <p className="text-xs text-green-600 mt-2">Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}</p>}
              </div>

              <div className="flex flex-col justify-between">
                {assignment.status === 'submitted' ? (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Marks</p>
                    <p className="text-2xl font-bold text-green-600">{assignment.marks}/{assignment.maxMarks}</p>
                    {assignment.feedback && <div className="mt-3 p-2 bg-blue-100 rounded"><p className="text-xs text-blue-900 font-semibold">Feedback:</p><p className="text-xs text-blue-800 mt-1">{assignment.feedback}</p></div>}
                  </div>
                ) : (
                  <button onClick={() => setSubmitModal(assignment.id)} className="btn btn-primary justify-center text-sm"><Upload size={16} />Submit</button>
                )}
              </div>
            </div>
          </div>
        )) : <div className="card text-center py-12"><FileText className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-600">No assignments found.</p></div>}
      </div>

      {submitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Assignment</h2>
            <div className="mb-4">
              <label className="form-label">Upload File</label>
              <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="form-input" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setSubmitModal(null); setUploadFile(null) }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={!uploadFile}>Submit Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentAssignments
