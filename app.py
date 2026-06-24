# -*- coding: utf-8 -*-
"""
AI-Based House Price Prediction and Future Value Forecasting System
Flask Backend Application Server
"""

import os
import sqlite3
import pickle
import numpy as np
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
app = Flask(__name__)
app.secret_key = 'chennai_super_secret_property_key'

# Config
DB_FILE = os.path.join('data', 'housing_contacts.db')
MODEL_PATH = os.path.join('data', 'model.pkl')

# Ensure directories exist
os.makedirs('data', exist_ok=True)

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Load Python Model (pkl) helper
def load_ml_model():
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print("Failed to load pickle model:", e)
    return None

@app.route('/')
def home():
    return "<h1>Chennai AI House Forecast System Running Successfully</h1><p>Please launch the full-stack interactive client view inside the preview iframe.</p>"

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    model_data = load_ml_model()
    
    if not model_data:
        return jsonify({
            'status': 'error', 
            'message': 'Model pkl file not found. Please run train_model.py first.'
        })

    try:
        # Extract features
        area = data.get('area', 'chrompet').lower()
        int_sqft = float(data.get('intSqft', 1000))
        n_bedroom = int(data.get('nBedroom', 2))
        n_bathroom = int(data.get('nBathroom', 1))
        park_facil = data.get('parkFacil', 'No').lower()
        build_type = data.get('buildType', 'house').lower()
        utility_avail = data.get('utilityAvail', 'allpub').lower()
        street = data.get('street', 'paved').lower()
        mzzone = data.get('mzzone', 'RL').upper()
        
        # Calculate Property Age
        build_year = int(data.get('buildYear', 2015))
        sale_year = int(data.get('saleYear', 2024))
        property_age = max(0, sale_year - build_year)

        # Map to label encoded indices
        maps = model_data['categorical_mappings']
        
        # Map values safely with defaults
        area_enc = maps['AREA'].get(area, 0)
        park_enc = maps['PARK_FACIL'].get(park_facil, 0)
        build_enc = maps['BUILDTYPE'].get(build_type, 0)
        util_enc = maps['UTILITY_AVAIL'].get(utility_avail, 0)
        street_enc = maps['STREET'].get(street, 0)
        mzzone_enc = maps['MZZONE'].get(mzzone.lower(), 0)

        # Form feature vector matches [AREA, INT_SQFT, N_BEDROOM, N_BATHROOM, PARK_FACIL, BUILDTYPE, UTILITY_AVAIL, STREET, MZZONE, PROPERTY_AGE]
        vector = np.array([[
            area_enc, int_sqft, n_bedroom, n_bathroom, park_enc, 
            build_enc, util_enc, street_enc, mzzone_enc, property_age
        ]])

        model = model_data['model']
        predicted_price = int(model.predict(vector)[0])

        # Growth factors based on localized profiles
        growth_rates = {
            'adyar': 0.075, 'chrompet': 0.055, 'karapakkam': 0.045, 
            'kk nagar': 0.060, 'anna nagar': 0.085, 't nagar': 0.090, 
            'velachery': 0.070
        }
        growth = growth_rates.get(area, 0.05)

        # Composing 1, 3, 5 year forecasts
        forecast_1yr = int(predicted_price * ((1 + growth) ** 1))
        forecast_3yr = int(predicted_price * ((1 + growth) ** 3))
        forecast_5yr = int(predicted_price * ((1 + growth) ** 5))

        # Grades
        if growth >= 0.08:
            grade = "Excellent" if property_age < 8 else "Good"
        elif growth >= 0.06:
            grade = "Good" if property_age < 15 else "Average"
        else:
            grade = "Poor" if property_age > 12 else "Average"

        return jsonify({
            'status': 'success',
            'result': {
                'predictedPrice': predicted_price,
                'forecast1Yr': forecast_1yr,
                'forecast3Yr': forecast_3yr,
                'forecast5Yr': forecast_5yr,
                'investmentGrade': grade,
                'explanation': f"The scikit-learn Random Forest model predicted a price of Rs. {predicted_price:,.2f} with a 5-year forecasted equity target of Rs. {forecast_5yr:,.2f}. Rated as '{grade}' based on {area.upper()} growth indices."
            }
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/contacts', methods=['POST'])
def save_contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    msg = data.get('message', '').strip()

    if not name or not email or not msg:
        return jsonify({'status': 'error', 'message': 'All form elements are mandatory.'}), 400

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', (name, email, msg))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Message written dynamically to SQLite!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
