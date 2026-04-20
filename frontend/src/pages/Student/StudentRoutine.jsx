import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const StudentRoutine = () => {
  const [selectedDay, setSelectedDay] = useState('monday')
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/schedule`)
        setSchedule(response.data.schedule || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load routine')
      } finally {
        setLoading(false)
      }
    }

    loadRoutine()
  }, [])

  const routineByDay = useMemo(() => schedule.reduce((accumulator, session) => {
    const key = (session.day || '').toLowerCase()
    if (!accumulator[key]) accumulator[key] = []
    accumulator[key].push(session)
    return accumulator
  }, {}), [schedule])

  const currentRoutine = routineByDay[selectedDay] || []

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Class Routine</h1>
        <p className="text-gray-600 mt-1">Weekly schedule loaded from MongoDB</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)} className={`btn px-6 ${selectedDay === day ? 'btn-primary' : 'btn-secondary'}`}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4"><Calendar size={20} /><h3 className="text-lg font-semibold">{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Schedule</h3></div>
          <div className="space-y-3">
            {currentRoutine.length ? currentRoutine.map((session, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900">{session.subject}</p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2"><User size={14} />{session.teacher}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p className="flex items-center gap-2 justify-end"><Clock size={14} />{session.startTime} - {session.endTime}</p>
                    <p className="flex items-center gap-2 justify-end mt-1"><MapPin size={14} />{session.room}</p>
                  </div>
                </div>
              </div>
            )) : <div className="text-sm text-gray-500">No routine available for this day.</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Routine Summary</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between"><span>Total Sessions</span><span className="font-semibold">{schedule.length}</span></div>
            <div className="flex justify-between"><span>Today Sessions</span><span className="font-semibold">{currentRoutine.length}</span></div>
            <div className="flex justify-between"><span>Status</span><span className="font-semibold text-green-600">Live</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentRoutine
