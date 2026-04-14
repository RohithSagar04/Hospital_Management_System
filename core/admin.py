from django.contrib import admin
from .models import (
    Patient, Doctor, Appointment, ConsultationNote,
    Prescription, DiagnosticTest, PharmacyDispense, BillingRecord
)

admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Appointment)
admin.site.register(ConsultationNote)
admin.site.register(Prescription)
admin.site.register(DiagnosticTest)
admin.site.register(PharmacyDispense)
admin.site.register(BillingRecord)
