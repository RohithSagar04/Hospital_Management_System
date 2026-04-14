from rest_framework import serializers
from .models import (
    Patient, Doctor, DoctorProfile, Appointment, ConsultationNote,
    Prescription, DiagnosticTest, PharmacyDispense, BillingRecord
)
import logging

logger = logging.getLogger(__name__)


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        # Never send the hashed password back to the client
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        raw = validated_data.pop('password', '')
        patient = Patient(**validated_data)
        patient.password = make_password(raw) if raw else ''
        try:
            patient.save()
        except Exception as e:
            logger.error(f"Error saving patient: {e}")
            raise e
        return patient


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'


class DoctorProfileSerializer(serializers.ModelSerializer):
    # Nested read-only fields from the linked Doctor record
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    consultation_fee = serializers.DecimalField(source='doctor.consultation_fee', max_digits=10, decimal_places=2, read_only=True)
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'doctor_id', 'doctor_name', 'specialization', 'consultation_fee',
            'email', 'phone', 'registration_number', 'status', 'created_at',
        ]
        # password is never serialized out
        read_only_fields = ['status', 'created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'


class ConsultationNoteSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = ConsultationNote
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'


class DiagnosticTestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DiagnosticTest
        fields = '__all__'   # includes the new report_sent field


class PharmacyDispenseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    medicine_name = serializers.CharField(source='prescription.medicine_name', read_only=True)
    dosage = serializers.CharField(source='prescription.dosage', read_only=True)

    class Meta:
        model = PharmacyDispense
        fields = '__all__'


class BillingRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)

    class Meta:
        model = BillingRecord
        fields = '__all__'


