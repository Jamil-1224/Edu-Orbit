import React, { useEffect, useMemo, useState } from 'react'
import { CreditCard, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const currency = (amount) => `৳${Number(amount || 0).toLocaleString()}`

const StudentFees = () => {
	const [feeRecords, setFeeRecords] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const loadFees = async () => {
			try {
				const response = await axios.get(`${API_URL}/student/fees`)
				setFeeRecords(response.data.fees || [])
			} catch (err) {
				setError(err.response?.data?.message || 'Failed to load fee records')
			} finally {
				setLoading(false)
			}
		}
		loadFees()
	}, [])

	const getStatusIcon = (status) => ({ paid: <CheckCircle className="text-green-600" size={20} />, partial: <Clock className="text-yellow-600" size={20} />, pending: <AlertCircle className="text-red-600" size={20} /> }[status] || null)
	const getStatusColor = (status) => ({ paid: 'bg-green-50 border-l-4 border-green-500', partial: 'bg-yellow-50 border-l-4 border-yellow-500', pending: 'bg-red-50 border-l-4 border-red-500' }[status] || 'bg-gray-50')
	const getStatusBadge = (status) => ({ paid: 'badge-green', partial: 'badge-yellow', pending: 'badge-red' }[status] || 'badge-blue')

	const stats = useMemo(() => ({
		totalDue: feeRecords.filter((fee) => fee.status === 'pending').reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
		totalPaid: feeRecords.filter((fee) => fee.status === 'paid').reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
		pending: feeRecords.filter((fee) => fee.status === 'pending').length,
		partial: feeRecords.filter((fee) => fee.status === 'partial').length
	}), [feeRecords])

	const monthlyAmount = feeRecords.find((fee) => fee.amount)?.amount || 0
	const totalMonths = feeRecords.length
	const expectedTotal = feeRecords.reduce((sum, fee) => sum + Number(fee.amount || 0), 0)
	const percentagePaid = expectedTotal ? Math.round((stats.totalPaid / expectedTotal) * 100) : 0

	if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
	if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Fee Details</h1>
					<p className="text-gray-600 mt-1">Fees shown in Tk and loaded from MongoDB</p>
				</div>
				{stats.totalDue === 0 && <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">All Fees Paid</div>}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card"><p className="text-sm text-gray-600">Total Amount Due</p><p className="text-3xl font-bold text-red-600 mt-2">{currency(stats.totalDue)}</p></div>
				<div className="card"><p className="text-sm text-gray-600">Total Paid</p><p className="text-3xl font-bold text-green-600 mt-2">{currency(stats.totalPaid)}</p></div>
				<div className="card"><p className="text-sm text-gray-600">Percentage Paid</p><p className="text-3xl font-bold text-blue-600 mt-2">{percentagePaid}%</p><div className="w-full bg-gray-200 rounded-full h-2 mt-3"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${percentagePaid}%` }} /></div></div>
				<div className="card"><p className="text-sm text-gray-600">Pending Months</p><p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending + stats.partial}</p></div>
			</div>

			{stats.totalDue > 0 && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"><AlertCircle className="text-red-600 flex-shrink-0" size={20} /><div><p className="font-semibold text-red-900">Outstanding Fees</p><p className="text-sm text-red-800 mt-1">You have {currency(stats.totalDue)} in pending fees.</p></div></div>}

			<div className="card"><h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3><div className="space-y-3"><div className="flex justify-between items-center p-3 bg-gray-50 rounded"><span className="text-gray-700">Monthly Fee</span><span className="font-bold text-gray-900">{currency(monthlyAmount)}</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded"><span className="text-gray-700">Number of Months</span><span className="font-bold text-gray-900">{totalMonths}</span></div><div className="flex justify-between items-center p-3 bg-blue-50 rounded border-t-2 border-blue-500"><span className="text-gray-900 font-semibold">Total Expected</span><span className="font-bold text-blue-600">{currency(expectedTotal)}</span></div></div></div>

			<div className="card"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard size={20} />Payment History</h3><div className="space-y-3">{feeRecords.length ? feeRecords.map((record) => (<div key={record.id} className={`p-4 rounded-lg ${getStatusColor(record.status)}`}><div className="flex items-center justify-between gap-4 flex-wrap"><div className="flex items-center gap-3 flex-1">{getStatusIcon(record.status)}<div><p className="font-semibold text-gray-900">{record.month}</p><p className="text-sm text-gray-600">{record.paymentMode ? `Paid via ${record.paymentMode}${record.paidDate ? ` on ${new Date(record.paidDate).toLocaleDateString()}` : ''}` : `Due on ${record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}`}</p></div></div><div className="text-right"><p className="font-bold text-lg text-gray-900">{currency(record.status === 'partial' ? record.paidAmount : record.amount)}</p><span className={`badge ${getStatusBadge(record.status)} capitalize text-xs font-semibold`}>{record.status}</span></div></div>{record.status === 'partial' && <div className="mt-3 p-3 bg-yellow-100 rounded text-yellow-900 text-sm"><strong>Partial Payment:</strong> Paid {currency(record.paidAmount)}, Remaining {currency(record.amount - record.paidAmount)}</div>}</div>)) : <div className="text-sm text-gray-500">No fee records found.</div>}</div></div>

			{feeRecords.some((fee) => fee.status === 'paid') && <div className="card bg-blue-50 border border-blue-200"><h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><Download size={20} />Download Receipts</h3><p className="text-sm text-blue-800 mb-4">Download fee payment receipts for your records</p><button className="btn btn-primary flex items-center gap-2"><Download size={18} />Download All Receipts</button></div>}
		</div>
	)
}

export default StudentFees
