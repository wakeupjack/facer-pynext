import os
import json
import face_recognition
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
import datetime

app = Flask(__name__)
CORS(app)  # Izinkan Cross-Origin Resource Sharing

UPLOAD_FOLDER = 'uploads'
KNOWN_FACES_FILE = 'known_faces.json'
USERS_FILE = 'users.json'  # File baru untuk menyimpan data user
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Function untuk memuat data known faces
def load_known_faces():
    if os.path.exists(KNOWN_FACES_FILE) and os.path.getsize(KNOWN_FACES_FILE) > 0:
        with open(KNOWN_FACES_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return [] # File korup atau bukan JSON valid
    return []

# Function untuk menyimpan data known faces
def save_known_faces(data):
    with open(KNOWN_FACES_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Function untuk memuat data users
def load_users():
    if os.path.exists(USERS_FILE) and os.path.getsize(USERS_FILE) > 0:
        with open(USERS_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return [] # File korup atau bukan JSON valid
    return []

# Function untuk menyimpan data users
def save_users(data):
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Function untuk mencari user berdasarkan name
def find_user_by_name(users, name):
    for user in users:
        if user['name'] == name:
            return user
    return None

# Function untuk memperbarui status faceRegistered user
def update_user_face_registered(users, name, status=True):
    for user in users:
        if user['name'] == name:
            user['hasFaceRegistered'] = status
            user['lastActive'] = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return True
    return False

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

    # Muat data users
    users = load_users()
    
    # Pastikan user ada di database
    user = find_user_by_name(users, name)
    if not user:
        return jsonify({"error": f"User '{name}' not found. Please add user first."}), 404

    # Cek apakah nama sudah terdaftar di known_faces
    known_faces_data = load_known_faces()
    for i, face_data in enumerate(known_faces_data):
        if face_data['name'] == name:
            # Jika update, hapus data lama
            known_faces_data.pop(i)
            break

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
        
        # Update user status hasFaceRegistered menjadi True
        update_user_face_registered(users, name)
        save_users(users)

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
                
                # Update lastActive user
                users = load_users()
                update_user_face_registered(users, name)
                save_users(users)
                
                return jsonify({"message": f"Welcome, {name}!", "name": name}), 200
            else:
                 print(f"No match, closest distance: {face_distances[best_match_index]}")


        return jsonify({"message": "Face not recognized.", "name": "Unknown"}), 200

    except Exception as e:
        print(f"Error during attendance: {e}")
        return jsonify({"error": "Could not process image"}), 500

# ============= USER MANAGEMENT API =============

# Get all users (with face registration status)
@app.route('/api/users', methods=['GET'])
def get_users():
    # Load users data
    users = load_users()
    
    # Jika tidak ada user, inisialisasi file user dengan admin user
    if not users:
        admin_user = {
            "id": 1,
            "name": "Admin",
            "role": "Admin",
            "hasFaceRegistered": True,
            "lastActive": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        users = [admin_user]
        save_users(users)
    
    return jsonify(users), 200

# Add user (without face registration)
@app.route('/api/users', methods=['POST'])
def add_user():
    # Check if request has JSON data
    if not request.is_json:
        return jsonify({"error": "Missing JSON data"}), 400
    
    data = request.get_json()
    
    # Validate name
    if 'name' not in data or not data['name'] or len(data['name'].strip()) < 2:
        return jsonify({"error": "Valid name is required (at least 2 characters)"}), 400
    
    name = data['name'].strip()
    
    # Load users data
    users = load_users()
    
    # Check if name already exists
    if any(user['name'] == name for user in users):
        return jsonify({"error": f"User with name '{name}' already exists"}), 400
    
    # Generate a user ID
    user_id = max([user['id'] for user in users], default=0) + 1
    
    # Create new user
    new_user = {
        "id": user_id,
        "name": name,
        "role": "User",
        "hasFaceRegistered": False,
        "lastActive": "Never"
    }
    
    # Add user to list and save
    users.append(new_user)
    save_users(users)
    
    return jsonify({
        "message": f"User {name} added successfully",
        "user": new_user
    }), 201

# Delete a user and their face data
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # Load users data
    users = load_users()
    
    # Find the user
    user_to_delete = None
    for i, user in enumerate(users):
        if user['id'] == user_id:
            user_to_delete = user
            del users[i]
            break
    
    if not user_to_delete:
        return jsonify({"error": f"User with ID {user_id} not found"}), 404
    
    # Save updated users list
    save_users(users)
    
    # If user has face data, remove it as well
    if user_to_delete.get('hasFaceRegistered', False):
        known_faces = load_known_faces()
        for i, face in enumerate(known_faces):
            if face['name'] == user_to_delete['name']:
                del known_faces[i]
                save_known_faces(known_faces)
                break
    
    return jsonify({
        "message": f"User {user_to_delete['name']} deleted successfully"
    }), 200

# Get statistics about users and faces
@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Load data
    users = load_users()
    known_faces = load_known_faces()
    
    # Calculate statistics
    total_users = len(users)
    faces_registered = len([u for u in users if u.get('hasFaceRegistered', False)])
    
    stats = {
        "totalUsers": total_users,
        "facesRegistered": faces_registered,
        "registrationRate": round(faces_registered / total_users * 100) if total_users > 0 else 0,
        "lastUpdated": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    return jsonify(stats), 200

# ================= END OF USER MANAGEMENT API =================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)