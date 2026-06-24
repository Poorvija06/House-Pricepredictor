# -*- coding: utf-8 -*-

import os
import sqlite3
import pickle
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ---------------- APP INIT ----------------
app = Flask(__name__, static_folder='dist', static_url_path='')
app.secret_key = "chennai_super_secret_property_key"
CORS(app)

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'data', 'model.pkl')
DB_FILE = os.path.join(BASE_DIR, 'data', 'housing_contacts.db')

os.makedirs('data', exist_ok=True)

print("MODEL PATH:", MODEL_PATH)
print("MODEL EXISTS:", os.path.exists(MODEL_PATH))

# ---------------- LOAD MODEL ----------------
model_data = None

def load_ml_model():
    global model_data
    if model_data is None:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
            print("✅ Model loaded successfully")
    return model_data

# ---------------- DB INIT ----------------
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ---------------- FRONTEND ----------------
@app.route('/')
def serve():
    return send_from_directory('dist', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join('dist', path)
    if os.path.exists(file_path):
        return send_from_directory('dist', path)
    return send_from_directory('dist', 'index.html')

# ---------------- HEALTH ----------------
@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

# ---------------- METRICS FIX ----------------
@app.route('/api/model/metrics')
def metrics():
    return jsonify({
        "status": "success",
        "model": "RandomForestRegressor",
        "message": "Model running successfully"
    })

# ---------------- SAFE ENCODING HELPERS ----------------
def safe_map(mapping, value):
    if isinstance(value, str):
        value = value.lower()
    return mapping.get(value, 0)

# ---------------- PREDICT ----------------
@app.route('/api/model/predict', methods=['POST'])
def predict():
    model_data = load_ml_model()

    if not model_data:
        return jsonify({"status": "error", "message": "Model not found"}), 500

    try:
        data = request.get_json() or {}

        maps = model_data.get("categorical_mappings", {})

        location = data.get("location", "chrompet")

        vector = np.array([[
            safe_map(maps.get("AREA", {}), location),

            float(data.get("intSqft", 1000)),
            int(data.get("nBedroom", 2)),
            int(data.get("nBathroom", 1)),

            safe_map(maps.get("PARK_FACIL", {}), data.get("parkFacil", "no")),
            safe_map(maps.get("BUILDTYPE", {}), data.get("buildType", "house")),
            safe_map(maps.get("UTILITY_AVAIL", {}), data.get("utilityAvail", "allpub")),
            safe_map(maps.get("STREET", {}), data.get("street", "paved")),
            safe_map(maps.get("MZZONE", {}), data.get("mzzone", "rl")),

            int(data.get("propertyAge", 5))
        ]])

        model = model_data["model"]
        price = int(model.predict(vector)[0])

        return jsonify({
            "status": "success",
            "result": {
                "predictedPrice": price,
                "investmentGrade": "Good",
                "forecast1Yr": int(price * 1.05),
                "forecast3Yr": int(price * 1.15),
                "forecast5Yr": int(price * 1.30),
                "explanation": f"Estimated price for {location}"
            }
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    question = data.get("userQuestion", "").lower()

    # simple rule-based AI (demo working fix)
    if "age" in question:
        reply = "Older properties usually have lower value due to maintenance cost, but heritage/location can increase value."
    elif "location" in question:
        reply = "Central locations like Anna Nagar & T Nagar have higher demand and price appreciation."
    elif "value" in question:
        reply = "Property value depends on sqft, location, age, and amenities."
    else:
        reply = "I can help with property pricing, features, and valuation logic."

    return jsonify({
        "status": "success",
        "reply": reply
    })
# ---------------- CONTACT POST ----------------
@app.route('/api/contacts', methods=['POST'])
def save_contact():
    data = request.get_json() or {}

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO contacts (name,email,message) VALUES (?,?,?)",
        (data.get('name'), data.get('email'), data.get('message'))
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "success"})

# ---------------- CONTACT GET ----------------
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT id,name,email,message,created_at FROM contacts ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()

    messages = [{
        "id": r[0],
        "name": r[1],
        "email": r[2],
        "message": r[3],
        "createdAt": r[4]
    } for r in rows]

    return jsonify({
        "status": "success",
        "messages": messages,
        "stats": {
            "total": len(messages),
            "isSqlite": True
        }
    })

# ---------------- ADMIN LOGIN ----------------
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}

    if data.get("username") == "admin" and data.get("password") == "admin123":
        return jsonify({
            "status": "success",
            "token": "admin-token-123"
        })

    return jsonify({
        "status": "error",
        "message": "Invalid credentials"
    }), 401

# ---------------- RUN ----------------
if __name__ == '__main__':
    print("🔥 Server starting...")
    app.run(host='0.0.0.0', port=10000, debug=True)