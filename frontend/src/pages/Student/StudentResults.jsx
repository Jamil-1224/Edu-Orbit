import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, TrendingUp, Award, Download } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const gradePoints = { 'A+': 4.0, A: 3.7, 'B+': 3.3, B: 3.0, 'C+': 2.7, C: 2.3, D: 1.7, E: 1.0, F: 0.0 }

const normalizeExamType = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[_\s]+/g, '-')
  .replace(/-+/g, '-')

const StudentResults = () => {
  const [examFilter, setExamFilter] = useState('all')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/marks`)
        setResults(response.data.marks || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  const filteredResults = useMemo(() => (
    examFilter === 'all'
      ? results
      : results.filter((record) => normalizeExamType(record.exam) === normalizeExamType(examFilter))
  ), [results, examFilter])

  const gpa = useMemo(() => {
    if (!results.length) return '0.00'
    const totalPoints = results.reduce((sum, result) => sum + (gradePoints[result.grade] || 0), 0)
    return (totalPoints / results.length).toFixed(2)
  }, [results])

  const averagePercentage = useMemo(() => {
    if (!results.length) return 0
    return Math.round(results.reduce((sum, result) => sum + (result.percentage || 0), 0) / results.length)
  }, [results])

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-50'
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-50'
      case 'C+':
      case 'C': return 'text-yellow-600 bg-yellow-50'
      case 'D': return 'text-orange-600 bg-orange-50'
      case 'F': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
          <p className="text-gray-600 mt-1">Exam marks loaded from MongoDB</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2"><Download size={20} />Download Transcript</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-gray-600">Current GPA</p><p className="text-4xl font-bold text-blue-600 mt-2">{gpa}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Average Marks</p><p className="text-4xl font-bold text-green-600 mt-2">{averagePercentage}%</p></div>
        <div className="card"><p className="text-sm text-gray-600">Total Exams</p><p className="text-4xl font-bold text-purple-600 mt-2">{results.length}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Highest Grade</p><p className="text-4xl font-bold text-orange-600 mt-2">{results[0]?.grade || 'N/A'}</p></div>
      </div>

      <div className="card">
        <label className="form-label">Filter by Exam Type</label>
        <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className="form-input max-w-xs">
          <option value="all">All Exams</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="unit-test">Unit Test</option>
          <option value="assignment">Assignment</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 size={20} />Exam Results</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Exam Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Marks</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Percentage</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length ? filteredResults.map((result) => (
              <tr key={result.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-900">{result.subject}</td>
                <td className="py-3 px-4"><span className="badge badge-blue">{result.exam}</span></td>
                <td className="py-3 px-4 text-gray-900">{result.marks}/{result.maxMarks}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${result.percentage}%` }} /></div>
                    <span className="text-gray-900 font-semibold min-w-12">{result.percentage}%</span>
                  </div>
                </td>
                <td className="py-3 px-4"><span className={`badge ${getGradeColor(result.grade)} font-bold px-3 py-1`}>{result.grade}</span></td>
                <td className="py-3 px-4 text-gray-600">{result.date ? new Date(result.date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            )) : <tr><td colSpan="6" className="py-8 text-center text-gray-500">No results found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20} />Subject-wise Performance</h3>
        <div className="space-y-4">
          {results.length ? results.map((result) => (
            <div key={result.id}>
              <div className="flex justify-between items-center mb-2"><span className="font-semibold text-gray-900">{result.subject}</span><span className="text-sm font-bold text-gray-700">{result.percentage}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-3"><div className="h-3 rounded-full bg-blue-500" style={{ width: `${result.percentage}%` }} /></div>
            </div>
          )) : <div className="text-sm text-gray-500">No performance data yet.</div>}
        </div>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Award size={20} className="text-blue-600" />Performance Insights</h3>
        <p className="text-gray-700">Your results are now sourced from the live database.</p>
      </div>
    </div>
  )
}

export default StudentResults
