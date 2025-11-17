'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Video, MapPin, Plus, Filter } from 'lucide-react'
import { appointmentsApi } from '@/lib/api'
import { Appointment } from '@/types'
import { format } from 'date-fns'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [selectedStatus])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = selectedStatus !== 'all' ? { status: selectedStatus, limit: 50 } : { limit: 50 }
      const response = await appointmentsApi.getAll(params)
      setAppointments(response.data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await appointmentsApi.checkIn(id)
      fetchAppointments()
    } catch (error) {
      console.error('Error checking in:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      checked_in: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-orange-100 text-orange-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const statusCounts = {
    all: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    checked_in: appointments.filter(a => a.status === 'checked_in').length,
    in_progress: appointments.filter(a => a.status === 'in_progress').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Appointment</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card cursor-pointer hover:shadow-md" onClick={() => setSelectedStatus('all')}>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.all}</p>
          </div>
          <div className="card cursor-pointer hover:shadow-md" onClick={() => setSelectedStatus('scheduled')}>
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{statusCounts.scheduled}</p>
          </div>
          <div className="card cursor-pointer hover:shadow-md" onClick={() => setSelectedStatus('confirmed')}>
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{statusCounts.confirmed}</p>
          </div>
          <div className="card cursor-pointer hover:shadow-md" onClick={() => setSelectedStatus('checked_in')}>
            <p className="text-sm text-gray-600">Checked In</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{statusCounts.checked_in}</p>
          </div>
          <div className="card cursor-pointer hover:shadow-md" onClick={() => setSelectedStatus('in_progress')}>
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.in_progress}</p>
          </div>
        </div>

        {/* Appointments List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        appointment.appointment_type === 'telemedicine'
                          ? 'bg-purple-50'
                          : 'bg-blue-50'
                      }`}>
                        {appointment.appointment_type === 'telemedicine' ? (
                          <Video className={`w-6 h-6 ${
                            appointment.appointment_type === 'telemedicine'
                              ? 'text-purple-600'
                              : 'text-blue-600'
                          }`} />
                        ) : (
                          <MapPin className="w-6 h-6 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient?.user?.full_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(appointment.appointment_date), 'hh:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Dr. {appointment.doctor?.full_name}</span>
                          </div>
                          <div className="text-gray-600">
                            <span className="capitalize">{appointment.appointment_type}</span>
                          </div>
                        </div>

                        {appointment.reason_for_visit && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(appointment.appointment_id)}
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                        >
                          Check In
                        </button>
                      )}
                      <button className="px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
