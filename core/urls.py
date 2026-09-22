from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PatientViewSet, DoctorViewSet, AppointmentViewSet, ConsultationNoteViewSet,
    PrescriptionViewSet, DiagnosticTestViewSet, PharmacyDispenseViewSet, BillingRecordViewSet,
    admin_summary, generate_bill, ai_chatbot, ai_drug_recommendation, patient_login,
    doctor_register, doctor_login, pending_doctors, approve_doctor, send_lab_report,
    delete_doctor, set_doctor_credentials, admin_login,
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'doctors', DoctorViewSet, basename='doctors')
router.register(r'appointments', AppointmentViewSet, basename='appointments')
router.register(r'consultations', ConsultationNoteViewSet, basename='consultations')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescriptions')
router.register(r'diagnostics', DiagnosticTestViewSet, basename='diagnostics')
router.register(r'pharmacy', PharmacyDispenseViewSet, basename='pharmacy')
router.register(r'billing', BillingRecordViewSet, basename='billing')

urlpatterns = [
    path('', include(router.urls)),
    path('admin-summary/', admin_summary),
    path('generate-bill/', generate_bill),
    path('patient-login/', patient_login),
    path('ai-chatbot/', ai_chatbot),
    path('ai-drug-assistant/', ai_drug_recommendation),
    path('admin-login/', admin_login),
    # Doctor auth & approval
    path('doctor-register/', doctor_register),
    path('doctor-login/', doctor_login),
    path('pending-doctors/', pending_doctors),
    path('approve-doctor/<int:profile_id>/', approve_doctor),
    # Lab report dispatch
    path('send-lab-report/<int:test_id>/', send_lab_report),
    # Doctor management
    path('delete-doctor/<int:doctor_id>/', delete_doctor),
    path('set-doctor-credentials/', set_doctor_credentials),
]


