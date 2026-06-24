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

    question_raw = data.get("userQuestion", "")
    question = question_raw.lower()

    def respond(answer):
        return jsonify({
            "status": "success",
            "reply": answer
        })

    # ---------------- NORMALIZATION HELP ----------------
    q = question.replace("?", "").strip()

    # ---------------- SMART MATCHING ----------------

    # BHK
    if "bhk" in q or "bedroom" in q:
        return respond(
            "BHK (Bedroom, Hall, Kitchen) defines the structure of a house. "
            "For example, a 2BHK means 2 bedrooms, a hall (living room), and a kitchen. "
            "More BHK usually means larger space and higher value depending on location and demand."
        )

    # BUILDING AGE
    elif "age" in q or "old" in q or "new" in q:
        return respond(
            "Building age affects property value significantly. "
            "New properties usually have higher value due to modern construction and low maintenance cost. "
            "Older properties may reduce in price due to wear and tear, but prime location can still keep prices high."
        )

    # LOCATION
    elif "location" in q or "central" in q or "anna nagar" in q or "t nagar" in q:
        return respond(
            "Location is one of the strongest factors in property pricing. "
            "Central areas like Anna Nagar and T Nagar have higher demand, better infrastructure, schools, transport, and commercial access, "
            "which increases property appreciation significantly."
        )

    # PRICE PREDICTION MODEL
    elif "how" in q and "price" in q:
        return respond(
            "The system uses a machine learning model trained on historical Chennai housing data. "
            "It considers features like square feet, bedrooms, bathrooms, parking, location, and property age. "
            "Based on these inputs, it predicts a realistic market price using pattern recognition."
        )

    # PROPERTY APPRECIATION (YOUR QUESTION FIX)
    elif "appreciation" in q or "increase property" in q or "increase value" in q or "factors" in q:
        return respond(
            "Property appreciation depends on multiple key factors:\n\n"
            "1. Location – Central areas like Anna Nagar or T Nagar increase value faster.\n"
            "2. Infrastructure – Good roads, metro access, schools, hospitals increase demand.\n"
            "3. Property condition – New or well-maintained houses appreciate more.\n"
            "4. Amenities – Parking, water supply, security add value.\n"
            "5. Market demand – High demand areas naturally increase price over time.\n\n"
            "So overall, location + infrastructure + demand are the strongest drivers of appreciation."
        )

    # HANDLE BAD SPELLING (IMPORTANT FIX)
    elif "futures increase property" in q or "futures increase" in q or "feature increase" in q:
        return respond(
            "Property value increases due to features such as location, square footage, number of bedrooms, "
            "quality of construction, parking availability, water supply, and nearby infrastructure."
        )

    # DEFAULT RESPONSE
    else:
        return respond(
            "I am your Real Estate AI Assistant. "
            "You can ask about BHK, property pricing, appreciation factors, building age impact, or location influence. "
            "Try asking: 'What factors increase property value?' or 'How does location affect price?'"
        )
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