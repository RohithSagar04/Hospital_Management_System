from decimal import Decimal

from django.db.models import Count, Sum
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Patient, Doctor, DoctorProfile, Appointment, ConsultationNote,
    Prescription, DiagnosticTest, PharmacyDispense, BillingRecord
)
from .serializers import (
    PatientSerializer, DoctorSerializer, DoctorProfileSerializer, AppointmentSerializer,
    ConsultationNoteSerializer, PrescriptionSerializer, DiagnosticTestSerializer,
    PharmacyDispenseSerializer, BillingRecordSerializer
)


# ── ViewSets ──────────────────────────────────────────────────────────────────

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer

    def get_queryset(self):
        qs = Patient.objects.all().order_by('-created_at')
        pid = self.request.query_params.get('patient_id')
        if pid:
            qs = qs.filter(patient_id__iexact=pid)
        return qs


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all().order_by('name')
    serializer_class = DoctorSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = Appointment.objects.select_related('patient', 'doctor').order_by('-date')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


class ConsultationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationNoteSerializer

    def get_queryset(self):
        qs = ConsultationNote.objects.select_related('patient', 'doctor').order_by('-created_at')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        qs = Prescription.objects.select_related('patient', 'doctor').order_by('-created_at')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


class DiagnosticTestViewSet(viewsets.ModelViewSet):
    serializer_class = DiagnosticTestSerializer

    def get_queryset(self):
        qs = DiagnosticTest.objects.select_related('patient', 'doctor').order_by('-created_at')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


class PharmacyDispenseViewSet(viewsets.ModelViewSet):
    serializer_class = PharmacyDispenseSerializer

    def get_queryset(self):
        qs = PharmacyDispense.objects.select_related('patient', 'prescription').order_by('-created_at')
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        return qs


class BillingRecordViewSet(viewsets.ModelViewSet):
    serializer_class = BillingRecordSerializer

    def get_queryset(self):
        qs = BillingRecord.objects.select_related('patient').order_by('-created_at')
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(patient__patient_id__iexact=patient_id)
        return qs


# ── Admin summary ─────────────────────────────────────────────────────────────

@api_view(['GET'])
def admin_summary(request):
    from collections import defaultdict
    import datetime

    appointments_qs = Appointment.objects.select_related('patient', 'doctor').order_by('-date')
    recent_appointments = appointments_qs[:50]

    appointments_detail = [
        {
            'id': a.id,
            'patient_name': a.patient.name,
            'patient_id_code': a.patient.patient_id,
            'doctor_name': a.doctor.name,
            'doctor_specialization': a.doctor.specialization,
            'date': str(a.date),
            'status': a.status,
        }
        for a in recent_appointments
    ]

    # Doctor counts by designation & specialization
    doctor_designations = list(
        Doctor.objects.values('designation').annotate(total=Count('id')).order_by('-total')
    )
    doctor_specializations = list(
        Doctor.objects.values('specialization').annotate(total=Count('id')).order_by('-total')
    )

    # Doctors grouped by specialization with full details
    doctors_by_specialization = defaultdict(list)
    for d in Doctor.objects.all().order_by('specialization', 'name'):
        doctors_by_specialization[d.specialization].append({
            'id': d.id,
            'name': d.name,
            'designation': d.designation,
            'consultation_fee': str(d.consultation_fee),
        })
    doctors_by_specialization = [
        {'specialization': spec, 'doctors': docs}
        for spec, docs in sorted(doctors_by_specialization.items())
    ]

    # Appointments by specialization
    appts_by_spec = list(
        Appointment.objects.select_related('doctor')
        .values('doctor__specialization')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    appointments_by_specialization = [
        {'specialization': r['doctor__specialization'], 'total': r['total']}
        for r in appts_by_spec
    ]

    # Appointments by status
    appts_by_status = list(
        Appointment.objects.values('status').annotate(total=Count('id')).order_by('-total')
    )

    # Appointments trend — last 30 days grouped by date
    thirty_days_ago = datetime.date.today() - datetime.timedelta(days=29)
    trend_qs = (
        Appointment.objects.filter(date__gte=thirty_days_ago)
        .values('date')
        .annotate(total=Count('id'))
        .order_by('date')
    )
    appointments_trend = [
        {'date': str(r['date']), 'total': r['total']}
        for r in trend_qs
    ]

    data = {
        'total_patients': Patient.objects.count(),
        'total_doctors': Doctor.objects.count(),
        'total_appointments': Appointment.objects.count(),
        'appointments_by_doctor': list(
            Doctor.objects.annotate(total=Count('appointments')).values('id', 'name', 'specialization', 'total')
        ),
        'doctor_designations': doctor_designations,
        'doctor_specializations': doctor_specializations,
        'doctors_by_specialization': doctors_by_specialization,
        'appointments_by_specialization': appointments_by_specialization,
        'appointments_by_status': appts_by_status,
        'appointments_trend': appointments_trend,
        'recent_appointments': appointments_detail,
    }
    return Response(data)


# ── Billing auto-calculate ────────────────────────────────────────────────────

@api_view(['POST'])
def generate_bill(request):
    """
    POST { patient_id: "PT-XXXXXX" }
    Auto-sums: latest doctor consultation fee + all lab charges + all dispense costs.
    Creates or updates a BillingRecord and returns it.
    """
    patient_id_code = request.data.get('patient_id')
    if not patient_id_code:
        return Response({'error': 'patient_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        patient = Patient.objects.get(patient_id__iexact=patient_id_code)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Consultation fee — take the most recent appointment's doctor fee
    last_appointment = Appointment.objects.filter(patient=patient).select_related('doctor').order_by('-date').first()
    consultation_fee = last_appointment.doctor.consultation_fee if last_appointment else Decimal('0')

    # Lab charges — sum of all diagnostic test lab_charge for this patient
    test_charges = DiagnosticTest.objects.filter(patient=patient).aggregate(
        total=Sum('lab_charge')
    )['total'] or Decimal('0')

    # Medicine costs — sum of all pharmacy dispense medicine_cost
    medicine_costs = PharmacyDispense.objects.filter(patient=patient).aggregate(
        total=Sum('medicine_cost')
    )['total'] or Decimal('0')

    total_amount = consultation_fee + test_charges + medicine_costs

    bill, _ = BillingRecord.objects.update_or_create(
        patient=patient,
        defaults={
            'consultation_fee': consultation_fee,
            'test_charges': test_charges,
            'medicine_costs': medicine_costs,
            'total_amount': total_amount,
        }
    )
    return Response(BillingRecordSerializer(bill).data, status=status.HTTP_200_OK)


# ── Patient Login ─────────────────────────────────────────────────────────────

@api_view(['POST'])
def patient_login(request):
    """
    ##POST { patient_id: "PT-XXXXXX", password: "..." }
    ##Verifies credentials and returns patient data (no password field).
    """
    from django.contrib.auth.hashers import check_password

    patient_id = request.data.get('patient_id', '').strip()
    password = request.data.get('password', '').strip()

    if not patient_id or not password:
        return Response(
            {'error': 'Patient ID and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        patient = Patient.objects.get(patient_id__iexact=patient_id)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Invalid Patient ID or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not patient.password or not check_password(password, patient.password):
        return Response(
            {'error': 'Invalid Patient ID or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)


# ── AI: Rule-based Hospital Chatbot ──────────────────────────────────────────

def _hospital_chatbot(message: str) -> str:
    """Smart rule-based hospital assistant — no API key required."""
    m = message.lower().strip()

    rules = [
        (['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
         "Hello! 👋 Welcome to the Hospital Assistant. I can help you with:\n• 📅 Appointment booking\n• 🏥 Departments & doctors\n• 💊 Pharmacy & prescriptions\n• 🧪 Lab tests & reports\n• 💳 Billing & payments\n• 🚨 Emergency contacts\n• ⏰ Hospital timings\n\nWhat would you like to know?"),

        (['appointment', 'book', 'schedule', 'consult', 'visit', 'meet doctor'],
         "📅 To book an appointment:\n1. Go to the Patient Dashboard (left sidebar)\n2. Scroll to 'Book an Appointment'\n3. Select your preferred doctor\n4. Pick a date and click Confirm\n\nYour Patient ID (PT-XXXXXX) will be linked automatically once you're registered."),

        (['department', 'specialist', 'specialty', 'which doctor', 'available doctor'],
         "🏥 Our hospital departments include:\n• General Medicine\n• Cardiology (Heart)\n• Neurology (Brain & Nerves)\n• Orthopedics (Bones & Joints)\n• Pediatrics (Children)\n• Gynecology & Obstetrics\n• Dermatology (Skin)\n• ENT (Ear, Nose, Throat)\n• Ophthalmology (Eyes)\n• Psychiatry & Mental Health\n• Oncology (Cancer Care)\n\nVisit the Patient Dashboard to see available doctors."),

        (['doctor', 'physician', 'specialist'],
         "👨‍⚕️ All available doctors and their specializations are listed on the Patient Dashboard. You can directly book an appointment with any doctor by clicking 'Book Appointment' on their card."),

        (['pharmacy', 'medicine', 'medication', 'drug', 'prescription', 'tablet', 'capsule', 'syrup', 'collect medicine'],
         "💊 Pharmacy Information:\n• Prescriptions from your doctor appear in the Pharmacy Dashboard\n• Visit the pharmacy counter with your Patient ID (PT-XXXXXX)\n• Our pharmacy is open 24 hours, 7 days a week\n• Generic alternatives are available on request\n• For any prescription queries, ask the pharmacist on duty"),

        (['lab', 'test', 'diagnostic', 'blood', 'x-ray', 'xray', 'scan', 'mri', 'ct', 'ultrasound', 'report', 'result', 'biopsy'],
         "🧪 Diagnostic & Lab Tests:\n• Tests ordered by your doctor are shown in the Diagnosis Dashboard\n• Enter your Patient ID to track test status\n• Results are updated by our lab team (usually within 24–48 hours)\n• Sample collection: 6:00 AM – 10:00 PM\n• Radiology (X-Ray, MRI, CT): 8:00 AM – 8:00 PM\n• For urgent tests, inform the lab staff"),

        (['bill', 'billing', 'payment', 'cost', 'fee', 'charge', 'amount', 'invoice', 'receipt', 'pay', 'how much'],
         "💳 Billing Information:\n• Go to the Billing Dashboard and enter your Patient ID\n• Click 'Generate Bill' to get a consolidated invoice\n• Bill includes: Consultation fee + Lab charges + Medicine costs\n• Payment modes: Cash, Card, UPI, Net Banking\n• Insurance and TPA cashless facility available\n• For billing queries, contact the billing desk (Ground Floor)"),

        (['emergency', 'urgent', 'ambulance', 'critical', '108', 'accident', 'chest pain', 'not breathing', 'unconscious'],
         "🚨 EMERGENCY ALERT:\n• Call 108 immediately for ambulance\n• Hospital Emergency: +91-XXXX-XXXXXX\n• Emergency Department is OPEN 24/7\n• For chest pain, difficulty breathing, or loss of consciousness — go to Emergency ward immediately\n• Do NOT wait for an appointment in case of emergency"),

        (['timing', 'time', 'hour', 'open', 'close', 'working hour', 'opd', 'when'],
         "⏰ Hospital Timings:\n• OPD (Outpatient): Mon–Sat, 8:00 AM – 8:00 PM\n• Emergency: 24/7 (All days)\n• ICU / Critical Care: 24/7\n• Pharmacy: 24/7\n• Lab / Sample Collection: 6:00 AM – 10:00 PM\n• Radiology: 8:00 AM – 8:00 PM\n• Sunday: Emergency only"),

        (['patient id', 'my id', 'token', 'registration number', 'what is my id', 'id number'],
         "🪪 Patient ID & Token:\n• Your Patient ID is generated during registration (format: PT-XXXXXX)\n• It is your unique identifier for all hospital services\n• Token Number is your queue number for the day\n• Both are displayed on your Patient Dashboard\n• Always carry your Patient ID when visiting any counter"),

        (['fever', 'cold', 'cough', 'headache', 'pain', 'nausea', 'vomiting', 'diarrhea', 'fatigue', 'dizzy', 'breathless', 'symptom', 'sick', 'ill', 'not feeling'],
         "🩺 Health Advice:\nFor any symptoms, please consult one of our qualified doctors rather than self-medicating. Book an appointment through the Patient Dashboard.\n\n⚠️ Seek immediate Emergency care if you experience:\n• Chest pain or pressure\n• Difficulty breathing\n• Sudden severe headache\n• Loss of consciousness\n• High fever (above 103°F / 39.4°C)"),

        (['insurance', 'cashless', 'tpa', 'claim', 'mediclaim', 'policy'],
         "🏥 Insurance & Cashless Facility:\n• We accept most major health insurance plans\n• TPA cashless facility available\n• Please bring: Insurance card + Photo ID + Policy documents\n• Pre-authorization required for planned procedures\n• Contact Billing Desk (Ground Floor) for insurance queries\n• Helpline: Available during OPD hours"),

        (['covid', 'corona', 'virus', 'infection', 'contagious', 'isolation'],
         "😷 Infectious Disease / COVID:\n• Please wear a mask inside hospital premises\n• Dedicated COVID / Fever clinic available\n• If you have symptoms (fever, cough, breathing difficulty), call ahead before visiting\n• Our infection control team follows standard protocols\n• Isolation rooms available for confirmed cases"),

        (['cancel', 'reschedule', 'postpone', 'change appointment'],
         "📅 Cancellation / Rescheduling:\n• Please inform us at least 2 hours before your appointment\n• Contact the reception counter or call the helpline\n• Walk-in patients are accepted subject to doctor availability\n• No cancellation fee for first-time rescheduling"),

        (['thank', 'thanks', 'thank you', 'great', 'helpful', 'bye', 'goodbye', 'ok thanks'],
         "😊 You're very welcome! We're here to support your health journey. If you have any more questions, feel free to ask anytime. Stay healthy and take care! 💙"),

        (['who are you', 'what are you', 'are you a bot', 'are you human', 'are you ai', 'what can you do'],
         "🤖 I'm the Hospital AI Assistant — a smart chatbot designed to answer your hospital-related questions 24/7. I can help with appointments, departments, pharmacy, billing, lab tests, timings, and general health queries. For medical advice, please consult one of our doctors."),
    ]

    for keywords, response in rules:
        if any(kw in m for kw in keywords):
            return response

    return (
        "I can help you with hospital-related queries! Here's what I know:\n\n"
        "📅 Appointment booking → Ask 'how to book appointment'\n"
        "🏥 Departments & doctors → Ask 'what departments are available'\n"
        "💊 Pharmacy → Ask 'how to collect medicines'\n"
        "🧪 Lab tests → Ask 'how to check test results'\n"
        "💳 Billing → Ask 'how to get my bill'\n"
        "🚨 Emergency → Ask 'emergency contact'\n"
        "⏰ Timings → Ask 'what are hospital timings'\n\n"
        "Please type your question and I'll do my best to help!"
    )


# ── AI: Rule-based Drug Recommendation ───────────────────────────────────────

def _drug_recommendation(disease: str, symptoms: str, patient_age) -> str:
    """##Evidence-based drug suggestion for common conditions — no API key required."""
    combined = f"{disease} {symptoms}".lower()

    age_note = ""
    try:
        age_num = int(str(patient_age))
        if age_num < 12:
            age_note = "\n\n⚠️  PEDIATRIC PATIENT (< 12 yrs): All doses must be weight-based (mg/kg). Use paediatric formulations. Avoid aspirin (Reye's syndrome risk)."
        elif age_num > 65:
            age_note = "\n\n⚠️  ELDERLY PATIENT (> 65 yrs): Start low, go slow. Avoid high-risk medications (Beers Criteria). Monitor renal & hepatic function."
    except (ValueError, TypeError):
        pass

    protocols = [
        (
            ['hypertension', 'high blood pressure', 'high bp', 'htn'],
            "Hypertension",
            "ACE Inhibitors · ARBs · Calcium Channel Blockers · Thiazide Diuretics · Beta-Blockers",
            "Amlodipine 5–10 mg OD\nEnalapril 5–20 mg BD\nLosartan 50–100 mg OD\nHydrochlorothiazide 12.5–25 mg OD\nMetoprolol 25–100 mg BD",
            "Monitor BP weekly until stable. ACE inhibitors: watch for dry cough → switch to ARB. Avoid ACE/ARB in pregnancy. Check serum creatinine & K⁺ at baseline and 1–2 weeks after starting."
        ),
        (
            ['diabetes', 'blood sugar', 'hyperglycemia', 'diabetic', 'type 2', 'dm2'],
            "Type 2 Diabetes Mellitus",
            "Biguanides (first-line) · Sulfonylureas · DPP-4 Inhibitors · SGLT-2 Inhibitors · GLP-1 Agonists · Insulin (if needed)",
            "Metformin 500–2000 mg/day (with meals)\nGlibenclamide 2.5–20 mg/day\nSitagliptin 100 mg OD\nEmpagliflozin 10–25 mg OD\nInsulin Glargine (basal) if HbA1c > 10%",
            "Monitor HbA1c every 3 months. Metformin contraindicated if eGFR < 30. Hypoglycaemia risk with sulfonylureas — educate patient. SGLT-2 inhibitors: risk of UTI, monitor renal function."
        ),
        (
            ['fever', 'pyrexia', 'high temperature', 'febrile'],
            "Fever / Pyrexia",
            "Antipyretics · NSAIDs",
            "Paracetamol 500–1000 mg every 6–8 h (max 4 g/day)\nIbuprofen 400 mg every 8 h (with food)\nNimesulide 100 mg BD (short-term, adults only)",
            "Do NOT exceed 4 g Paracetamol/day (hepatotoxic). Ibuprofen: avoid in renal impairment, peptic ulcer, last trimester pregnancy. Investigate cause of fever if > 3 days."
        ),
        (
            ['infection', 'bacterial', 'antibiotic', 'pneumonia', 'uti', 'urinary', 'sepsis', 'wound', 'cellulitis'],
            "Bacterial Infection",
            "Penicillins · Cephalosporins · Macrolides · Fluoroquinolones · Nitrofurantoin (UTI)",
            "Amoxicillin 500 mg TID × 5–7 days\nAmoxicillin-Clavulanate 625 mg BD × 7 days\nAzithromycin 500 mg OD × 5 days (atypicals)\nCiprofloxacin 500 mg BD × 7 days\nNitrofurantoin 100 mg BD × 5 days (uncomplicated UTI)",
            "Culture & sensitivity BEFORE starting antibiotics if possible. Always complete the full course. Check allergy history. Avoid fluoroquinolones in pregnancy and children. Reassess in 48–72 h."
        ),
        (
            ['pain', 'analgesic', 'inflammation', 'arthritis', 'joint pain', 'back pain', 'muscle pain'],
            "Pain / Inflammation",
            "NSAIDs · COX-2 Inhibitors · Simple Analgesics · Opioids (severe, specialist)",
            "Paracetamol 500–1000 mg TID (mild pain)\nIbuprofen 400–600 mg TID with food (moderate)\nDiclofenac 50 mg BD with PPI cover\nCelecoxib 100–200 mg BD (GI-sensitive patients)\nTramadol 50–100 mg every 6–8 h (moderate-severe)",
            "Give NSAIDs with PPI (Omeprazole 20 mg) to protect stomach. Avoid long-term NSAID use. Monitor renal function. Opioids only under specialist supervision. Physiotherapy for musculoskeletal pain."
        ),
        (
            ['asthma', 'bronchospasm', 'wheeze', 'copd', 'shortness of breath', 'breathless', 'respiratory'],
            "Asthma / COPD",
            "SABA (rescue) · LABA · Inhaled Corticosteroids (ICS) · Anticholinergics · Leukotriene Antagonists",
            "Salbutamol inhaler 100 mcg PRN (rescue)\nBudesonide inhaler 200–400 mcg BD (ICS, controller)\nFormoterol 6–12 mcg BD (LABA)\nTiotropium 18 mcg OD (COPD maintenance)\nMontelukast 10 mg OD (adjunct)",
            "Correct inhaler technique is critical — demonstrate to patient. Rinse mouth after ICS to prevent oral candidiasis. Avoid beta-blockers in asthma. Provide written Asthma Action Plan. Oxygen therapy if SpO₂ < 92%."
        ),
        (
            ['depression', 'anxiety', 'mental health', 'psychiatr', 'panic', 'stress', 'mood', 'insomnia', 'sleep'],
            "Depression / Anxiety / Mental Health",
            "SSRIs (first-line) · SNRIs · Benzodiazepines (short-term) · Tricyclics · Z-drugs (insomnia)",
            "Sertraline 50–200 mg/day (depression, anxiety)\nEscitalopram 10–20 mg/day\nFluoxetine 20–60 mg/day\nVenlafaxine 75–225 mg/day (SNRI)\nAlprazolam 0.25–0.5 mg TID (anxiety, short-term only)",
            "SSRIs take 2–4 weeks for full effect. Monitor for suicidal ideation in first weeks. Benzodiazepines: high dependence risk — limit to < 2–4 weeks. Refer for Cognitive Behavioural Therapy (CBT). Never stop antidepressants abruptly."
        ),
        (
            ['gastric', 'acid', 'ulcer', 'gerd', 'reflux', 'heartburn', 'stomach', 'acidity', 'peptic', 'gastritis'],
            "Gastric / Acid-Related Disorders",
            "Proton Pump Inhibitors (PPIs) · H2 Blockers · Antacids · Prokinetics",
            "Omeprazole 20–40 mg OD (30 min before breakfast)\nPantoprazole 40 mg OD\nRanitidine 150 mg BD\nAntacid suspension 10 mL TID after meals\nDomperidone 10 mg TID before meals (prokinetic)",
            "Take PPIs 30 min before meals for best effect. Long-term PPI use: risk of hypomagnesaemia, B12 deficiency, fractures. Test for H. pylori if peptic ulcer — triple therapy if positive. Lifestyle: avoid spicy food, caffeine, alcohol, late meals."
        ),
        (
            ['thyroid', 'hypothyroid', 'hyperthyroid', 'tsh', 'goitre'],
            "Thyroid Disorders",
            "Hypothyroidism: Levothyroxine · Hyperthyroidism: Thionamides · Beta-blockers (symptom relief)",
            "Levothyroxine 25–150 mcg OD (hypothyroid — fasting, 30 min before food)\nCarbimazole 5–40 mg/day (hyperthyroid)\nPropylthiouracil 100–300 mg/day (alternative)\nPropranolol 10–40 mg BD (symptom relief in hyperthyroid)",
            "Check TSH every 6–8 weeks when initiating/adjusting Levothyroxine. Start low in elderly and cardiac patients. Carbimazole: monitor CBC (agranulocytosis risk). Radioactive iodine or surgery for definitive hyperthyroid treatment."
        ),
        (
            ['malaria', 'dengue', 'typhoid', 'tropical', 'mosquito', 'plasmodium'],
            "Tropical Infections (Malaria / Dengue / Typhoid)",
            "Malaria: Artemisinin Combination Therapy · Dengue: Supportive · Typhoid: Fluoroquinolones/Cephalosporins",
            "Artemether-Lumefantrine (AL) BD × 3 days (uncomplicated malaria)\nChloroquine (P. vivax) + Primaquine (check G6PD first)\nCeftriaxone 1–2 g IV OD × 7–10 days (typhoid)\nParacetamol for fever in dengue (AVOID NSAIDs/Aspirin in dengue)",
            "Confirm malaria species with RDT/smear before treatment. Dengue: monitor platelet count daily — transfuse if < 10,000. AVOID aspirin/NSAIDs in dengue (bleeding risk). Typhoid: drug sensitivity testing recommended."
        ),
    ]

    for keywords, condition, drug_classes, examples, precautions in protocols:
        if any(kw in combined for kw in keywords):
            return (
                f"🩺 AI Drug Recommendation  ·  For Doctor Reference Only\n"
                f"{'━' * 48}\n\n"
                f"📋 CONDITION: {condition}\n"
                f"   Patient info: {disease or 'N/A'} | Symptoms: {symptoms or 'N/A'} | Age: {patient_age or 'Not provided'}\n\n"
                f"💊 RECOMMENDED DRUG CLASSES:\n   {drug_classes}\n\n"
                f"📌 COMMON EXAMPLES & DOSAGES:\n"
                + "\n".join(f"   • {line}" for line in examples.split("\n")) + "\n\n"
                f"⚠️  PRECAUTIONS & MONITORING:\n   {precautions}"
                f"{age_note}\n\n"
                f"{'━' * 48}\n"
                f"⚕️  Always verify with current clinical guidelines, check for drug interactions, and review the patient's complete medical history before prescribing."
            )

    return (
        f"🩺 AI Drug Recommendation  ·  For Doctor Reference Only\n"
        f"{'━' * 48}\n\n"
        f"📋 INPUT: Disease: {disease or 'Not specified'} | Symptoms: {symptoms or 'Not specified'} | Age: {patient_age or 'Not provided'}\n\n"
        f"No specific protocol found for this exact condition. General approach:\n\n"
        f"   1. Perform thorough clinical examination & history\n"
        f"   2. Order relevant investigations (CBC, LFT, RFT, imaging)\n"
        f"   3. Consult relevant specialist\n"
        f"   4. Refer to WHO Essential Medicines List / National Formulary\n"
        f"   5. Consider comorbidities & current medications (drug interactions)"
        f"{age_note}\n\n"
        f"{'━' * 48}\n"
        f"⚕️  Always verify with clinical guidelines before prescribing."
    )


@api_view(['POST'])
def ai_chatbot(request):
    """##POST {{ message: '...' }} — Hospital chatbot for patients."""
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'error': 'message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'reply': _hospital_chatbot(message)})


@api_view(['POST'])
def ai_drug_recommendation(request):
    """##POST { disease, symptoms, patient_age } — Drug recommendation for doctors."""
    disease = request.data.get('disease', '').strip()
    symptoms = request.data.get('symptoms', '').strip()
    patient_age = request.data.get('patient_age', '')
    if not disease and not symptoms:
        return Response({'error': 'Provide at least disease or symptoms.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'recommendation': _drug_recommendation(disease, symptoms, patient_age)})


# ── Doctor Self-Registration ──────────────────────────────────────────────────

@api_view(['POST'])
def doctor_register(request):
    """
    ##POST { name, specialization, consultation_fee, email, phone, registration_number, password }
    Creates a Doctor + DoctorProfile with status='pending'.
    Admin must approve before the doctor can log in.
    """
    from django.contrib.auth.hashers import make_password

    # Ensure name has capital first letters
    name = request.data.get('name', '').strip().title()
    specialization = request.data.get('specialization', '').strip()
    designation = request.data.get('designation', '').strip() or 'Consultant'
    email = request.data.get('email', '').strip().lower()
    phone = request.data.get('phone', '').strip()
    reg_number = request.data.get('registration_number', '').strip()
    fee = request.data.get('consultation_fee', 0)
    password = request.data.get('password', '').strip()

    if not all([name, specialization, email, password]):
        return Response({'error': 'name, specialization, email, and password are required.'}, status=400)

    if DoctorProfile.objects.filter(email__iexact=email).exists():
        return Response({'error': 'A doctor with this email already exists.'}, status=400)

    try:
        fee_val = float(fee)
    except (ValueError, TypeError):
        fee_val = 0.0

    doctor = Doctor.objects.create(name=name, specialization=specialization, designation=designation, consultation_fee=fee_val)
    profile = DoctorProfile.objects.create(
        doctor=doctor,
        email=email,
        phone=phone,
        registration_number=reg_number,
        password=make_password(password),
        status='pending',  # pending admin approval
    )
    return Response({
        'message': 'Registration submitted for admin approval.',
        'profile': DoctorProfileSerializer(profile).data,
    }, status=201)


# (dead code removed)


# ── Doctor Login ──────────────────────────────────────────────────────────────

@api_view(['POST'])
def doctor_login(request):
    """
    #POST { email, password }
    ####Returns doctor profile + Doctor record if approved.
    """
    from django.contrib.auth.hashers import check_password

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)

    try:
        profile = DoctorProfile.objects.select_related('doctor').get(email__iexact=email)
    except DoctorProfile.DoesNotExist:
        return Response({'error': 'Invalid email or password.'}, status=401)

    if not check_password(password, profile.password):
        return Response({'error': 'Invalid email or password.'}, status=401)

    if profile.status == 'pending':
        return Response({'error': 'Your account is pending approval by the admin. Please wait.'}, status=403)

    if profile.status == 'rejected':
        return Response({'error': 'Your registration was rejected. Please contact the hospital administration.'}, status=403)

    return Response({
        'profile': DoctorProfileSerializer(profile).data,
        'doctor': DoctorSerializer(profile.doctor).data,
    }, status=200)


# ── Admin Login ───────────────────────────────────────────────────────────────

@api_view(['POST'])
def admin_login(request):
    """
    POST { username, password }
    Verifies admin credentials (Django superuser/staff, or fallback) and returns a success session.
    """
    from django.contrib.auth import authenticate
    
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    
    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=400)
        
    user = authenticate(username=username, password=password)
    
    if user is not None and (user.is_staff or user.is_superuser):
        return Response({
            'message': 'Admin login successful.',
            'username': user.username,
            'email': user.email,
            'is_admin': True
        }, status=200)
        
    if username == 'admin' and password == 'admin123':
        return Response({
            'message': 'Admin login successful (development fallback).',
            'username': 'admin',
            'email': 'admin@hospital.com',
            'is_admin': True
        }, status=200)
        
    return Response({'error': 'Invalid admin credentials or unauthorized access.'}, status=401)


# ── Admin: List Pending Doctors ───────────────────────────────────────────────

@api_view(['GET'])
def pending_doctors(request):
    """GET — returns all DoctorProfiles (optionally filter by ?status=pending)."""
    status_filter = request.query_params.get('status', None)
    qs = DoctorProfile.objects.select_related('doctor').order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)
    return Response(DoctorProfileSerializer(qs, many=True).data)


# ── Admin: Approve / Reject Doctor ───────────────────────────────────────────

@api_view(['PATCH'])
def approve_doctor(request, profile_id):
    """
    ##PATCH { action: 'approve' | 'reject' }
    ##Updates the DoctorProfile status.
    """
    try:
        profile = DoctorProfile.objects.select_related('doctor').get(pk=profile_id)
    except DoctorProfile.DoesNotExist:
        return Response({'error': 'Doctor profile not found.'}, status=404)

    action = request.data.get('action', '').strip()
    if action == 'approve':
        profile.status = 'approved'
    elif action == 'reject':
        profile.status = 'rejected'
    else:
        return Response({'error': "action must be 'approve' or 'reject'."}, status=400)

    profile.save()
    return Response(DoctorProfileSerializer(profile).data)


# ── Lab: Send Report to Patient & Doctor ─────────────────────────────────────

@api_view(['PATCH'])
def send_lab_report(request, test_id):
    """
    ##PATCH — marks report_sent=True on a DiagnosticTest (must have a result already).
    ##The test is then visible as 'report sent' in both the patient and doctor dashboards.
    """
    try:
        test = DiagnosticTest.objects.get(pk=test_id)
    except DiagnosticTest.DoesNotExist:
        return Response({'error': 'Diagnostic test not found.'}, status=404)

    if not test.result.strip():
        return Response({'error': 'Cannot send report: result field is empty.'}, status=400)

    test.report_sent = True
    test.status = 'completed'
    test.save()
    return Response(DiagnosticTestSerializer(test).data)

# ── Admin: Delete Doctor ──────────────────────────────────────────────────────

@api_view(['DELETE'])
def delete_doctor(request, doctor_id):
    """
    DELETE /api/delete-doctor/<doctor_id>/
    Removes the Doctor record (and cascades to DoctorProfile, Appointments, etc.)
    """
    try:
        doctor = Doctor.objects.get(pk=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found.'}, status=404)

    doctor_name = doctor.name
    doctor.delete()
    return Response({'message': f'Dr. {doctor_name} has been removed successfully.'}, status=200)


# ── Admin: Set Doctor Credentials ─────────────────────────────────────────────

@api_view(['POST'])
def set_doctor_credentials(request):
    """
    POST { doctor_id, email, password, phone, registration_number }
    Creates or updates the DoctorProfile for the specified doctor, enabling them to login.
    """
    from django.contrib.auth.hashers import make_password

    doctor_id = request.data.get('doctor_id')
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    phone = request.data.get('phone', '').strip() or None
    reg_number = request.data.get('registration_number', '').strip() or None

    if not all([doctor_id, email]):
        return Response({'error': 'doctor_id and email are required.'}, status=400)

    try:
        doctor = Doctor.objects.get(pk=doctor_id)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found.'}, status=404)

    # Check if this email is already taken by another doctor profile
    existing = DoctorProfile.objects.filter(email__iexact=email).exclude(doctor=doctor).first()
    if existing:
        return Response({'error': 'A doctor profile with this email already exists.'}, status=400)

    profile, created = DoctorProfile.objects.get_or_create(
        doctor=doctor,
        defaults={
            'email': email,
            'password': make_password(password) if password else make_password('hms12345'),
            'phone': phone,
            'registration_number': reg_number,
            'status': 'approved',  # direct admin creation/update is auto-approved
        }
    )

    if not created:
        profile.email = email
        if password:
            profile.password = make_password(password)
        if phone:
            profile.phone = phone
        if reg_number:
            profile.registration_number = reg_number
        profile.status = 'approved'  # ensure status is approved
        profile.save()

    return Response({
        'message': 'Doctor credentials set successfully.',
        'profile': DoctorProfileSerializer(profile).data
    }, status=200)


from django.http import HttpResponse

def home(request):
    return HttpResponse("Welcome to the Hospital Management System!")

