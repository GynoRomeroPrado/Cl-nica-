'use client'

import { useState, useEffect } from 'react'
import {
  Video, Clock, Users, Phone, PhoneOff, Play, Square,
  Copy, CheckCircle, AlertCircle, Calendar, User
} from 'lucide-react'
import { telemedicineApi, TelemedicineSession } from '@/lib/api/telemedicine'
import { format, differenceInMinutes } from 'date-fns'

export default function TelemedicinePage() {
  const [sessions, setSessions] = useState<TelemedicineSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TelemedicineSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'session'>('list')
  const [stats, setStats] = useState({
    active_sessions: 0,
    today_sessions: 0,
    avg_duration: 0,
    total_sessions: 0,
  })

  useEffect(() => {
    fetchSessions()
    fetchStats()
    // Refresh active sessions every 30 seconds
    const interval = setInterval(() => {
      if (selectedStatus === 'active' || selectedStatus === 'all') {
        fetchSessions()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedStatus])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const params = selectedStatus !== 'all' ? { status: selectedStatus, limit: 50 } : { limit: 50 }
      const response = await telemedicineApi.getAllSessions(params)
      setSessions(response.data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsResponse = await telemedicineApi.getStats()
      setStats({
        active_sessions: statsResponse.active_sessions || 0,
        today_sessions: statsResponse.today_sessions || 0,
        avg_duration: statsResponse.avg_duration || 0,
        total_sessions: statsResponse.total_sessions || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      await telemedicineApi.startSession(sessionId)
      fetchSessions()
      fetchStats()
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const handleEndSession = async (sessionId: string, notes?: string) => {
    try {
      await telemedicineApi.endSession(sessionId, notes)
      fetchSessions()
      fetchStats()
      if (selectedSession?.session_id === sessionId) {
        setView('list')
        setSelectedSession(null)
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  const handleJoinSession = (session: TelemedicineSession) => {
    setSelectedSession(session)
    setView('session')
  }

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      ended: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getSessionDuration = (session: TelemedicineSession) => {
    if (!session.start_time) return 'Not started'
    if (session.end_time) {
      const duration = differenceInMinutes(new Date(session.end_time), new Date(session.start_time))
      return `${duration} min`
    }
    const duration = differenceInMinutes(new Date(), new Date(session.start_time))
    return `${duration} min (ongoing)`
  }

  const statusCounts = {
    all: sessions.length,
    waiting: sessions.filter(s => s.status === 'waiting').length,
    active: sessions.filter(s => s.status === 'active').length,
    ended: sessions.filter(s => s.status === 'ended').length,
  }

  if (view === 'session' && selectedSession) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Session Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600 rounded-full">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Telemedicine Session</h1>
                  <p className="text-gray-400 mt-1">Room Code: {selectedSession.room_code}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSession.status)}`}>
                  {selectedSession.status}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {selectedSession.status === 'active' && (
                  <button
                    onClick={() => handleEndSession(selectedSession.session_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Session</span>
                  </button>
                )}
                <button
                  onClick={() => setView('list')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          {/* Video Area */}
          <div className="bg-gray-800 rounded-lg aspect-video mb-6 flex items-center justify-center">
            <div className="text-center">
              <Video className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-4">Video conference would display here</p>
              <p className="text-gray-500 text-sm">
                Integrate with your preferred video conferencing provider
                <br />
                (Zoom, Twilio, Daily.co, etc.)
              </p>
              {selectedSession.meeting_url && (
                <a
                  href={selectedSession.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Join Meeting
                </a>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Session Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Patient ID</p>
                  <p className="text-white mt-1 font-mono">{selectedSession.patient_id.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-gray-400">Provider ID</p>
                  <p className="text-white mt-1 font-mono">{selectedSession.provider_id.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-gray-400">Start Time</p>
                  <p className="text-white mt-1">
                    {selectedSession.start_time
                      ? format(new Date(selectedSession.start_time), 'MMM dd, yyyy hh:mm a')
                      : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="text-white mt-1">{getSessionDuration(selectedSession)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Session Controls</h2>
              <div className="space-y-3">
                {selectedSession.status === 'waiting' && (
                  <button
                    onClick={() => handleStartSession(selectedSession.session_id)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Session</span>
                  </button>
                )}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-300">Room Code</p>
                    <button
                      onClick={() => copyRoomCode(selectedSession.room_code)}
                      className="text-primary-400 hover:text-primary-300"
                    >
                      {copiedCode === selectedSession.room_code ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">
                    {selectedSession.room_code}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Telemedicine Sessions</h1>
            <p className="text-gray-600 mt-1">Virtual healthcare consultations</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_sessions}</p>
                <p className="text-sm text-gray-500 mt-2">Live now</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Video className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Sessions</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.today_sessions}</p>
                <p className="text-sm text-gray-500 mt-2">Completed</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.avg_duration} min</p>
                <p className="text-sm text-gray-500 mt-2">Per session</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_sessions}</p>
                <p className="text-sm text-gray-500 mt-2">All time</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['all', 'waiting', 'active', 'ended'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && ` (${statusCounts[status as keyof typeof statusCounts]})`}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No telemedicine sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        session.status === 'active' ? 'bg-green-50' :
                        session.status === 'waiting' ? 'bg-yellow-50' :
                        'bg-gray-50'
                      }`}>
                        <Video className={`w-6 h-6 ${
                          session.status === 'active' ? 'text-green-600' :
                          session.status === 'waiting' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(session.created_at), 'MMM dd, yyyy hh:mm a')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Patient: {session.patient_id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Provider: {session.provider_id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Duration: {getSessionDuration(session)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Room:</span>
                            <span className="font-mono font-semibold text-gray-900">{session.room_code}</span>
                            <button
                              onClick={() => copyRoomCode(session.room_code)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {copiedCode === session.room_code ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {session.status === 'waiting' && (
                        <button
                          onClick={() => handleStartSession(session.session_id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center space-x-1"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </button>
                      )}
                      {session.status === 'active' && (
                        <button
                          onClick={() => handleJoinSession(session)}
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 flex items-center space-x-1"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join</span>
                        </button>
                      )}
                      {session.status !== 'ended' && session.status === 'active' && (
                        <button
                          onClick={() => handleEndSession(session.session_id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center space-x-1"
                        >
                          <Square className="w-4 h-4" />
                          <span>End</span>
                        </button>
                      )}
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
