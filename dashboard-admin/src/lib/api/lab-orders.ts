import { apiClient } from '../api-client'

export interface LabOrderParams {
  status?: string
  doctor_id?: string
  patient_id?: string
  limit?: number
  offset?: number
}

export const labOrdersApi = {
  getAll: async (params?: LabOrderParams) => {
    const response = await apiClient.get('/lab-orders', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/lab-orders/${id}`)
    return response.data
  },

  getPatientOrders: async (patientId: string, params?: LabOrderParams) => {
    const response = await apiClient.get(`/lab-orders/patient/${patientId}`, { params })
    return response.data
  },

  getDoctorOrders: async (doctorId: string, params?: LabOrderParams) => {
    const response = await apiClient.get(`/lab-orders/doctor/${doctorId}`, { params })
    return response.data
  },

  create: async (orderData: any) => {
    const response = await apiClient.post('/lab-orders', orderData)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/lab-orders/${id}/status`, { status })
    return response.data
  },

  addResult: async (id: string, testItemId: string, resultData: any) => {
    const response = await apiClient.post(`/lab-orders/${id}/results`, {
      test_item_id: testItemId,
      ...resultData,
    })
    return response.data
  },

  getCriticalResults: async (params?: { timeWindowHours?: number }) => {
    const response = await apiClient.get('/lab-orders/critical-results', { params })
    return response.data
  },

  getMostOrderedTests: async (params?: { limit?: number; days?: number }) => {
    const response = await apiClient.get('/lab-orders/statistics/most-ordered', { params })
    return response.data
  },

  getStats: async () => {
    const response = await apiClient.get('/lab-orders/statistics')
    return response.data
  },
}
