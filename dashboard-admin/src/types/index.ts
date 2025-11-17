export type UserRole = 
  | 'admin' 
  | 'doctor' 
  | 'nurse' 
  | 'receptionist' 
  | 'patient' 
  | 'lab_technician' 
  | 'pharmacist'

export interface User {
  user_id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  clinic_id?: string
  created_at: string
}

export interface Patient {
  patient_id: string
  user_id: string
  clinic_id: string
  mrn: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  blood_type?: string
  allergies?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  insurance_provider?: string
  insurance_policy_number?: string
  user?: User
  created_at: string
}

export interface Appointment {
  appointment_id: string
  clinic_id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_type: 'in_person' | 'telemedicine'
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reason_for_visit?: string
  notes?: string
  patient?: Patient
  doctor?: User
  created_at: string
}

export interface MedicalRecord {
  record_id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  provider_id: string
  chief_complaint?: string
  vital_signs?: {
    temperature?: number
    blood_pressure_systolic?: number
    blood_pressure_diastolic?: number
    heart_rate?: number
    respiratory_rate?: number
    oxygen_saturation?: number
    weight?: number
    height?: number
    bmi?: number
  }
  soap_subjective?: string
  soap_objective?: string
  soap_assessment?: string
  soap_plan?: string
  diagnoses?: Array<{
    icd10_code: string
    description: string
    status: 'active' | 'resolved' | 'chronic'
  }>
  created_at: string
}

export interface Prescription {
  prescription_id: string
  clinic_id: string
  patient_id: string
  prescribed_by: string
  status: 'active' | 'dispensed' | 'cancelled' | 'expired'
  prescribed_date: string
  valid_until: string
  digital_signature?: string
  items?: Array<{
    medication_name: string
    dosage: string
    frequency: string
    duration: string
    quantity: number
    instructions?: string
  }>
  created_at: string
}

export interface LabOrder {
  order_id: string
  clinic_id: string
  patient_id: string
  ordered_by: string
  status: 'ordered' | 'collected' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'routine' | 'urgent' | 'stat'
  order_date: string
  tests?: Array<{
    test_name: string
    loinc_code?: string
    status: string
    result_value?: string
    result_flag?: 'normal' | 'high' | 'low' | 'critical'
  }>
  created_at: string
}

export interface Invoice {
  invoice_id: string
  clinic_id: string
  patient_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal: number
  tax: number
  total: number
  amount_paid: number
  balance: number
  status: 'pending' | 'partial' | 'paid' | 'cancelled'
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  created_at: string
}

export interface DashboardStats {
  total_patients: number
  appointments_today: number
  pending_lab_orders: number
  monthly_revenue: number
  patient_growth: string
  appointment_growth: string
  lab_growth: string
  revenue_growth: string
}

export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  totalPages?: number
}
