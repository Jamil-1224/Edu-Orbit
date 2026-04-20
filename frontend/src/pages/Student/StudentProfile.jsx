import React, { useEffect, useState } from 'react'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StudentProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/profile`)
        setProfile(response.data.profile)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
  }

  if (!profile) {
    return <div className="card">No profile found.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Profile data loaded from MongoDB</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-white" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
          <p className="text-gray-600 text-sm mt-1">Class {profile.className || profile.class}</p>
          <div className="mt-4 space-y-2 text-left">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xs text-gray-600">Roll Number</p>
              <p className="font-semibold text-gray-900">{profile.rollNumber}</p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <p className="text-xs text-gray-600">Blood Group</p>
              <p className="font-semibold text-gray-900">{profile.bloodGroup || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <p className="text-gray-900 font-semibold">{profile.name}</p>
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <p className="text-gray-900 font-semibold">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">Gender</label>
                <p className="text-gray-900 font-semibold">{profile.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">Blood Group</label>
                <p className="text-gray-900 font-semibold">{profile.bloodGroup || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Mail size={20} />Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email Address</label>
                <p className="text-gray-900 font-semibold flex items-center gap-2"><Mail size={16} className="text-blue-600" />{profile.email}</p>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <p className="text-gray-900 font-semibold flex items-center gap-2"><Phone size={16} className="text-green-600" />{profile.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin size={20} />Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="form-label">Street Address</label>
                <p className="text-gray-900 font-semibold">{profile.address?.street || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">City</label>
                <p className="text-gray-900 font-semibold">{profile.address?.city || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">State</label>
                <p className="text-gray-900 font-semibold">{profile.address?.state || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">Zip Code</label>
                <p className="text-gray-900 font-semibold">{profile.address?.zipCode || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Guardian Name</label>
                <p className="text-gray-900 font-semibold">{profile.guardianName || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label">Guardian Phone</label>
                <p className="text-gray-900 font-semibold">{profile.guardianPhone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile
