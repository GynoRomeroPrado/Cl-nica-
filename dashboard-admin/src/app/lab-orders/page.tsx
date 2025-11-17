'use client'

import { useState, useEffect } from 'react'
import {
  FlaskConical, AlertTriangle, Plus, CheckCircle, Clock,
  TrendingUp, Activity, Eye, FileText
} from 'lucide-react'
import { labOrdersApi } from '@/lib/api'
import { LabOrder } from '@/types'
import { format } from 'date-fns'

export default function LabOrdersPage() {
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    critical_results: 0,
    completed_today: 0,
  })

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [selectedStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = selectedStatus !== 'all' ? { status: selectedStatus, limit: 50 } : { limit: 50 }
      const response = await labOrdersApi.getAll(params)
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error fetching lab orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsResponse = await labOrdersApi.getStats()
      setStats({
        total_orders: statsResponse.total_orders || 0,
        pending_orders: statsResponse.pending_orders || 0,
        critical_results: statsResponse.critical_results || 0,
        completed_today: statsResponse.completed_today || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleViewOrder = (order: LabOrder) => {
    setSelectedOrder(order)
    setView('detail')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ordered: 'bg-blue-100 text-blue-700',
      collected: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      stat: 'bg-red-100 text-red-700',
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
  }

  const getResultFlagColor = (flag?: string) => {
    if (!flag) return 'text-gray-600'
    const colors: Record<string, string> = {
      normal: 'text-green-600',
      high: 'text-orange-600',
      low: 'text-orange-600',
      critical: 'text-red-600',
    }
    return colors[flag] || 'text-gray-600'
  }

  const statusCounts = {
    all: orders.length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    collected: orders.filter(o => o.status === 'collected').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  if (view === 'detail' && selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setView('list')}
              className="text-primary-600 hover:text-primary-700 mb-4 flex items-center space-x-2"
            >
              <span>← Back to Orders</span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lab Order Details</h1>
                <p className="text-gray-600 mt-1">
                  Order Date: {format(new Date(selectedOrder.order_date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                  {selectedOrder.priority.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono text-sm text-gray-900 mt-1">{selectedOrder.order_id.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-mono text-sm text-gray-900 mt-1">{selectedOrder.patient_id.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ordered By</p>
                <p className="text-sm text-gray-900 mt-1">Dr. {selectedOrder.ordered_by}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="text-sm text-gray-900 mt-1">
                  {format(new Date(selectedOrder.order_date), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {selectedOrder.tests && selectedOrder.tests.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Test Results ({selectedOrder.tests.length})
              </h2>
              <div className="space-y-3">
                {selectedOrder.tests.map((test: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{test.test_name}</h3>
                          {test.loinc_code && (
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {test.loinc_code}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>

                        {test.result_value && (
                          <div className="mt-3">
                            <div className="flex items-baseline space-x-3">
                              <div>
                                <p className="text-sm text-gray-600">Result</p>
                                <p className={`text-lg font-bold mt-1 ${getResultFlagColor(test.result_flag)}`}>
                                  {test.result_value}
                                  {test.result_unit && ` ${test.result_unit}`}
                                </p>
                              </div>

                              {test.reference_range && (
                                <div>
                                  <p className="text-sm text-gray-600">Reference Range</p>
                                  <p className="text-sm text-gray-900 mt-1">{test.reference_range}</p>
                                </div>
                              )}

                              {test.result_flag && test.result_flag !== 'normal' && (
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className={`w-5 h-5 ${
                                    test.result_flag === 'critical' ? 'text-red-600' : 'text-orange-600'
                                  }`} />
                                  <span className={`text-sm font-medium ${getResultFlagColor(test.result_flag)}`}>
                                    {test.result_flag.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {test.notes && (
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {test.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
            <p className="text-gray-600 mt-1">Laboratory test orders and results</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Lab Order</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_orders}</p>
                <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending_orders}</p>
                <p className="text-sm text-gray-500 mt-2">In progress</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Results</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical_results}</p>
                <p className="text-sm text-gray-500 mt-2">Requires attention</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed_today}</p>
                <p className="text-sm text-gray-500 mt-2">+12% from yesterday</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['all', 'ordered', 'collected', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              {status !== 'all' && ` (${statusCounts[status as keyof typeof statusCounts]})`}
            </button>
          ))}
        </div>

        {/* Lab Orders List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading lab orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No lab orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ordered By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tests</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-900">
                          {order.order_id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">Patient Name</p>
                        <p className="text-xs text-gray-500 font-mono">{order.patient_id.slice(0, 8)}...</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">Dr. {order.ordered_by}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {format(new Date(order.order_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(order.order_date), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {order.tests?.length || 0} test(s)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
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
