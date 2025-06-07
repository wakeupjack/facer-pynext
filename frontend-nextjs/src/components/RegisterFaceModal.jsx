import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  Photo as PhotoIcon,
  PhotoCamera as PhotoCameraIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export default function RegisterFaceModal({ open, onClose, user, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Start camera when modal is opened
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setError('');
      setSuccess(false);
      setCountdown(null);
    }
  }, [open]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
        setError('');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please allow camera access and try again.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  // Capture image with countdown
  const captureImage = () => {
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          processCaptureAndSubmit();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Process captured image and submit to server
  const processCaptureAndSubmit = () => {
    if (!streaming || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob and submit
    canvas.toBlob(blob => {
      submitFaceRegistration(blob);
    }, 'image/jpeg', 0.95);
  };
  
  // Submit face data to API
  const submitFaceRegistration = async (blob) => {
    if (!blob || !user) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('name', user.name);
      formData.append('image', blob, 'face.jpg');
      
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Call the success callback after a delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to register face');
      }
    } catch (err) {
      console.error('Error submitting face:', err);
      setError('An error occurred while trying to register face');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset camera
  const resetCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  return (
    <Dialog 
      open={open} 
      onClose={!submitting ? onClose : null}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">Register Face: {user?.name}</Typography>
        {!submitting && (
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {success ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              Face Registered Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can now use facial recognition for attendance.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please position your face clearly in the camera frame and maintain good lighting for the best results.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ position: 'relative', mb: 3 }}>
              {/* Countdown overlay */}
              {countdown !== null && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  zIndex: 2,
                  borderRadius: 2
                }}>
                  <Typography variant="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {countdown}
                  </Typography>
                </Box>
              )}
              
              {/* Video container */}
              <Box sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                height: 400,
                bgcolor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {streaming ? (
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 4 }}>
                    <CameraIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                    <Typography>
                      {error ? 'Camera error. Please try again.' : 'Starting camera...'}
                    </Typography>
                  </Box>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={resetCamera}
                disabled={submitting || countdown !== null || !streaming}
              >
                Reset Camera
              </Button>
              
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
                onClick={captureImage}
                disabled={submitting || countdown !== null || !streaming}
                sx={{ px: 3 }}
              >
                {submitting ? 'Processing...' : 'Capture & Register'}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}