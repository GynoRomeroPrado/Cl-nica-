'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Calendar, FileText, Activity } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: 'appointment' | 'lab_result' | 'critical_alert' | 'system' | 'message'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical_alert',
      title: 'Critical Lab Result',
      message: 'Patient John Doe has abnormal lab results requiring immediate attention',
      read: false,
      created_at: new Date().toISOString(),
      action_url: '/lab-orders',
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Upcoming Appointment',
      message: 'Appointment with Jane Smith in 15 minutes',
      read: false,
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      action_url: '/appointments',
    },
    {
      id: '3',
      type: 'lab_result',
      title: 'Lab Results Ready',
      message: '5 new lab results are ready for review',
      read: false,
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      action_url: '/lab-orders',
    },
    {
      id: '4',
      type: 'message',
      title: 'New Message',
      message: 'Dr. Johnson sent you a message about patient care',
      read: true,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: '5',
      type: 'system',
      title: 'System Update',
      message: 'System maintenance scheduled for tonight at 2:00 AM',
      read: true,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notifications-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'lab_result':
        return <FileText className="w-5 h-5 text-green-600" />
      case 'critical_alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'message':
        return <Activity className="w-5 h-5 text-purple-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50'
      case 'lab_result':
        return 'bg-green-50'
      case 'critical_alert':
        return 'bg-red-50'
      case 'message':
        return 'bg-purple-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className="relative notifications-container">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className={`text-sm font-medium text-gray-900 ${
                            !notification.read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-600"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              onClick={() => setIsOpen(false)}
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
