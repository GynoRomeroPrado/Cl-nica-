import apiClient from '../api-client'
import { Patient, ApiResponse } from '@/types'

export const patientsApi = {
  getAll: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const response = await apiClient.get<ApiResponse<Patient[]>>('/patients', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Patient>(`/patients/${id}`)
    return response.data
  },

  create: async (data: Partial<Patient>) => {
    const response = await apiClient.post<Patient>('/patients', data)
    return response.data
  },

  update: async (id: string, data: Partial<Patient>) => {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data)
    return response.data
  },

  searchByMRN: async (mrn: string) => {
    const response = await apiClient.get<Patient>(`/patients/mrn/${mrn}`)
    return response.data
  },

  getStatistics: async () => {
    const response = await apiClient.get('/patients/stats/overview')
    return response.data
  },
}
