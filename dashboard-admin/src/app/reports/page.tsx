'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, Calendar, DollarSign, Download,
  FileText, Activity, Clock
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { format, subDays, subMonths } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 3).toISOString(),
    endDate: new Date().toISOString(),
  })
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week')

  // Data states
  const [revenueTrends, setRevenueTrends] = useState<any[]>([])
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<any[]>([])
  const [patientDemographics, setPatientDemographics] = useState<any>({})
  const [topDiagnoses, setTopDiagnoses] = useState<any[]>([])
  const [labTestTrends, setLabTestTrends] = useState<any[]>([])
  const [patientGrowth, setPatientGrowth] = useState<any[]>([])

  useEffect(() => {
    fetchAllReports()
  }, [dateRange, groupBy])

  const fetchAllReports = async () => {
    try {
      setLoading(true)

      const [
        revenue,
        appointments,
        demographics,
        diagnoses,
        labTests,
        growth,
      ] = await Promise.all([
        reportsApi.getRevenueTrends({ ...dateRange, groupBy }),
        reportsApi.getAppointmentsByStatus(dateRange),
        reportsApi.getPatientDemographics(),
        reportsApi.getTopDiagnoses({ ...dateRange, limit: 10 }),
        reportsApi.getLabTestTrends({ ...dateRange, groupBy }),
        reportsApi.getPatientGrowth({ ...dateRange, groupBy }),
      ])

      setRevenueTrends(revenue || [])
      setAppointmentsByStatus(appointments || [])
      setPatientDemographics(demographics || {})
      setTopDiagnoses(diagnoses || [])
      setLabTestTrends(labTests || [])
      setPatientGrowth(growth || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType: string, format: 'pdf' | 'csv') => {
    try {
      const data = await reportsApi.exportReport(reportType, dateRange, format)

      // Create download
      const blob = new Blob([data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-${format}-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>{' '}
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Clinical insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('comprehensive', 'pdf')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('comprehensive', 'csv')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDateRange({
                  startDate: subDays(new Date(), 30).toISOString(),
                  endDate: new Date().toISOString(),
                })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: subMonths(new Date(), 3).toISOString(),
                  endDate: new Date().toISOString(),
                })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 3 Months
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: subMonths(new Date(), 12).toISOString(),
                  endDate: new Date().toISOString(),
                })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 12 Months
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue Trends</h2>
                <p className="text-sm text-gray-600">Total revenue over time</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Growth */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Growth</h2>
                <p className="text-sm text-gray-600">New patient registrations</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="new_patients"
                  name="New Patients"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Appointments by Status */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Appointments by Status</h2>
                <p className="text-sm text-gray-600">Current period breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appointmentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="status"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Diagnoses */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Diagnoses</h2>
                <p className="text-sm text-gray-600">Most common diagnoses</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDiagnoses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis
                  type="category"
                  dataKey="diagnosis"
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Patient Demographics */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Demographics</h2>
                <p className="text-sm text-gray-600">Age distribution</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={patientDemographics.age_groups || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="age_group"
                  >
                    {(patientDemographics.age_groups || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={patientDemographics.gender || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="gender"
                  >
                    {(patientDemographics.gender || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lab Test Trends */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lab Test Volume</h2>
              <p className="text-sm text-gray-600">Laboratory tests ordered over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={labTestTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_tests"
                name="Total Tests"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="completed_tests"
                name="Completed Tests"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Wait Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">18 min</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patient Satisfaction</p>
                <p className="text-2xl font-bold text-green-600 mt-1">4.8/5</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointment Fill Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">87%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue per Patient</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">$342</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
