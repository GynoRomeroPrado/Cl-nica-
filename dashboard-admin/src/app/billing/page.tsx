'use client'

import { useState, useEffect } from 'react'
import { DollarSign, FileText, CreditCard, Plus, TrendingUp, AlertCircle } from 'lucide-react'
import { billingApi } from '@/lib/api'
import { Invoice } from '@/types'
import { format } from 'date-fns'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    collected_this_month: 0,
  })

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [selectedStatus])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = selectedStatus !== 'all' ? { status: selectedStatus, limit: 50 } : { limit: 50 }
      const response = await billingApi.getInvoices(params)
      setInvoices(response.data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const endDate = new Date().toISOString()
      const summary = await billingApi.getFinancialSummary(startDate, endDate)
      setStats({
        total_revenue: summary.invoices.total_billed || 0,
        pending_amount: summary.invoices.total_outstanding || 0,
        collected_this_month: summary.invoices.total_collected || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      partial: 'bg-orange-100 text-orange-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const statusCounts = {
    all: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    partial: invoices.filter(i => i.status === 'partial').length,
    paid: invoices.filter(i => i.status === 'paid').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
            <p className="text-gray-600 mt-1">Manage invoices, payments, and financial reports</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.total_revenue)}
                </p>
                <p className="text-sm text-green-600 mt-2">+12.5% from last month</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collected This Month</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.collected_this_month)}
                </p>
                <p className="text-sm text-gray-500 mt-2">{statusCounts.paid} invoices</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(stats.pending_amount)}
                </p>
                <p className="text-sm text-gray-500 mt-2">{statusCounts.pending} invoices</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Payments</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.partial}</p>
                <p className="text-sm text-gray-500 mt-2">Awaiting balance</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['all', 'pending', 'partial', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoices List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Paid</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Balance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-900">{invoice.invoice_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">Patient Name</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">
                          {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-green-600">
                          {formatCurrency(invoice.amount_paid)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-orange-600">
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View
                          </button>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
