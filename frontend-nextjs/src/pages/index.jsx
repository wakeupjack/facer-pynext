// src/pages/index.jsx
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Container, Typography, Button, Box, 
  Paper, Card, CardContent, Alert, Stack,
  CircularProgress
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Import DateTime dengan opsi ssr: false
const DateTime = dynamic(() => import('../components/DateTime'), { ssr: false });

const videoConstraints = {
  width: 400,
  height: 400,
  facingMode: 'user',
};

export default function AttendancePage() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [recognizedName, setRecognizedName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setMessage('');
    setError('');
    setRecognizedName('');
  }

  const handleSubmit = async () => {
    if (!imgSrc) {
      setError('Please capture an image first.');
      return;
    }
    
    setError('');
    setMessage('Processing...');
    setIsProcessing(true);

    try {
      // Convert base64 to Blob
      const fetchRes = await fetch(imgSrc);
      const blob = await fetchRes.blob();
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${apiUrl}/api/attend`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Attendance processed');
        setRecognizedName(data.name || 'Unknown');
      } else {
        setError(data.error || 'Attendance process failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Face Attendance
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/admin/login" passHref>
            <Button 
              variant="outlined" 
              color="secondary"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ borderRadius: 2 }}
            >
              Admin Access
            </Button>
          </Link>
        </Box>
        
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            {!imgSrc ? (
              <Stack spacing={2}>
                <Box sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={videoConstraints.width}
                    height={videoConstraints.height}
                    videoConstraints={videoConstraints}
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={capture}
                  fullWidth
                  startIcon={<CameraAltIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Capture Photo
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                }}>
                  <img 
                    src={imgSrc} 
                    alt="Captured" 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: 'auto', 
                      maxWidth: videoConstraints.width,
                      maxHeight: videoConstraints.height,
                      margin: '0 auto'
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="outlined" 
                    onClick={retake}
                    fullWidth
                    startIcon={<FlipCameraIosIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Retake Photo
                  </Button>
                  <Button 
                    color="primary" 
                    variant="contained" 
                    onClick={handleSubmit}
                    fullWidth
                    disabled={isProcessing}
                    startIcon={isProcessing ? null : <HowToRegIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    {isProcessing ? (
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }}/>
                    ) : 'Check Attendance'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
        
        {message && message !== 'Processing...' && (
          <Alert 
            severity={recognizedName !== 'Unknown' ? 'success' : 'info'} 
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {message}
            {recognizedName && recognizedName !== 'Unknown' && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Recognized as: {recognizedName}
              </Typography>
            )}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <DateTime />
      </Paper>
    </Container>
  );
}