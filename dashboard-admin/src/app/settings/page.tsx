'use client'

import { useState } from 'react'
import {
  Settings, User, Lock, Bell, Building, Database,
  Save, Shield, Globe, Mail, Phone, MapPin, CreditCard
} from 'lucide-react'

type SettingsTab = 'profile' | 'security' | 'notifications' | 'clinic' | 'integrations' | 'system'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)

  // Profile settings
  const [profile, setProfile] = useState({
    full_name: 'Dr. John Smith',
    email: 'john.smith@clinic.com',
    phone: '+1 (555) 123-4567',
    role: 'doctor',
    specialization: 'Internal Medicine',
    license_number: 'MD123456',
  })

  // Security settings
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
    session_timeout: '30',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    appointment_reminders: true,
    lab_results: true,
    critical_alerts: true,
    daily_summary: false,
  })

  // Clinic settings
  const [clinic, setClinic] = useState({
    name: 'General Medical Clinic',
    address: '123 Healthcare Ave',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    phone: '+1 (555) 987-6543',
    email: 'contact@clinic.com',
    website: 'https://clinic.com',
    tax_id: '12-3456789',
  })

  // Integration settings
  const [integrations, setIntegrations] = useState({
    stripe_enabled: true,
    zoom_enabled: true,
    twilio_enabled: false,
    sendgrid_enabled: true,
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'security' as SettingsTab, label: 'Security', icon: Lock },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'clinic' as SettingsTab, label: 'Clinic Info', icon: Building },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: Globe },
    { id: 'system' as SettingsTab, label: 'System', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Settings className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and clinic preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="card p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={profile.role}
                          onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="doctor">Doctor</option>
                          <option value="nurse">Nurse</option>
                          <option value="admin">Admin</option>
                          <option value="receptionist">Receptionist</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={profile.specialization}
                          onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={profile.license_number}
                          onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={security.current_password}
                            onChange={(e) => setSecurity({ ...security, current_password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={security.new_password}
                            onChange={(e) => setSecurity({ ...security, new_password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={security.confirm_password}
                            onChange={(e) => setSecurity({ ...security, confirm_password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">Enable 2FA</p>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={security.two_factor_enabled}
                            onChange={(e) => setSecurity({ ...security, two_factor_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <select
                          value={security.session_timeout}
                          onChange={(e) => setSecurity({ ...security, session_timeout: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'sms_notifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                      { key: 'appointment_reminders', label: 'Appointment Reminders', description: 'Get reminders for upcoming appointments' },
                      { key: 'lab_results', label: 'Lab Results', description: 'Notify when lab results are ready' },
                      { key: 'critical_alerts', label: 'Critical Alerts', description: 'Immediate alerts for critical situations' },
                      { key: 'daily_summary', label: 'Daily Summary', description: 'Receive a daily summary email' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({
                              ...notifications,
                              [item.key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinic Info Tab */}
              {activeTab === 'clinic' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Clinic Information</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        value={clinic.name}
                        onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={clinic.address}
                          onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={clinic.city}
                          onChange={(e) => setClinic({ ...clinic, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={clinic.state}
                          onChange={(e) => setClinic({ ...clinic, state: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={clinic.zip}
                          onChange={(e) => setClinic({ ...clinic, zip: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={clinic.phone}
                          onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={clinic.email}
                          onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={clinic.website}
                          onChange={(e) => setClinic({ ...clinic, website: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          value={clinic.tax_id}
                          onChange={(e) => setClinic({ ...clinic, tax_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Stripe Payment Processing</p>
                            <p className="text-sm text-gray-600">Accept payments online</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={integrations.stripe_enabled}
                            onChange={(e) => setIntegrations({ ...integrations, stripe_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {integrations.stripe_enabled && (
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Configure Stripe →
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Video className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">Zoom Video Conferencing</p>
                            <p className="text-sm text-gray-600">Enable telemedicine with Zoom</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={integrations.zoom_enabled}
                            onChange={(e) => setIntegrations({ ...integrations, zoom_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {integrations.zoom_enabled && (
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Configure Zoom →
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-6 h-6 text-red-600" />
                          <div>
                            <p className="font-medium text-gray-900">Twilio SMS Service</p>
                            <p className="text-sm text-gray-600">Send SMS notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={integrations.twilio_enabled}
                            onChange={(e) => setIntegrations({ ...integrations, twilio_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {integrations.twilio_enabled && (
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Configure Twilio →
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">SendGrid Email Service</p>
                            <p className="text-sm text-gray-600">Send transactional emails</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={integrations.sendgrid_enabled}
                            onChange={(e) => setIntegrations({ ...integrations, sendgrid_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {integrations.sendgrid_enabled && (
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Configure SendGrid →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">System Configuration</h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 mb-1">HIPAA Compliance</p>
                          <p className="text-sm text-blue-700">
                            All data is encrypted at rest and in transit. Audit logging is enabled for all PHI access.
                            Data retention policy: 6 years.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Database</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Database Status</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Connected
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Backup Status</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Daily at 2:00 AM
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Last Backup</span>
                          <span className="text-sm text-gray-900">Today at 2:00 AM</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Version</span>
                          <span className="text-sm text-gray-900">v1.0.0</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Environment</span>
                          <span className="text-sm text-gray-900">Production</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">API Status</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Operational
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      // Reset to original values
                      window.location.reload()
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
