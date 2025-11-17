-- ============================================
-- CLINICAL HEALTH MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- Multi-tenant system for medical clinics
-- Includes: EHR/EMR, Appointments, Prescriptions, Lab Orders, Billing, Telemedicine
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- MULTI-TENANT: CLINICS & ORGANIZATIONS
-- ============================================

CREATE TABLE clinics (
    clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50), -- RUC, NIT, EIN
    clinic_type VARCHAR(50), -- 'hospital', 'clinic', 'practice', 'wellness_center'
    specialty TEXT[], -- ['cardiology', 'pediatrics', 'general']

    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Colombia',

    -- Business Hours (JSONB)
    business_hours JSONB, -- {"monday": {"open": "08:00", "close": "18:00"}, ...}
    timezone VARCHAR(50) DEFAULT 'America/Bogota',

    -- Subscription & Billing
    subscription_tier VARCHAR(50) DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    max_staff INT DEFAULT 10,
    max_patients INT DEFAULT 500,

    -- Settings
    default_language VARCHAR(5) DEFAULT 'es',
    default_currency VARCHAR(3) DEFAULT 'COP',
    logo_url VARCHAR(500),
    settings JSONB, -- Custom clinic settings

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE clinic_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROLES & PERMISSIONS (RBAC)
-- ============================================

CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'doctor', 'nurse', 'receptionist', 'patient'
    role_display_name VARCHAR(100),
    description TEXT,
    permissions JSONB, -- {"can_view_patients": true, "can_prescribe": true, ...}
    is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USERS (EXTENDED FOR CLINICAL USE)
-- ============================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20), -- 'male', 'female', 'other', 'prefer_not_to_say'

    -- Identification
    id_type VARCHAR(50), -- 'cedula', 'passport', 'license'
    id_number VARCHAR(50),

    -- Role & Access
    role_id UUID REFERENCES roles(role_id),
    user_type VARCHAR(50) NOT NULL, -- 'staff', 'patient'

    -- Contact
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),

    -- Settings
    preferred_language VARCHAR(5) DEFAULT 'es',
    timezone VARCHAR(50),
    avatar_url VARCHAR(500),

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_user_type CHECK (user_type IN ('staff', 'patient'))
);

-- Staff-specific information
CREATE TABLE staff_profiles (
    staff_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    -- Professional Information
    professional_title VARCHAR(100), -- 'Dr.', 'Nurse', 'Technician'
    specialties TEXT[], -- ['cardiology', 'internal_medicine']
    license_number VARCHAR(100),
    license_expiry_date DATE,

    -- Employment
    employee_id VARCHAR(50),
    department VARCHAR(100),
    hire_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'on_leave', 'terminated'

    -- Schedule
    working_hours JSONB, -- {"monday": [{"start": "08:00", "end": "12:00"}, ...], ...}
    consultation_duration_minutes INT DEFAULT 30,

    -- Qualifications
    education JSONB, -- [{"degree": "MD", "institution": "...", "year": 2015}, ...]
    certifications JSONB,

    -- Financial
    consultation_fee DECIMAL(10,2),
    commission_rate DECIMAL(5,2),

    -- Digital Signature (for prescriptions)
    digital_signature_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient-specific information (extends users table)
CREATE TABLE patient_profiles (
    patient_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    -- Medical Record Number
    mrn VARCHAR(50) UNIQUE, -- Medical Record Number

    -- Demographics
    blood_type VARCHAR(5), -- 'A+', 'O-', etc.
    marital_status VARCHAR(50),
    occupation VARCHAR(100),

    -- Insurance Information
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    insurance_group_number VARCHAR(100),
    insurance_expiry_date DATE,

    -- Medical History (summary)
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[],

    -- Physical Metrics
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),

    -- Preferences
    preferred_doctor_id UUID REFERENCES staff_profiles(staff_id),
    preferred_pharmacy VARCHAR(255),

    -- Consent & Privacy
    consent_data_sharing BOOLEAN DEFAULT false,
    consent_marketing BOOLEAN DEFAULT false,
    consent_telemedicine BOOLEAN DEFAULT false,

    -- Status
    patient_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'deceased'
    registration_date DATE DEFAULT CURRENT_DATE,
    last_visit_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS & SCHEDULING
-- ============================================

CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    location_id UUID REFERENCES clinic_locations(location_id),

    -- Participants
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff_profiles(staff_id),

    -- Schedule
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT,

    -- Details
    appointment_type VARCHAR(50), -- 'consultation', 'follow_up', 'emergency', 'telemedicine'
    reason_for_visit TEXT,
    department VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'

    -- Check-in
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES users(user_id),

    -- Cancellation
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(user_id),
    cancellation_reason TEXT,

    -- Completion
    completed_at TIMESTAMP,

    -- Notes
    notes TEXT,

    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,

    -- Telemedicine
    telemedicine_link VARCHAR(500),
    telemedicine_room_id VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_appointment_type CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'telemedicine', 'procedure'))
);

-- Appointment recurring schedule
CREATE TABLE appointment_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff_profiles(staff_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,

    recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    recurrence_interval INT DEFAULT 1,
    days_of_week INT[], -- [1,3,5] = Monday, Wednesday, Friday
    start_date DATE NOT NULL,
    end_date DATE,

    appointment_type VARCHAR(50),
    duration_minutes INT DEFAULT 30,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ELECTRONIC HEALTH RECORDS (EHR/EMR)
-- ============================================

CREATE TABLE medical_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id),

    -- Record Details
    record_date TIMESTAMP DEFAULT NOW(),
    record_type VARCHAR(50), -- 'consultation', 'procedure', 'emergency', 'lab_result'

    -- Chief Complaint
    chief_complaint TEXT,

    -- Vital Signs
    temperature_celsius DECIMAL(4,2),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    respiratory_rate INT,
    oxygen_saturation DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN height_cm > 0 THEN weight_kg / POWER(height_cm / 100, 2)
            ELSE NULL
        END
    ) STORED,

    -- SOAP Notes
    subjective TEXT, -- Patient's description
    objective TEXT, -- Doctor's observations
    assessment TEXT, -- Diagnosis/Assessment
    plan TEXT, -- Treatment plan

    -- Diagnosis
    diagnoses JSONB, -- [{"icd10": "I10", "description": "Essential hypertension", "type": "primary"}, ...]

    -- Treatment
    treatment_provided TEXT,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,

    -- Provider
    provider_id UUID REFERENCES staff_profiles(staff_id),
    provider_signature VARCHAR(500),

    -- Encryption flag for sensitive data
    is_encrypted BOOLEAN DEFAULT false,

    -- Attachments
    attachments JSONB, -- [{"file_url": "...", "file_type": "pdf", "name": "Lab Results"}, ...]

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient History (immunizations, surgeries, etc.)
CREATE TABLE patient_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,

    history_type VARCHAR(50), -- 'immunization', 'surgery', 'allergy', 'family_history', 'social_history'

    -- Common fields
    description TEXT,
    date_recorded DATE,
    notes TEXT,

    -- Type-specific data (JSONB for flexibility)
    details JSONB,
    -- Examples:
    -- Immunization: {"vaccine": "COVID-19", "dose": 1, "manufacturer": "Pfizer", "lot_number": "ABC123"}
    -- Surgery: {"procedure": "Appendectomy", "hospital": "...", "surgeon": "..."}
    -- Allergy: {"allergen": "Penicillin", "reaction": "Rash", "severity": "Moderate"}

    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRESCRIPTIONS (RECETAS MÉDICAS)
-- ============================================

CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id),
    medical_record_id UUID REFERENCES medical_records(record_id),

    -- Prescriber
    prescribed_by UUID REFERENCES staff_profiles(staff_id) NOT NULL,
    prescription_date TIMESTAMP DEFAULT NOW(),

    -- Validity
    valid_until DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'dispensed', 'expired', 'cancelled'

    -- Pharmacy
    preferred_pharmacy VARCHAR(255),

    -- Digital Signature
    digital_signature TEXT, -- Encrypted signature
    signature_timestamp TIMESTAMP,

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prescription_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,

    -- Medication
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    drug_code VARCHAR(50), -- ATC code or local code

    -- Dosage
    dosage VARCHAR(100), -- '500mg', '10ml'
    form VARCHAR(50), -- 'tablet', 'capsule', 'liquid', 'injection'
    route VARCHAR(50), -- 'oral', 'topical', 'intravenous'

    -- Instructions
    frequency VARCHAR(100), -- 'twice daily', 'every 8 hours'
    duration_days INT,
    quantity INT,
    refills INT DEFAULT 0,

    -- Instructions (detailed)
    instructions TEXT,

    -- Warnings
    warnings TEXT[],

    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescription dispensing log
CREATE TABLE prescription_dispensing (
    dispensing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,

    pharmacy_name VARCHAR(255),
    pharmacist_name VARCHAR(255),
    dispensed_at TIMESTAMP DEFAULT NOW(),

    quantity_dispensed INT,
    notes TEXT
);

-- ============================================
-- LABORATORY ORDERS & RESULTS
-- ============================================

CREATE TABLE lab_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id),

    -- Ordering Provider
    ordered_by UUID REFERENCES staff_profiles(staff_id) NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),

    -- Priority
    priority VARCHAR(20) DEFAULT 'routine', -- 'stat', 'urgent', 'routine'

    -- Laboratory
    lab_name VARCHAR(255),
    lab_location VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'collected', 'in_progress', 'completed', 'cancelled'

    -- Collection
    specimen_collected_at TIMESTAMP,
    specimen_collected_by UUID REFERENCES users(user_id),

    -- Results
    results_available_at TIMESTAMP,

    -- Clinical Information
    clinical_indication TEXT,
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab_test_items (
    test_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES lab_orders(order_id) ON DELETE CASCADE,

    test_code VARCHAR(50), -- LOINC code or local code
    test_name VARCHAR(255) NOT NULL,
    test_category VARCHAR(100), -- 'hematology', 'chemistry', 'microbiology'

    specimen_type VARCHAR(100), -- 'blood', 'urine', 'tissue'

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_item_id UUID REFERENCES lab_test_items(test_item_id) ON DELETE CASCADE,

    result_value VARCHAR(255),
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),

    -- Abnormal Flag
    abnormal_flag VARCHAR(20), -- 'normal', 'high', 'low', 'critical'

    -- Status
    result_status VARCHAR(50) DEFAULT 'preliminary', -- 'preliminary', 'final', 'corrected'

    -- Performer
    performed_by VARCHAR(255),
    performed_at TIMESTAMP,

    -- Verification
    verified_by UUID REFERENCES staff_profiles(staff_id),
    verified_at TIMESTAMP,

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BILLING & INVOICING
-- ============================================

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id),

    -- Invoice Details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Amounts
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

    -- Currency
    currency VARCHAR(3) DEFAULT 'COP',

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue', 'cancelled'

    -- Payment
    payment_method VARCHAR(50), -- 'cash', 'card', 'insurance', 'transfer'
    payment_date DATE,

    -- Insurance
    insurance_claim_id VARCHAR(100),
    insurance_paid_amount DECIMAL(12,2),

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoice_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,

    item_type VARCHAR(50), -- 'consultation', 'procedure', 'medication', 'lab_test'
    description TEXT NOT NULL,

    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,

    total DECIMAL(10,2) GENERATED ALWAYS AS (
        quantity * unit_price * (1 - discount_percent / 100) * (1 + tax_percent / 100)
    ) STORED,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id),

    payment_date TIMESTAMP DEFAULT NOW(),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',

    payment_method VARCHAR(50), -- 'cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer'

    -- Card Details (if applicable)
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),

    -- Reference
    reference_number VARCHAR(100),
    transaction_id VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'refunded'

    -- Processed by
    processed_by UUID REFERENCES users(user_id),

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TELEMEDICINE & VIDEO CONSULTATIONS
-- ============================================

CREATE TABLE telemedicine_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id),

    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff_profiles(staff_id) ON DELETE CASCADE,

    -- Session Details
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    duration_minutes INT,

    -- Platform
    platform VARCHAR(50), -- 'zoom', 'google_meet', 'custom'
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'

    -- Recording
    recording_url VARCHAR(500),
    recording_available BOOLEAN DEFAULT false,

    -- Notes
    session_notes TEXT,
    technical_issues TEXT,

    -- Quality
    connection_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS & FILE MANAGEMENT
-- ============================================

CREATE TABLE patient_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,

    document_type VARCHAR(50), -- 'lab_result', 'imaging', 'consent_form', 'insurance_card', 'id_document'
    document_name VARCHAR(255) NOT NULL,
    description TEXT,

    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- 'pdf', 'jpg', 'png', 'dicom'
    file_size_bytes BIGINT,

    -- Metadata
    document_date DATE,
    uploaded_by UUID REFERENCES users(user_id),

    -- Encryption
    is_encrypted BOOLEAN DEFAULT false,

    -- Tags
    tags TEXT[],

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS & COMPLIANCE
-- ============================================

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    -- User & Action
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'VIEW_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'LOGIN', 'EXPORT_DATA'

    -- Entity
    entity_type VARCHAR(50), -- 'patient', 'appointment', 'prescription'
    entity_id UUID,

    -- Details
    changes JSONB, -- Before/after values for updates
    metadata JSONB, -- Additional context

    -- Request Info
    ip_address INET,
    user_agent TEXT,

    -- HIPAA Compliance
    phi_accessed BOOLEAN DEFAULT false, -- Protected Health Information

    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE consent_forms (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient_profiles(patient_id) ON DELETE CASCADE,

    consent_type VARCHAR(100), -- 'treatment', 'data_sharing', 'telemedicine', 'photography', 'hipaa'
    consent_text TEXT NOT NULL,

    -- Signature
    patient_signature TEXT, -- Base64 encoded signature image
    signed_at TIMESTAMP,
    signed_ip_address INET,

    -- Witness (if required)
    witness_id UUID REFERENCES users(user_id),
    witness_signature TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & MESSAGING
-- ============================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    notification_type VARCHAR(50), -- 'appointment_reminder', 'lab_result', 'prescription_ready', 'message'
    title VARCHAR(255) NOT NULL,
    message TEXT,

    -- Priority
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Delivery
    delivery_method VARCHAR(50), -- 'push', 'sms', 'email', 'in_app'

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Actions
    action_url VARCHAR(500),
    action_data JSONB,

    -- Scheduling
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    -- Sender & Receiver
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    -- Message
    subject VARCHAR(255),
    body TEXT NOT NULL,

    -- Related Entity
    related_entity_type VARCHAR(50), -- 'appointment', 'prescription', 'lab_order'
    related_entity_id UUID,

    -- Attachments
    attachments JSONB,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Thread
    parent_message_id UUID REFERENCES messages(message_id),
    thread_id UUID,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INVENTORY & PHARMACY MANAGEMENT (Optional)
-- ============================================

CREATE TABLE inventory_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,

    item_type VARCHAR(50), -- 'medication', 'supply', 'equipment'
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),

    -- Details
    description TEXT,
    manufacturer VARCHAR(255),

    -- Inventory
    current_stock INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    max_stock_level INT,
    unit VARCHAR(50), -- 'units', 'boxes', 'vials'

    -- Pricing
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(item_id) ON DELETE CASCADE,

    transaction_type VARCHAR(50), -- 'purchase', 'sale', 'adjustment', 'waste'
    quantity INT NOT NULL,

    -- Reference
    reference_number VARCHAR(100),
    notes TEXT,

    -- User
    performed_by UUID REFERENCES users(user_id),

    transaction_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WELLNESS & FITNESS (FROM ORIGINAL SCHEMA)
-- Integrated as optional module for wellness clinics
-- ============================================

-- Keep existing tables: exercises, workouts, workout_exercises, workout_sets
-- From the original schema - can be enabled/disabled per clinic

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================

-- Clinics
CREATE INDEX idx_clinics_status ON clinics(is_active);
CREATE INDEX idx_clinics_subscription ON clinics(subscription_status, subscription_tier);

-- Users
CREATE INDEX idx_users_clinic ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type_role ON users(user_type, role_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Patients
CREATE INDEX idx_patients_mrn ON patient_profiles(mrn);
CREATE INDEX idx_patients_clinic ON patient_profiles(clinic_id);
CREATE INDEX idx_patients_status ON patient_profiles(patient_status);

-- Staff
CREATE INDEX idx_staff_clinic ON staff_profiles(clinic_id);
CREATE INDEX idx_staff_specialties ON staff_profiles USING GIN(specialties);

-- Appointments
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_upcoming ON appointments(appointment_date, start_time) WHERE status IN ('scheduled', 'confirmed');

-- Medical Records
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id, record_date DESC);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_provider ON medical_records(provider_id);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, prescription_date DESC);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(prescribed_by);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- Lab Orders
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_orders_date ON lab_orders(order_date DESC);

-- Invoices
CREATE INDEX idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_clinic ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_phi ON audit_logs(timestamp DESC) WHERE phi_accessed = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies (examples - customize per clinic needs)
CREATE POLICY "Clinic isolation" ON patient_profiles
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::uuid);

CREATE POLICY "Staff can view clinic patients" ON patient_profiles
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can view own records" ON medical_records
    FOR SELECT USING (
        patient_id = auth.uid() OR
        provider_id IN (SELECT staff_id FROM staff_profiles WHERE staff_id = auth.uid())
    );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate MRN for new patients
CREATE OR REPLACE FUNCTION generate_mrn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mrn IS NULL THEN
        NEW.mrn := 'MRN-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('mrn_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS mrn_sequence START 1;

CREATE TRIGGER trigger_generate_mrn BEFORE INSERT ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION generate_mrn();

-- Auto-generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

CREATE TRIGGER trigger_generate_invoice_number BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Audit log trigger for sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (clinic_id, user_id, action, entity_type, entity_id, phi_accessed)
    VALUES (
        NEW.clinic_id,
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        NEW.patient_id,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_medical_records_access AFTER INSERT OR UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_access();

-- ============================================
-- SEED DATA: DEFAULT ROLES
-- ============================================

INSERT INTO roles (role_name, role_display_name, description, permissions, is_system_role) VALUES
('admin', 'Administrator', 'Full system access',
    '{"can_manage_clinic": true, "can_manage_users": true, "can_view_all_records": true, "can_generate_reports": true}', true),

('doctor', 'Doctor', 'Medical practitioner',
    '{"can_view_patients": true, "can_create_appointments": true, "can_view_medical_records": true, "can_create_prescriptions": true, "can_order_labs": true, "can_update_medical_records": true}', true),

('nurse', 'Nurse', 'Nursing staff',
    '{"can_view_patients": true, "can_view_appointments": true, "can_update_vitals": true, "can_view_medical_records": true}', true),

('receptionist', 'Receptionist', 'Front desk staff',
    '{"can_view_patients": true, "can_create_appointments": true, "can_update_appointments": true, "can_check_in_patients": true, "can_create_invoices": true}', true),

('pharmacist', 'Pharmacist', 'Pharmacy staff',
    '{"can_view_prescriptions": true, "can_dispense_medications": true, "can_manage_inventory": true}', true),

('lab_technician', 'Lab Technician', 'Laboratory staff',
    '{"can_view_lab_orders": true, "can_update_lab_results": true}', true),

('patient', 'Patient', 'Patient user',
    '{"can_view_own_appointments": true, "can_view_own_records": true, "can_view_own_prescriptions": true, "can_book_appointments": true}', true)

ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE clinics IS 'Multi-tenant: Each clinic is a separate tenant';
COMMENT ON TABLE patient_profiles IS 'Patient demographics and medical summary';
COMMENT ON TABLE staff_profiles IS 'Healthcare providers and staff information';
COMMENT ON TABLE appointments IS 'Appointment scheduling and tracking';
COMMENT ON TABLE medical_records IS 'Electronic Health Records (EHR/EMR) - SOAP notes, vitals, diagnoses';
COMMENT ON TABLE prescriptions IS 'Medical prescriptions with digital signature support';
COMMENT ON TABLE lab_orders IS 'Laboratory test orders and tracking';
COMMENT ON TABLE lab_results IS 'Laboratory test results';
COMMENT ON TABLE invoices IS 'Billing and invoicing';
COMMENT ON TABLE telemedicine_sessions IS 'Video consultation sessions';
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit trail for all sensitive operations';
COMMENT ON COLUMN patient_profiles.mrn IS 'Medical Record Number - unique patient identifier';
COMMENT ON COLUMN medical_records.is_encrypted IS 'Flag indicating if sensitive fields are encrypted';
COMMENT ON COLUMN audit_logs.phi_accessed IS 'Protected Health Information access flag for HIPAA compliance';
