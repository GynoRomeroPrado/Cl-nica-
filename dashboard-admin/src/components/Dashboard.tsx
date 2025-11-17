'use client'

import { useState } from 'react'
import { 
  Users, Calendar, FileText, Pill, FlaskConical, DollarSign,
  Video, Shield, Menu, X, LayoutDashboard, Settings, LogOut
} from 'lucide-react'
import { StatsCard } from './StatsCard'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const stats = [
    { title: 'Total Patients', value: '1,284', change: '+12%', icon: Users, color: 'blue' },
    { title: 'Appointments Today', value: '48', change: '+5%', icon: Calendar, color: 'green' },
    { title: 'Pending Lab Orders', value: '23', change: '-8%', icon: FlaskConical, color: 'purple' },
    { title: 'Revenue (Month)', value: '$48,592', change: '+23%', icon: DollarSign, color: 'yellow' },
  ]

  const recentActivities = [
    { type: 'appointment', patient: 'John Doe', action: 'Checked in', time: '10 min ago' },
    { type: 'prescription', patient: 'Jane Smith', action: 'Prescription filled', time: '25 min ago' },
    { type: 'lab', patient: 'Mike Johnson', action: 'Lab results ready', time: '1 hour ago' },
    { type: 'payment', patient: 'Sarah Williams', action: 'Payment received', time: '2 hours ago' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to your clinical management system</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.patient}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Users className="w-6 h-6 text-primary-600 mb-2" />
                    <span className="text-sm font-medium">New Patient</span>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Calendar className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium">Schedule Appointment</span>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Pill className="w-6 h-6 text-purple-600 mb-2" />
                    <span className="text-sm font-medium">New Prescription</span>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FlaskConical className="w-6 h-6 text-orange-600 mb-2" />
                    <span className="text-sm font-medium">Lab Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
