import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Face as FaceIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function RegisterFace() {
  const router = useRouter();
  const { id } = router.query;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('adminUser');
      if (!storedUser) {
        router.push('/admin/login');
        return;
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Fetch user data
  useEffect(() => {
    if (!id) return;
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/users`);
        const users = await response.json();
        
        const foundUser = users.find(u => u.id === parseInt(id));
        if (foundUser) {
          setUser(foundUser);
        } else {
          setError(`User with ID ${id} not found`);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, apiUrl]);
  
  // Start camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 720 },
          height: { ideal: 576 },
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Capture image and send to server
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
        stopCamera();
        
        // Redirect after success
        setTimeout(() => {
          router.back();
        }, 3000);
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
  
  // Return to previous page
  const handleBack = () => {
    router.back();
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading user data...
        </Typography>
      </Container>
    );
  }
  
  // Render error state if user not found
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error
          </Typography>
          <Typography variant="body1">
            {error || 'User not found'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 3 }}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {user.hasFaceRegistered ? 'Update Face Registration' : 'Register Face'}
        </Typography>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: user.hasFaceRegistered ? 'success.light' : 'warning.light',
              width: 60, 
              height: 60, 
              fontSize: '2rem',
              mr: 2
            }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">{user.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Status:
                </Typography>
                {user.hasFaceRegistered ? (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Face Registered" 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                ) : (
                  <Chip 
                    icon={<FaceIcon />} 
                    label="Face Not Registered" 
                    color="warning" 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: 'center', position: 'relative' }}>
        {success ? (
          <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              Face Registered Successfully!
            </Typography>
            <Typography variant="body1">
              Redirecting back to dashboard...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              {user.hasFaceRegistered 
                ? 'Update your facial recognition data' 
                : 'Register your face for attendance tracking'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please position your face clearly in the camera frame and maintain good lighting.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ 
              maxWidth: 520, 
              margin: '0 auto',
              position: 'relative'
            }}>
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
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 2,
                  borderRadius: 2
                }}>
                  <Typography variant="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {countdown}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                height: 390,
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
                    <CameraIcon sx={{ fontSize: 60 }} />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      Camera is off. Click the button below to start.
                    </Typography>
                  </Box>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {!streaming ? (
                  <Button 
                    variant="contained" 
                    startIcon={<CameraIcon />}
                    onClick={startCamera}
                    disabled={submitting}
                    sx={{ px: 4, py: 1, borderRadius: 2 }}
                  >
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outlined"
                      color="secondary" 
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        stopCamera();
                        setTimeout(() => {
                          startCamera();
                        }, 500);
                      }}
                      disabled={submitting || countdown !== null}
                      sx={{ borderRadius: 2 }}
                    >
                      Reset Camera
                    </Button>
                    
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<PhotoCameraIcon />}
                      onClick={captureImage}
                      disabled={submitting || countdown !== null}
                      sx={{ px: 4, py: 1, borderRadius: 2 }}
                    >
                      {submitting ? 'Processing...' : 'Capture & Register'}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}