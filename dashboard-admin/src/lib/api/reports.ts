import { apiClient } from '../api-client'

export interface RevenueParams {
  startDate: string
  endDate: string
  groupBy?: 'day' | 'week' | 'month'
}

export interface DateRangeParams {
  startDate: string
  endDate: string
}

export const reportsApi = {
  getRevenueTrends: async (params: RevenueParams) => {
    const response = await apiClient.get('/reports/revenue-trends', { params })
    return response.data
  },

  getAppointmentsByStatus: async (params: DateRangeParams) => {
    const response = await apiClient.get('/reports/appointments-by-status', { params })
    return response.data
  },

  getPatientDemographics: async () => {
    const response = await apiClient.get('/reports/patient-demographics')
    return response.data
  },

  getTopDiagnoses: async (params: DateRangeParams & { limit?: number }) => {
    const response = await apiClient.get('/reports/top-diagnoses', { params })
    return response.data
  },

  getLabTestTrends: async (params: RevenueParams) => {
    const response = await apiClient.get('/reports/lab-test-trends', { params })
    return response.data
  },

  getDepartmentPerformance: async (params: DateRangeParams) => {
    const response = await apiClient.get('/reports/department-performance', { params })
    return response.data
  },

  getPatientGrowth: async (params: RevenueParams) => {
    const response = await apiClient.get('/reports/patient-growth', { params })
    return response.data
  },

  exportReport: async (reportType: string, params: any, format: 'pdf' | 'csv' | 'excel') => {
    const response = await apiClient.get(`/reports/export/${reportType}`, {
      params: { ...params, format },
      responseType: 'blob',
    })
    return response.data
  },
}
