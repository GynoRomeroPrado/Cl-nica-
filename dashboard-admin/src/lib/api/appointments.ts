import apiClient from '../api-client'
import { Appointment, ApiResponse } from '@/types'

export const appointmentsApi = {
  getAll: async (params?: {
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>('/appointments', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`)
    return response.data
  },

  create: async (data: Partial<Appointment>) => {
    const response = await apiClient.post<Appointment>('/appointments', data)
    return response.data
  },

  update: async (id: string, data: Partial<Appointment>) => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/appointments/${id}/status`, { status })
    return response.data
  },

  checkIn: async (id: string) => {
    const response = await apiClient.post(`/appointments/${id}/check-in`)
    return response.data
  },

  getTodaysAppointments: async () => {
    const response = await apiClient.get('/appointments/today')
    return response.data
  },
}
