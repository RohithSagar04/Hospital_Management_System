import axios from 'axios'

export const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' })

// ── Types ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: number
  patient_id: string
  name: string
  age: number
  gender: string
  phone: string
  address: string
  token_number: number
  created_at: string
}

export interface Doctor {
  id: number
  name: string
  specialization: string
  consultation_fee: string
}

export interface Appointment {
  id: number
  patient: number
  doctor: number
  patient_name: string
  patient_id_code: string
  doctor_name: string
  doctor_specialization: string
  date: string
  status: string
}

export interface ConsultationNote {
  id: number
  patient: number
  doctor: number
  patient_name: string
  patient_id_code: string
  doctor_name: string
  observations: string
  diagnosis_summary: string
  created_at: string
}

export interface Prescription {
  id: number
  patient: number
  doctor: number
  patient_name: string
  patient_id_code: string
  doctor_name: string
  medicine_name: string
  dosage: string
  duration_days: number
  notes: string
  created_at: string
}

export interface DiagnosticTest {
  id: number
  patient: number
  doctor: number
  patient_name: string
  patient_id_code: string
  doctor_name: string
  test_name: string
  result: string
  lab_charge: string
  status: string
  report_sent: boolean
  created_at: string
}

export interface DoctorProfile {
  id: number
  doctor_id: number
  doctor_name: string
  specialization: string
  consultation_fee: string
  email: string
  phone: string
  registration_number: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface PharmacyDispense {
  id: number
  patient: number
  prescription: number
  patient_name: string
  patient_id_code: string
  medicine_name: string
  dosage: string
  medicine_cost: string
  dispensed: boolean
  created_at: string
}

export interface BillingRecord {
  id: number
  patient: number
  patient_name: string
  patient_id_code: string
  consultation_fee: string
  test_charges: string
  medicine_costs: string
  total_amount: string
  created_at: string
}

export interface AdminSummary {
  total_patients: number
  total_doctors: number
  total_appointments: number
  appointments_by_doctor: { id: number; name: string; specialization: string; total: number }[]
  recent_appointments: Appointment[]
}

// ── API functions ──────────────────────────────────────────────────────────

export const getPatients = (patient_id?: string) =>
  api.get<Patient[]>('/patients/', { params: patient_id ? { patient_id } : {} })

export const registerPatient = (data: Partial<Patient>) =>
  api.post<Patient>('/patients/', data)

export const getDoctors = () => api.get<Doctor[]>('/doctors/')

export const addDoctor = (data: Partial<Doctor>) => api.post<Doctor>('/doctors/', data)

export const getAppointments = (params?: { patient_id?: string; doctor?: number }) =>
  api.get<Appointment[]>('/appointments/', { params })

export const createAppointment = (data: { patient: number; doctor: number; date: string; status?: string }) =>
  api.post<Appointment>('/appointments/', data)

export const getConsultations = (params?: { patient_id?: string; doctor?: number }) =>
  api.get<ConsultationNote[]>('/consultations/', { params })

export const addConsultation = (data: { patient: number; doctor: number; observations: string; diagnosis_summary?: string }) =>
  api.post<ConsultationNote>('/consultations/', data)

export const getPrescriptions = (params?: { patient_id?: string; doctor?: number }) =>
  api.get<Prescription[]>('/prescriptions/', { params })

export const addPrescription = (data: { patient: number; doctor: number; medicine_name: string; dosage: string; duration_days: number; notes?: string }) =>
  api.post<Prescription>('/prescriptions/', data)

export const getDiagnostics = (params?: { patient_id?: string; doctor?: number }) =>
  api.get<DiagnosticTest[]>('/diagnostics/', { params })

export const addDiagnostic = (data: { patient: number; doctor: number; test_name: string; lab_charge?: number }) =>
  api.post<DiagnosticTest>('/diagnostics/', data)

export const updateDiagnostic = (id: number, data: Partial<DiagnosticTest>) =>
  api.patch<DiagnosticTest>(`/diagnostics/${id}/`, data)

export const getPharmacy = (patient_id?: string) =>
  api.get<PharmacyDispense[]>('/pharmacy/', { params: patient_id ? { patient_id } : {} })

export const dispensePharmacy = (prescriptionId: number, patientId: number, medicine_cost: number) =>
  api.post<PharmacyDispense>('/pharmacy/', { prescription: prescriptionId, patient: patientId, medicine_cost, dispensed: true })

export const updatePharmacy = (id: number, data: Partial<PharmacyDispense>) =>
  api.patch<PharmacyDispense>(`/pharmacy/${id}/`, data)

export const getBilling = (patient_id?: string) =>
  api.get<BillingRecord[]>('/billing/', { params: patient_id ? { patient_id } : {} })

export const generateBill = (patient_id: string) =>
  api.post<BillingRecord>('/generate-bill/', { patient_id })

export const getAdminSummary = () => api.get<AdminSummary>('/admin-summary/')

export const aiChatbot = (message: string) =>
  api.post<{ reply: string }>('/ai-chatbot/', { message })

export const aiDrugRecommendation = (disease: string, symptoms: string, patient_age?: number) =>
  api.post<{ recommendation: string }>('/ai-drug-assistant/', { disease, symptoms, patient_age })

export const loginPatient = (patient_id: string, password: string) =>
  api.post<Patient>('/patient-login/', { patient_id, password })

// ── Doctor auth ────────────────────────────────────────────────────────────
export const registerDoctor = (data: {
  name: string; specialization: string; consultation_fee: number
  email: string; phone: string; registration_number: string; password: string
}) => api.post<{ message: string; profile: DoctorProfile }>('/doctor-register/', data)

export const loginDoctor = (email: string, password: string) =>
  api.post<{ profile: DoctorProfile; doctor: Doctor }>('/doctor-login/', { email, password })

// ── Doctor approval (admin) ────────────────────────────────────────────────
export const getPendingDoctors = (status?: string) =>
  api.get<DoctorProfile[]>('/pending-doctors/', { params: status ? { status } : {} })

export const approveDoctor = (profileId: number, action: 'approve' | 'reject') =>
  api.patch<DoctorProfile>(`/approve-doctor/${profileId}/`, { action })

// ── Lab report dispatch ────────────────────────────────────────────────────
export const sendLabReport = (testId: number) =>
  api.patch<DiagnosticTest>(`/send-lab-report/${testId}/`)
