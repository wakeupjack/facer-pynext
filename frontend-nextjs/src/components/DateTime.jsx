// src/components/DateTime.jsx
import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material'; // Tambahkan impor Box di sini

export default function DateTime() {
  const [dateTime, setDateTime] = useState('');
  const [user, setUser] = useState('wakeupjack'); // Bisa diambil dari sistem autentikasi
  
  useEffect(() => {
    // Format waktu: YYYY-MM-DD HH:MM:SS
    const updateDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      setDateTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
      <Typography variant="body2">
        Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {dateTime}
      </Typography>
      <Typography variant="body2">
        Current User's Login: {user}
      </Typography>
    </Box>
  );
}