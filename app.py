# -*- coding: utf-8 -*-

import os
import sqlite3
import pickle
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='dist', static_url_path='')
app.secret_key = os.environ.get("SECRET_KEY", "chennai_super_secret_property_key")

# Config
DB_FILE = os.path.join('data', 'housing_contacts.db')
MODEL_PATH = os.path.join('data', 'model.pkl')

os.makedirs('data', exist_ok=True)

# ---------------- DB INIT ----------------
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

# ---------------- MODEL ----------------
def load_ml_model():
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print("Model load error:", e)
    return None

# ---------------- FRONTEND ROUTES (IMPORTANT FIX) ----------------

import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='dist', static_url_path='')

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join(app.static_folder, path)

    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, 'index.html')

# ---------------- API ----------------

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    model_data = load_ml_model()

    if not model_data:
        return jsonify({'status': 'error', 'message': 'Model not found'})

    try:
        area = data.get('area', 'chrompet').lower()
        int_sqft = float(data.get('intSqft', 1000))
        n_bedroom = int(data.get('nBedroom', 2))
        n_bathroom = int(data.get('nBathroom', 1))
        park_facil = data.get('parkFacil', 'no').lower()
        build_type = data.get('buildType', 'house').lower()
        utility_avail = data.get('utilityAvail', 'allpub').lower()
        street = data.get('street', 'paved').lower()
        mzzone = data.get('mzzone', 'RL').upper()

        build_year = int(data.get('buildYear', 2015))
        sale_year = int(data.get('saleYear', 2024))
        property_age = max(0, sale_year - build_year)

        maps = model_data['categorical_mappings']

        area_enc = maps['AREA'].get(area, 0)
        park_enc = maps['PARK_FACIL'].get(park_facil, 0)
        build_enc = maps['BUILDTYPE'].get(build_type, 0)
        util_enc = maps['UTILITY_AVAIL'].get(utility_avail, 0)
        street_enc = maps['STREET'].get(street, 0)
        mzzone_enc = maps['MZZONE'].get(mzzone.lower(), 0)

        vector = np.array([[
            area_enc, int_sqft, n_bedroom, n_bathroom,
            park_enc, build_enc, util_enc, street_enc,
            mzzone_enc, property_age
        ]])

        model = model_data['model']
        predicted_price = int(model.predict(vector)[0])

        growth_rates = {
            'adyar': 0.075, 'chrompet': 0.055, 'karapakkam': 0.045,
            'kk nagar': 0.060, 'anna nagar': 0.085,
            't nagar': 0.090, 'velachery': 0.070
        }

        growth = growth_rates.get(area, 0.05)

        return jsonify({
            'status': 'success',
            'result': {
                'predictedPrice': predicted_price,
                'forecast1Yr': int(predicted_price * (1 + growth)),
                'forecast3Yr': int(predicted_price * (1 + growth) ** 3),
                'forecast5Yr': int(predicted_price * (1 + growth) ** 5),
                'investmentGrade': "Good",
                'explanation': f"Predicted price Rs.{predicted_price}"
            }
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# ---------------- CONTACT API ----------------

@app.route('/api/contacts', methods=['POST'])
def save_contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    msg = data.get('message', '').strip()

    if not name or not email or not msg:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
            (name, email, msg)
        )
        conn.commit()
        conn.close()

        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ---------------- RUN ----------------

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port, debug=False)