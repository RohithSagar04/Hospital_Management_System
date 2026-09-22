#!/usr/bin/env python
"""
Test script for Hospital Management System API endpoints
"""
import requests
import json
from datetime import datetime

BASE_URL = 'http://127.0.0.1:8000/api'

def test_patient_registration():
    """Test patient registration endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Patient Registration")
    print("="*60)
    
    patient_data = {
        'name': 'Test Patient',
        'age': 30,
        'gender': 'Male',
        'phone': '9876543210',
        'address': 'Test Address',
        'patient_id': f'PT-{int(datetime.now().timestamp()) % 1000000:06d}',
        'token_number': 1234,
        'password': 'testpass123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/patients/', json=patient_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            return response.json()
        else:
            print(f"❌ Registration failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_patient_login(patient_id, password):
    """Test patient login endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Patient Login")
    print("="*60)
    
    login_data = {
        'patient_id': patient_id,
        'password': password
    }
    
    try:
        response = requests.post(f'{BASE_URL}/patient-login/', json=login_data)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify password is NOT in response
        if 'password' in data:
            print("⚠️  WARNING: Password field found in response (should be hidden)")
        else:
            print("✅ Password correctly excluded from response")
            
        if response.status_code == 200:
            return data
        else:
            print(f"❌ Login failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_doctor_registration():
    """Test doctor registration endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Doctor Registration")
    print("="*60)
    
    doctor_data = {
        'name': 'Dr. Test Doctor',
        'specialization': 'General Medicine',
        'designation': 'Consultant',
        'consultation_fee': 500.00,
        'email': f'doctor-{int(datetime.now().timestamp())}@hospital.test',
        'phone': '9876543210',
        'registration_number': 'REG123456',
        'password': 'docpass123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/doctor-register/', json=doctor_data)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check if status is 'pending'
        if response.status_code == 201:
            profile = data.get('profile', {})
            if profile.get('status') == 'pending':
                print("✅ Doctor status correctly set to 'pending'")
            else:
                print(f"⚠️  Doctor status is '{profile.get('status')}' instead of 'pending'")
            return profile
        else:
            print(f"❌ Registration failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_doctor_login(email, password):
    """Test doctor login endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Doctor Login (before approval)")
    print("="*60)
    
    login_data = {
        'email': email,
        'password': password
    }
    
    try:
        response = requests.post(f'{BASE_URL}/doctor-login/', json=login_data)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 403 and 'pending approval' in str(data):
            print("✅ Correctly rejected pending doctor with appropriate message")
        elif response.status_code != 200:
            print(f"✅ Login correctly denied with status {response.status_code}")
        else:
            print("⚠️  Doctor was able to login while pending (should require approval)")
            
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("\n" + "🏥 Hospital Management System - API Endpoint Tests")
    print("="*60)
    
    # Test 1: Register a patient
    patient = test_patient_registration()
    
    if patient:
        # Test 2: Login with the registered patient
        logged_in = test_patient_login(patient['patient_id'], 'testpass123')
    
    # Test 3: Register a doctor
    doctor = test_doctor_registration()
    
    if doctor:
        # Test 4: Try to login as doctor (should fail due to pending status)
        test_doctor_login(doctor['email'], 'docpass123')
    
    print("\n" + "="*60)
    print("✅ Tests completed!")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
