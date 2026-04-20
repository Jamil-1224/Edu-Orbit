import React, { useEffect, useMemo, useState } from 'react'
import { Book, Search, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StudentLibrary = () => {
  const [activeTab, setActiveTab] = useState('issued')
  const [searchQuery, setSearchQuery] = useState('')
  const [availableBooks, setAvailableBooks] = useState([])
  const [issuedBooks, setIssuedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const response = await axios.get(`${API_URL}/student/library`)
        setAvailableBooks(response.data.availableBooks || [])
        setIssuedBooks(response.data.issuedBooks || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load library data')
      } finally {
        setLoading(false)
      }
    }
    loadLibrary()
  }, [])

  const filteredAvailableBooks = useMemo(() => availableBooks.filter((book) => book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase())), [availableBooks, searchQuery])
  const stats = {
    issued: issuedBooks.filter((book) => book.status === 'active').length,
    overdue: issuedBooks.filter((book) => book.status === 'overdue').length,
    totalRead: issuedBooks.length,
    totalAvailable: availableBooks.length
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Library</h1>
        <p className="text-gray-600 mt-1">Live book data from MongoDB</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-gray-600">Currently Issued</p><p className="text-3xl font-bold text-blue-600 mt-2">{stats.issued}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Overdue</p><p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Books Read</p><p className="text-3xl font-bold text-green-600 mt-2">{stats.totalRead}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Available</p><p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalAvailable}</p></div>
      </div>

      {stats.overdue > 0 && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"><AlertCircle className="text-red-600 flex-shrink-0" size={20} /><div><p className="font-semibold text-red-900">Overdue Books!</p><p className="text-sm text-red-800 mt-1">You have {stats.overdue} overdue book(s).</p></div></div>}

      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('issued')} className={`px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === 'issued' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}><Book size={18} className="inline mr-2" />Issued Books ({stats.issued})</button>
        <button onClick={() => setActiveTab('available')} className={`px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === 'available' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}>Available Books</button>
      </div>

      {activeTab === 'issued' && (
        <div className="space-y-4">
          {issuedBooks.length ? issuedBooks.map((book) => (
            <div key={book.id} className={`card p-4 border-l-4 ${book.status === 'overdue' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <div className="mt-3 flex items-center gap-4 flex-wrap text-sm text-gray-600"><span className="flex items-center gap-1"><Clock size={16} />Issued: {book.issuedDate ? new Date(book.issuedDate).toLocaleDateString() : 'N/A'}</span><span className="flex items-center gap-1"><Clock size={16} />Due: {book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</span></div>
                </div>
                <div className="text-right">
                  {book.status === 'overdue' ? <div className="bg-red-100 text-red-800 px-3 py-1 rounded font-semibold text-sm">Overdue</div> : <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-semibold text-sm">Active</div>}
                  <button className="btn btn-sm btn-secondary mt-3 w-full">Return Book</button>
                </div>
              </div>
            </div>
          )) : <div className="card text-center py-12"><Book className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-600">No books currently issued</p></div>}
        </div>
      )}

      {activeTab === 'available' && (
        <>
          <div className="card"><div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={20} /><input type="text" placeholder="Search by title or author..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-input pl-10" /></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAvailableBooks.length ? filteredAvailableBooks.map((book) => (
              <div key={book.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-3"><h3 className="font-bold text-gray-900 flex-1">{book.title}</h3>{book.copies > 0 ? <span className="badge bg-green-100 text-green-800 text-xs font-semibold">{book.copies} available</span> : <span className="badge bg-red-100 text-red-800 text-xs font-semibold">Out of stock</span>}</div>
                <p className="text-sm text-gray-600">{book.author}</p>
                <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn || 'N/A'}</p>
              </div>
            )) : <div className="col-span-full card text-center py-12"><Search className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-600">No books found</p></div>}
          </div>
        </>
      )}
    </div>
  )
}

export default StudentLibrary
