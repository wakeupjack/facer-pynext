// pages/api/attendance.js
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error processing form data' });
    }

    try {
      const imageFile = files.image[0];

      if (!imageFile) {
        return res.status(400).json({ error: 'Image is required' });
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `attendance_${timestamp}${path.extname(imageFile.originalFilename)}`;
      const newPath = path.join(uploadDir, filename);

      // Move the file
      fs.copyFileSync(imageFile.filepath, newPath);

      // Here, you would call your face recognition API to identify the person
      // For demo purposes, let's simulate recognition with a random user

      // Get a random user who has face registered
      const users = await prisma.user.findMany({
        where: {
          hasFaceRegistered: true,
          status: 'Active'
        }
      });

      if (users.length === 0) {
        return res.status(404).json({ 
          error: 'No registered users found',
          message: 'No registered users found. Please register a face first.'
        });
      }

      const recognizedUser = users[Math.floor(Math.random() * users.length)];

      // Record attendance
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if already marked attendance today
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: recognizedUser.id,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // next day
          }
        }
      });

      if (existingAttendance) {
        return res.status(200).json({
          message: `Welcome back ${recognizedUser.name}! You've already marked your attendance today.`,
          name: recognizedUser.name
        });
      }

      // Create attendance record
      await prisma.attendance.create({
        data: {
          userId: recognizedUser.id,
          date: now,
          status: 'Present',
          imagePath: `/uploads/${filename}`
        }
      });

      // Update user's last active time
      await prisma.user.update({
        where: { id: recognizedUser.id },
        data: {
          lastActive: now
        }
      });

      return res.status(200).json({
        message: `Attendance marked successfully for ${recognizedUser.name}`,
        name: recognizedUser.name
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      return res.status(500).json({ error: 'Failed to process attendance' });
    }
  });
}