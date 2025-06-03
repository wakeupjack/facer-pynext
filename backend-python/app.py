import os
import json
import face_recognition
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
CORS(app)  # Izinkan Cross-Origin Resource Sharing

UPLOAD_FOLDER = 'uploads'
KNOWN_FACES_FILE = 'known_faces.json'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def load_known_faces():
    if os.path.exists(KNOWN_FACES_FILE) and os.path.getsize(KNOWN_FACES_FILE) > 0:
        with open(KNOWN_FACES_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return [] # File korup atau bukan JSON valid
    return []

def save_known_faces(data):
    with open(KNOWN_FACES_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/api/register', methods=['POST'])
def register_face():
    print("--- Request Diterima di /api/register ---") # Debug
    print("request.form:", request.form)             # Debug: Lihat semua data form
    print("request.files:", request.files)           # Debug: Lihat semua data file

    if 'image' not in request.files or 'name' not in request.form:
        print("Validasi Gagal: 'image' atau 'name' tidak ditemukan.") # Debug
        print(f"Apakah 'image' ada di request.files? {'image' in request.files}") # Debug
        print(f"Apakah 'name' ada di request.form? {'name' in request.form}")   # Debug
        return jsonify({"error": "Missing image or name"}), 400

    name = request.form['name']
    file_stream = request.files['image'].read()

    # Cek apakah nama sudah terdaftar
    known_faces_data = load_known_faces()
    for face_data in known_faces_data:
        if face_data['name'] == name:
            return jsonify({"error": f"Name '{name}' already registered."}), 400

    try:
        image = Image.open(io.BytesIO(file_stream))
        if image.mode != 'RGB':
            image = image.convert('RGB')

        image_np = np.array(image)
        face_locations = face_recognition.face_locations(image_np)

        if not face_locations:
            return jsonify({"error": "No face detected in the image"}), 400
        if len(face_locations) > 1:
            return jsonify({"error": "Multiple faces detected. Please upload an image with a single face."}), 400

        face_encoding = face_recognition.face_encodings(image_np, face_locations)[0]

        new_face_data = {"name": name, "encoding": face_encoding.tolist()}
        known_faces_data.append(new_face_data)
        save_known_faces(known_faces_data)

        return jsonify({"message": f"User {name} registered successfully"}), 201

    except Exception as e:
        print(f"Error during registration processing: {e}") # Debug error lebih detail
        return jsonify({"error": f"Could not process image: {str(e)}"}), 500

@app.route('/api/attend', methods=['POST'])
def attend_face():
    if 'image' not in request.files:
        return jsonify({"error": "Missing image"}), 400

    file_stream = request.files['image'].read()
    known_faces_data = load_known_faces()

    if not known_faces_data:
        return jsonify({"error": "No faces registered in the system."}), 400

    known_face_encodings = [np.array(face['encoding']) for face in known_faces_data]
    known_face_names = [face['name'] for face in known_faces_data]

    try:
        image = Image.open(io.BytesIO(file_stream))
        if image.mode != 'RGB':
            image = image.convert('RGB')

        image_np = np.array(image)
        face_locations = face_recognition.face_locations(image_np)
        
        if not face_locations:
            return jsonify({"message": "No face detected.", "name": "Unknown"}), 200
        
        # Hanya proses wajah pertama yang terdeteksi untuk absensi
        current_face_encoding = face_recognition.face_encodings(image_np, [face_locations[0]])[0]

        matches = face_recognition.compare_faces(known_face_encodings, current_face_encoding, tolerance=0.5) # Sesuaikan tolerance jika perlu
        name = "Unknown"
        
        face_distances = face_recognition.face_distance(known_face_encodings, current_face_encoding)
        if len(face_distances) > 0:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = known_face_names[best_match_index]
                # Di sini Anda bisa menambahkan logika untuk mencatat absensi ke database/file log
                print(f"Attendance recorded for: {name} at {face_distances[best_match_index]}")
                return jsonify({"message": f"Welcome, {name}!", "name": name}), 200
            else:
                 print(f"No match, closest distance: {face_distances[best_match_index]}")


        return jsonify({"message": "Face not recognized.", "name": "Unknown"}), 200

    except Exception as e:
        print(f"Error during attendance: {e}")
        return jsonify({"error": "Could not process image"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) # Gunakan port selain 3000 (default Next.js)