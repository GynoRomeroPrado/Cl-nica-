import apiClient from '../api-client'
import { Invoice, ApiResponse } from '@/types'

export const billingApi = {
  getInvoices: async (params?: {
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/billing/invoices', { params })
    return response.data
  },

  getInvoiceById: async (id: string) => {
    const response = await apiClient.get<Invoice>(`/billing/invoices/${id}`)
    return response.data
  },

  createInvoice: async (data: any) => {
    const response = await apiClient.post<Invoice>('/billing/invoices', data)
    return response.data
  },

  recordPayment: async (invoiceId: string, paymentData: any) => {
    const response = await apiClient.post(`/billing/invoices/${invoiceId}/payments`, paymentData)
    return response.data
  },

  getFinancialSummary: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/billing/reports/financial-summary', {
      params: { startDate, endDate }
    })
    return response.data
  },
}
