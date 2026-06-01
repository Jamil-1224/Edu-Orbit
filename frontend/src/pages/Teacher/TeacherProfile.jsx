import React, { useEffect, useState } from 'react'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({})

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher/profile`)
        const teacher = res.data.teacher
        setProfile(teacher)
        setForm({
          qualifications: (teacher.qualifications || []).join(', '),
          specialization: teacher.specialization || '',
          designation: teacher.designation || '',
          department: teacher.department || '',
          dateOfJoining: teacher.dateOfJoining ? String(teacher.dateOfJoining).slice(0, 10) : '',
          salary: teacher.salary || '',
          experience: teacher.experience || '',
          certifications: (teacher.certifications || []).join(', ')
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        qualifications: form.qualifications,
        specialization: form.specialization,
        designation: form.designation,
        department: form.department,
        dateOfJoining: form.dateOfJoining,
        salary: form.salary,
        experience: form.experience,
        certifications: form.certifications
      }

      await axios.put(`${API_URL}/teacher/profile`, payload)
      const res = await axios.get(`${API_URL}/teacher/profile`)
      setProfile(res.data.teacher)
      setForm({
        qualifications: (res.data.teacher.qualifications || []).join(', '),
        specialization: res.data.teacher.specialization || '',
        designation: res.data.teacher.designation || '',
        department: res.data.teacher.department || '',
        dateOfJoining: res.data.teacher.dateOfJoining ? String(res.data.teacher.dateOfJoining).slice(0, 10) : '',
        salary: res.data.teacher.salary || '',
        experience: res.data.teacher.experience || '',
        certifications: (res.data.teacher.certifications || []).join(', ')
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  )

  if (error && !profile) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Teacher profile and settings stored in MongoDB</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-white" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{profile.userId?.name || 'Teacher'}</h3>
          <p className="text-gray-600 text-sm mt-1">{profile.designation || 'Teacher'}</p>
          <div className="mt-4 space-y-2 text-left">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xs text-gray-600">Employee ID</p>
              <p className="font-semibold text-gray-900">{profile.employeeId}</p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <p className="text-xs text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{profile.department || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form className="card" onSubmit={handleSave}>
            <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email</label>
                <p className="text-gray-900 font-semibold flex items-center gap-2"><Mail size={16} className="text-blue-600" />{profile.userId?.email}</p>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <p className="text-gray-900 font-semibold flex items-center gap-2"><Phone size={16} className="text-green-600" />{profile.userId?.phone || 'N/A'}</p>
              </div>

              <div>
                <label className="form-label">Qualifications (comma separated)</label>
                <input className="form-input" value={form.qualifications || ''} onChange={handleChange('qualifications')} />
              </div>

              <div>
                <label className="form-label">Certifications (comma separated)</label>
                <input className="form-input" value={form.certifications || ''} onChange={handleChange('certifications')} />
              </div>

              <div>
                <label className="form-label">Specialization</label>
                <input className="form-input" value={form.specialization || ''} onChange={handleChange('specialization')} />
              </div>

              <div>
                <label className="form-label">Designation</label>
                <input className="form-input" value={form.designation || ''} onChange={handleChange('designation')} />
              </div>

              <div>
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department || ''} onChange={handleChange('department')} />
              </div>

              <div>
                <label className="form-label">Date of Joining</label>
                <input className="form-input" type="date" value={form.dateOfJoining || ''} onChange={handleChange('dateOfJoining')} />
              </div>

              <div>
                <label className="form-label">Experience (years)</label>
                <input className="form-input" type="number" value={form.experience || ''} onChange={handleChange('experience')} />
              </div>

              <div>
                <label className="form-label">Salary</label>
                <input className="form-input" type="number" value={form.salary || ''} onChange={handleChange('salary')} />
              </div>
            </div>

            {error && <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">{error}</div>}

            <div className="mt-6 flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TeacherProfile
