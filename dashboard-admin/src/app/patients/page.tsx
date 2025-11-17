'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, UserCircle, Phone, Mail, Calendar } from 'lucide-react'
import { patientsApi } from '@/lib/api'
import { Patient } from '@/types'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchPatients()
  }, [search])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await patientsApi.getAll({ search, limit: 20 })
      setPatients(response.data || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Error fetching patients:', error)
      // TODO: Show error toast
    } finally {
      setLoading(false)
    }
  }

  const getAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1">Manage patient records and information</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Patient</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, MRN, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">New This Month</p>
            <p className="text-2xl font-bold text-green-600 mt-1">42</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active Today</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">18</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">With Appointments</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">127</p>
          </div>
        </div>

        {/* Patients List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">MRN</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Age/Gender</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Blood Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Insurance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.patient_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-900">{patient.mrn}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{patient.user?.full_name}</p>
                            <p className="text-sm text-gray-500">{patient.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">{getAge(patient.date_of_birth)} yrs</p>
                        <p className="text-sm text-gray-500 capitalize">{patient.gender}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{patient.user?.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{patient.blood_type || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">{patient.insurance_provider || '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View Details
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
