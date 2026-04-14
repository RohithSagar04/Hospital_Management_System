from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Patient(TimeStampedModel):
    name = models.CharField(max_length=120)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    patient_id = models.CharField(max_length=24, unique=True)
    token_number = models.PositiveIntegerField()
    # Hashed password stored via Django's make_password
    password = models.CharField(max_length=128, blank=True, default='')

    def __str__(self):
        return f'{self.patient_id} - {self.name}'


class Doctor(TimeStampedModel):
    name = models.CharField(max_length=120)
    specialization = models.CharField(max_length=120)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name


class DoctorProfile(TimeStampedModel):
    """
    Authentication & registration details for a doctor.
    Status flow: pending → approved | rejected (set by admin).
    A Doctor row is created alongside this profile during self-registration.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE, related_name='profile')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)
    # Hashed password via Django's make_password
    password = models.CharField(max_length=128)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f'Dr. {self.doctor.name} [{self.status}]'


class Appointment(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    status = models.CharField(max_length=20, default='scheduled')


class ConsultationNote(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='notes')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='notes')
    observations = models.TextField()
    diagnosis_summary = models.TextField(blank=True)


class Prescription(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    medicine_name = models.CharField(max_length=120)
    dosage = models.CharField(max_length=120)
    duration_days = models.PositiveIntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True)
    ai_drug_recommendation = models.TextField(blank=True)


class DiagnosticTest(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='diagnostics')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='diagnostics')
    test_name = models.CharField(max_length=120)
    result = models.TextField(blank=True)
    lab_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='requested')
    # True once the lab technician clicks "Send Report to Patient & Doctor"
    report_sent = models.BooleanField(default=False)


class PharmacyDispense(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='dispenses')
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='dispenses')
    medicine_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dispensed = models.BooleanField(default=False)


class BillingRecord(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='billings')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    test_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medicine_costs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
