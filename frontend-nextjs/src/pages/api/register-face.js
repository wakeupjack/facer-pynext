// pages/api/register-face.js
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
const uploadDir = path.join(process.cwd(), 'public', 'faces');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure admin is authenticated
  // Implement your authentication check here

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error processing form data' });
    }

    try {
      const userId = parseInt(fields.userId[0]);
      const name = fields.name[0];
      const imageFile = files.image[0];

      if (!userId || !imageFile) {
        return res.status(400).json({ error: 'User ID and image are required' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `${userId}_${timestamp}${path.extname(imageFile.originalFilename)}`;
      const newPath = path.join(uploadDir, filename);

      // Move the file
      fs.copyFileSync(imageFile.filepath, newPath);

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          hasFaceRegistered: true,
          faceImagePath: `/faces/${filename}`, // Store relative path
          updatedAt: new Date()
        },
      });

      // Here you would call your face recognition API to train the model with the new face
      // For now, we'll just simulate success
      
      return res.status(200).json({
        message: `Face registered successfully for ${name}`,
      });
    } catch (error) {
      console.error('Error registering face:', error);
      return res.status(500).json({ error: 'Failed to register face' });
    }
  });
}