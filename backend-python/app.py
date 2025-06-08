import os
import json
import face_recognition
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
import datetime
import csv
import calendar

app = Flask(__name__)
CORS(app)  # Izinkan Cross-Origin Resource Sharing

UPLOAD_FOLDER = 'uploads'
KNOWN_FACES_FILE = 'known_faces.json'
USERS_FILE = 'users.json'
ATTENDANCE_FILE = 'attendance.json'  # File baru untuk menyimpan data attendance
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

# Function untuk memuat data attendance
def load_attendance():
    if os.path.exists(ATTENDANCE_FILE) and os.path.getsize(ATTENDANCE_FILE) > 0:
        with open(ATTENDANCE_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return [] # File korup atau bukan JSON valid
    return []

# Function untuk menyimpan data attendance
def save_attendance(data):
    with open(ATTENDANCE_FILE, 'w') as f:
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

# Function untuk mendapatkan hari ini dalam string format
def get_today_str():
    return datetime.datetime.now().strftime("%Y-%m-%d")

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

    # Cek apakah ini checkin atau checkout berdasarkan parameter
    attendance_type = request.form.get('type', 'check_in')  # Default to check_in
    
    if attendance_type not in ['check_in', 'check_out']:
        return jsonify({"error": "Invalid attendance type. Must be check_in or check_out"}), 400

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
                
                # Record attendance
                attendances = load_attendance()
                today = get_today_str()
                now = datetime.datetime.now().strftime("%H:%M:%S")
                
                # Find if user already has attendance today
                user_attendance = None
                for att in attendances:
                    if att['name'] == name and att['date'] == today:
                        user_attendance = att
                        break
                
                if user_attendance:
                    # Update existing attendance record
                    if attendance_type == 'check_in':
                        # Only update check_in if it doesn't exist or if admin is forcing an update
                        if not user_attendance.get('check_in') or request.form.get('force') == 'true':
                            user_attendance['check_in'] = now
                            user_attendance['check_in_verified'] = True
                    else:  # check_out
                        user_attendance['check_out'] = now
                        user_attendance['check_out_verified'] = True
                        
                        # Calculate work hours if both check_in and check_out exist
                        if user_attendance.get('check_in'):
                            check_in_time = datetime.datetime.strptime(user_attendance['check_in'], "%H:%M:%S")
                            check_out_time = datetime.datetime.strptime(now, "%H:%M:%S")
                            # Calculate duration in minutes
                            duration = (check_out_time - check_in_time).total_seconds() / 60
                            user_attendance['duration_minutes'] = duration
                else:
                    # Create new attendance record
                    new_attendance = {
                        "id": len(attendances) + 1,
                        "name": name,
                        "date": today,
                        "status": "present"
                    }
                    
                    if attendance_type == 'check_in':
                        new_attendance['check_in'] = now
                        new_attendance['check_in_verified'] = True
                    else:  # check_out without check_in (unusual case)
                        new_attendance['check_out'] = now
                        new_attendance['check_out_verified'] = True
                        new_attendance['check_in'] = "00:00:00"  # Default value for missing check_in
                        new_attendance['check_in_verified'] = False
                        new_attendance['status'] = "incomplete"
                        
                    attendances.append(new_attendance)
                
                save_attendance(attendances)
                
                message_type = "check-in" if attendance_type == 'check_in' else "check-out"
                return jsonify({
                    "message": f"Welcome, {name}! Your {message_type} has been recorded.", 
                    "name": name,
                    "time": now,
                    "type": attendance_type,
                    "success": True
                }), 200
            else:
                 print(f"No match, closest distance: {face_distances[best_match_index]}")


        return jsonify({"message": "Face not recognized.", "name": "Unknown", "success": False}), 200

    except Exception as e:
        print(f"Error during attendance: {e}")
        return jsonify({"error": "Could not process image", "success": False}), 500

# API untuk mendapatkan data attendance
@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    attendances = load_attendance()
    
    # Filter parameters
    name = request.args.get('name')
    date = request.args.get('date')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    filtered_attendances = attendances.copy()
    
    # Apply filters
    if name:
        filtered_attendances = [att for att in filtered_attendances if name.lower() in att['name'].lower()]
        
    if date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] == date]
        
    if start_date and end_date:
        filtered_attendances = [att for att in filtered_attendances if start_date <= att['date'] <= end_date]
    elif start_date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] >= start_date]
    elif end_date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] <= end_date]
        
    if status:
        filtered_attendances = [att for att in filtered_attendances if att.get('status', '') == status]
    
    return jsonify(filtered_attendances), 200

# API untuk mengekspor data attendance ke CSV
@app.route('/api/attendance/export', methods=['GET'])
def export_attendance():
    attendances = load_attendance()
    
    # Filter parameters (sama dengan get_attendance)
    name = request.args.get('name')
    date = request.args.get('date')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    filtered_attendances = attendances.copy()
    
    # Apply filters
    if name:
        filtered_attendances = [att for att in filtered_attendances if name.lower() in att['name'].lower()]
        
    if date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] == date]
        
    if start_date and end_date:
        filtered_attendances = [att for att in filtered_attendances if start_date <= att['date'] <= end_date]
    elif start_date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] >= start_date]
    elif end_date:
        filtered_attendances = [att for att in filtered_attendances if att['date'] <= end_date]
        
    if status:
        filtered_attendances = [att for att in filtered_attendances if att.get('status', '') == status]
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['ID', 'Name', 'Date', 'Check-In', 'Check-In Verified', 
                    'Check-Out', 'Check-Out Verified', 'Duration (Minutes)', 'Status'])
    
    # Write data
    for att in filtered_attendances:
        writer.writerow([
            att.get('id', ''),
            att.get('name', ''),
            att.get('date', ''),
            att.get('check_in', ''),
            att.get('check_in_verified', ''),
            att.get('check_out', ''),
            att.get('check_out_verified', ''),
            att.get('duration_minutes', ''),
            att.get('status', '')
        ])
    
    # Prepare response
    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8'))
    mem.seek(0)
    output.close()
    
    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'attendance_report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

# API untuk mendapatkan ringkasan attendance
@app.route('/api/attendance/summary', methods=['GET'])
def get_attendance_summary():
    attendances = load_attendance()
    users = load_users()
    
    # Get month and year from query params, default to current month
    year = int(request.args.get('year', datetime.datetime.now().year))
    month = int(request.args.get('month', datetime.datetime.now().month))
    
    # Get the number of days in the month
    _, days_in_month = calendar.monthrange(year, month)
    
    # Prepare month dates
    month_str = f"{year:04d}-{month:02d}"
    
    # Prepare summary data
    summary = {
        "total_users": len([u for u in users if u['role'] != 'Admin']),
        "total_days": days_in_month,
        "month": month_str,
        "present_count": 0,
        "absent_count": 0,
        "late_count": 0,
        "incomplete_count": 0,
        "users_summary": [],
        "daily_summary": []
    }
    
    # Process user attendance
    user_names = [u['name'] for u in users if u['role'] != 'Admin']
    
    for user_name in user_names:
        user_summary = {
            "name": user_name,
            "present_days": 0,
            "absent_days": days_in_month,  # Default all days to absent
            "late_days": 0,
            "incomplete_days": 0,
            "avg_duration_minutes": 0,
            "total_duration_minutes": 0
        }
        
        # Get user's attendances for the month
        user_attendances = [att for att in attendances 
                           if att['name'] == user_name and att['date'].startswith(month_str)]
        
        if user_attendances:
            # Count present days (reduce absent days)
            user_summary["present_days"] = len(user_attendances)
            user_summary["absent_days"] = days_in_month - user_summary["present_days"]
            
            # Count late and incomplete days
            for att in user_attendances:
                if att.get('status') == 'late':
                    user_summary["late_days"] += 1
                elif att.get('status') == 'incomplete':
                    user_summary["incomplete_days"] += 1
                
                # Calculate total duration
                if att.get('duration_minutes') is not None:
                    user_summary["total_duration_minutes"] += att.get('duration_minutes', 0)
            
            # Calculate average duration
            if user_summary["present_days"] > 0:
                user_summary["avg_duration_minutes"] = round(user_summary["total_duration_minutes"] / user_summary["present_days"], 2)
        
        summary["users_summary"].append(user_summary)
    
    # Calculate daily summary for the month
    for day in range(1, days_in_month + 1):
        date_str = f"{month_str}-{day:02d}"
        
        day_summary = {
            "date": date_str,
            "present_count": 0,
            "absent_count": len(user_names),  # Default all users to absent
            "late_count": 0,
            "incomplete_count": 0
        }
        
        # Get attendances for this day
        day_attendances = [att for att in attendances if att['date'] == date_str]
        
        if day_attendances:
            day_summary["present_count"] = len(day_attendances)
            day_summary["absent_count"] = len(user_names) - day_summary["present_count"]
            
            # Count late and incomplete
            for att in day_attendances:
                if att.get('status') == 'late':
                    day_summary["late_count"] += 1
                elif att.get('status') == 'incomplete':
                    day_summary["incomplete_count"] += 1
        
        summary["daily_summary"].append(day_summary)
    
    # Calculate overall summary
    all_month_attendances = [att for att in attendances if att['date'].startswith(month_str)]
    summary["present_count"] = len(all_month_attendances)
    summary["absent_count"] = (days_in_month * len(user_names)) - summary["present_count"]
    summary["late_count"] = len([att for att in all_month_attendances if att.get('status') == 'late'])
    summary["incomplete_count"] = len([att for att in all_month_attendances if att.get('status') == 'incomplete'])
    
    return jsonify(summary), 200

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