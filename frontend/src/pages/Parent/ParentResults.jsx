import React, { useState } from 'react'
import { BarChart3, TrendingUp, Award, Download } from 'lucide-react'

const ParentResults = () => {
  const [selectedChild, setSelectedChild] = useState(1)

  const children = [
    { id: 1, name: 'Aarav Kumar', class: '10-A' },
    { id: 2, name: 'Anaya Kumar', class: '8-B' }
  ]

  const results = {
    1: [
      {
        subject: 'Mathematics',
        marks: 95,
        maxMarks: 100,
        percentage: 95,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-15'
      },
      {
        subject: 'English',
        marks: 88,
        maxMarks: 100,
        percentage: 88,
        grade: 'A',
        exam: 'Final',
        date: '2024-12-15'
      },
      {
        subject: 'Science',
        marks: 92,
        maxMarks: 100,
        percentage: 92,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-16'
      },
      {
        subject: 'Social Studies',
        marks: 82,
        maxMarks: 100,
        percentage: 82,
        grade: 'B+',
        exam: 'Final',
        date: '2024-12-16'
      },
      {
        subject: 'Hindi',
        marks: 85,
        maxMarks: 100,
        percentage: 85,
        grade: 'A',
        exam: 'Midterm',
        date: '2024-11-20'
      },
      {
        subject: 'Computer Science',
        marks: 96,
        maxMarks: 100,
        percentage: 96,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-18'
      }
    ],
    2: [
      {
        subject: 'English',
        marks: 94,
        maxMarks: 100,
        percentage: 94,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-15'
      },
      {
        subject: 'Mathematics',
        marks: 98,
        maxMarks: 100,
        percentage: 98,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-15'
      },
      {
        subject: 'Science',
        marks: 95,
        maxMarks: 100,
        percentage: 95,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-16'
      },
      {
        subject: 'Social Studies',
        marks: 92,
        maxMarks: 100,
        percentage: 92,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-16'
      },
      {
        subject: 'Hindi',
        marks: 91,
        maxMarks: 100,
        percentage: 91,
        grade: 'A',
        exam: 'Midterm',
        date: '2024-11-20'
      },
      {
        subject: 'Computer Science',
        marks: 99,
        maxMarks: 100,
        percentage: 99,
        grade: 'A+',
        exam: 'Final',
        date: '2024-12-18'
      }
    ]
  }

  const currentResults = results[selectedChild] || []
  const currentChild = children.find(c => c.id === selectedChild)

  const calculateGPA = (data) => {
    const gradePoints = {
      'A+': 4.0,
      'A': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'C+': 2.7,
      'C': 2.3,
      'D': 1.7,
      'F': 0.0
    }

    const totalPoints = data.reduce((sum, r) => sum + (gradePoints[r.grade] || 0), 0)
    return (totalPoints / data.length).toFixed(2)
  }

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

  const averagePercentage = Math.round(currentResults.reduce((sum, r) => sum + r.percentage, 0) / currentResults.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Child's Results</h1>
          <p className="text-gray-600 mt-1">View your child's exam marks and performance</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download size={20} />
          Download Report
        </button>
      </div>

      {/* Child Selector */}
      <div className="card">
        <label className="form-label">Select Child</label>
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(Number(e.target.value))}
          className="form-input max-w-xs"
        >
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.name} ({child.class})
            </option>
          ))}
        </select>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Current GPA</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{calculateGPA(currentResults)}</p>
          <p className="text-xs text-gray-600 mt-2">Out of 4.0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Average Marks</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{averagePercentage}%</p>
          <p className="text-xs text-gray-600 mt-2">All exams</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Exams</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">{currentResults.length}</p>
          <p className="text-xs text-gray-600 mt-2">Completed</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Rank</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">#3</p>
          <p className="text-xs text-gray-600 mt-2">In class</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Exam Results
        </h3>
        <div className="overflow-x-auto">
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
              {currentResults.map((result, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{result.subject}</td>
                  <td className="py-3 px-4">
                    <span className="badge badge-blue">{result.exam}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {result.marks}/{result.maxMarks}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className={`h-2 rounded-full ${
                            result.percentage >= 90 ? 'bg-green-500' :
                            result.percentage >= 75 ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold min-w-12">{result.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getGradeColor(result.grade)} font-bold px-3 py-1`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(result.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Subject-wise Performance
        </h3>
        <div className="space-y-4">
          {currentResults.map((result, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">{result.subject}</span>
                <span className="text-sm font-bold text-gray-700">{result.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.percentage >= 90 ? 'bg-green-500' :
                    result.percentage >= 75 ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Feedback */}
      <div className="card bg-green-50 border border-green-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award size={20} className="text-green-600" />
          Performance Summary
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{currentChild?.name} is performing excellently in all subjects.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>GPA is above 3.5 - maintain this excellent performance!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">→</span>
            <span>Continue with regular studies and practice to maintain grades.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ParentResults
