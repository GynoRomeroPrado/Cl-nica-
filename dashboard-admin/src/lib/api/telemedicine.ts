import { apiClient } from '../api-client'

export interface TelemedicineSession {
  session_id: string
  clinic_id: string
  appointment_id: string
  provider_id: string
  patient_id: string
  room_code: string
  status: 'waiting' | 'active' | 'ended'
  start_time?: string
  end_time?: string
  duration_minutes?: number
  meeting_url?: string
  recording_url?: string
  notes?: string
  created_at: string
}

export interface SessionParams {
  status?: string
  provider_id?: string
  patient_id?: string
  limit?: number
  offset?: number
}

export const telemedicineApi = {
  getAllSessions: async (params?: SessionParams) => {
    const response = await apiClient.get('/telemedicine/sessions', { params })
    return response.data
  },

  getSessionById: async (id: string) => {
    const response = await apiClient.get(`/telemedicine/sessions/${id}`)
    return response.data
  },

  getProviderSessions: async (providerId: string, params?: SessionParams) => {
    const response = await apiClient.get(`/telemedicine/provider/${providerId}/sessions`, { params })
    return response.data
  },

  getPatientSessions: async (patientId: string, params?: SessionParams) => {
    const response = await apiClient.get(`/telemedicine/patient/${patientId}/sessions`, { params })
    return response.data
  },

  createSession: async (sessionData: {
    appointment_id: string
    provider_id: string
    patient_id?: string
  }) => {
    const response = await apiClient.post('/telemedicine/sessions', sessionData)
    return response.data
  },

  startSession: async (id: string) => {
    const response = await apiClient.post(`/telemedicine/sessions/${id}/start`)
    return response.data
  },

  endSession: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/telemedicine/sessions/${id}/end`, { notes })
    return response.data
  },

  getSessionByRoomCode: async (roomCode: string) => {
    const response = await apiClient.get(`/telemedicine/room/${roomCode}`)
    return response.data
  },

  getStats: async () => {
    const response = await apiClient.get('/telemedicine/statistics')
    return response.data
  },
}
