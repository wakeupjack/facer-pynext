// src/pages/index.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';
import { 
  Container, Typography, Button, Box, 
  Paper, Card, CardContent, Alert, Stack,
  CircularProgress
} from '@mui/material';
// ... import lainnya

export default function AttendancePage() {
  // ... state lainnya
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Gunakan useEffect untuk memperbarui tanggal & waktu hanya di sisi client
  useEffect(() => {
    // Set tanggal & waktu saat pertama kali komponen di-mount
    updateDateTime();
    
    // Opsional: Perbarui waktu setiap detik
    const interval = setInterval(updateDateTime, 1000);
    
    // Clean up interval saat komponen unmount
    return () => clearInterval(interval);
  }, []);

  // Fungsi untuk memperbarui tanggal dan waktu
  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    setCurrentTime(now.toLocaleTimeString('en-US'));
  };

  // ... kode lainnya

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* ... kode lainnya */}

        {/* Ganti bagian yang bermasalah */}
        {currentDate && currentTime && (
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
            {currentDate}
            <br />
            {currentTime}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}