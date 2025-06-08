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
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';

export default function RegisterFaceModal({ open, onClose, user, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [videoInitialized, setVideoInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  // Start camera when modal is opened
  useEffect(() => {
    let timeoutId;
    
    if (open) {
      // Clear previous errors
      setError('');
      setPermissionError(false);
      
      // Delay starting camera to make sure modal is fully rendered
      timeoutId = setTimeout(() => {
        startCamera();
      }, 1000);
    } else {
      stopCamera();
      setError('');
      setPermissionError(false);
      setSuccess(false);
      setCountdown(null);
      setVideoInitialized(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open]);

  // Manual play handler for browsers with strict autoplay policies
  const handleManualPlay = () => {
    if (videoRef.current && streamRef.current) {
      console.log("Manual play triggered");
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Manual play successful");
          setStreaming(true);
          setVideoInitialized(true);
          setError('');
        }).catch(err => {
          console.error("Manual play failed:", err);
          setError(`Could not start video playback: ${err.message}`);
        });
      }
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera with explicit permission handling
  const startCamera = async () => {
    console.log("Attempting to start camera...");
    setLoadingCamera(true);
    setError('');
    setPermissionError(false);
    setVideoInitialized(false);
    
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please try a different browser.');
      }
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // Explicitly disable audio
      };
      
      console.log("Requesting media stream with constraints:", constraints);
      
      // Request camera access with explicit permission handling
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(err => {
          console.error("Camera access error:", err.name, err.message);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError(true);
            throw new Error('Camera access denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            throw new Error('No camera detected. Please connect a camera and try again.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            throw new Error('Camera is in use by another application. Please close other apps using the camera.');
          } else {
            throw err;
          }
        });
      
      console.log("Media stream obtained successfully");
      
      // Store stream in ref for later access
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set important video attributes
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        
        // Set up all event listeners before assigning srcObject
        video.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          
          // Try to play after metadata is loaded
          tryPlayVideo(video);
        };
        
        video.oncanplay = () => {
          console.log("Video can play now");
          setVideoInitialized(true);
        };
        
        video.onplaying = () => {
          console.log("Video playback started");
          setStreaming(true);
          setVideoInitialized(true);
        };
        
        video.onerror = (e) => {
          console.error("Video error:", e);
          setError(`Video error: ${video.error?.message || 'Unknown error'}`);
        };
        
        // Assign the stream to srcObject
        video.srcObject = stream;
        
        // Try to play the video
        tryPlayVideo(video);
        
      } else {
        console.error("Video reference not available");
        throw new Error('Video element not initialized. Please try refreshing the page.');
      }
    } catch (err) {
      console.error('Error starting camera:', err.name, err.message);
      setError(err.message || 'Could not access the camera. Please check your camera permissions and try again.');
    } finally {
      setLoadingCamera(false);
    }
  };
  
  // Helper function to try playing the video with error handling
  const tryPlayVideo = (videoElement) => {
    if (!videoElement) return;
    
    const playPromise = videoElement.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("Video playback started successfully");
        setStreaming(true);
        setVideoInitialized(true);
      }).catch(err => {
        console.error("Video play error:", err);
        
        // Don't set error for AbortError as it's often just the browser waiting for user interaction
        if (err.name !== 'AbortError') {
          if (err.name === 'NotAllowedError') {
            setError('Browser requires user interaction to play video. Please click the "Reset Camera" button.');
          } else {
            setError(`Could not play video: ${err.message}. Try clicking Reset Camera.`);
          }
        }
      });
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    console.log("Stopping camera...");
    
    // Stop camera stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        console.log("Stopping track:", track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Also clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reload of the video element
    }
    
    setStreaming(false);
    setVideoInitialized(false);
  };

  // Reset and restart camera
  const resetCamera = () => {
    console.log("Resetting camera...");
    stopCamera();
    // Small delay to make sure everything is cleaned up
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  // Capture image with countdown
  const captureImage = () => {
    if (!streaming || !videoInitialized) {
      setError("Video must be playing to capture image. Try clicking Reset Camera first.");
      return;
    }
    
    console.log("Starting capture countdown...");
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
    console.log("Processing capture...");
    if (!streaming || !videoRef.current || !canvasRef.current || !videoInitialized) {
      console.error("Missing required refs for capture or video not initialized");
      setError("Cannot capture image. Video stream not available or not fully initialized.");
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    console.log("Canvas dimensions set:", canvas.width, "x", canvas.height);
    
    try {
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and submit
      canvas.toBlob(blob => {
        if (blob) {
          console.log("Image blob created, size:", blob.size, "bytes");
          submitFaceRegistration(blob);
        } else {
          console.error("Failed to create image blob");
          setError("Failed to process the captured image. Please try again.");
        }
      }, 'image/jpeg', 0.95);
    } catch (e) {
      console.error("Error capturing from video:", e);
      setError("Failed to capture image from video. Please try resetting the camera.");
    }
  };
  
  // Submit face data to API
  const submitFaceRegistration = async (blob) => {
    if (!blob || !user) {
      console.error("Missing blob or user data for submission");
      setError("Missing data for registration. Please try again.");
      return;
    }
    
    console.log("Submitting face registration for user:", user.name);
    setSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('name', user.name);
      formData.append('image', blob, 'face.jpg');
      
      console.log("Sending API request to:", `${apiUrl}/api/register`);
      
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        body: formData,
      });
      
      console.log("API response received, status:", response.status);
      const data = await response.json();
      
      if (response.ok) {
        console.log("Registration successful:", data);
        setSuccess(true);
        // Call the success callback after a delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        console.error("API error:", data);
        setError(data.error || 'Failed to register face. Server returned an error.');
      }
    } catch (err) {
      console.error('Error submitting face:', err);
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle permission error recovery
  const handleRetryAfterPermissionError = () => {
    setPermissionError(false);
    startCamera();
  };

  // Check if video is ready but has play() errors
  const hasPlaybackError = streaming && !videoInitialized && error.includes("Could not play video");

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
        ) : permissionError ? (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" color="warning.main" gutterBottom>
              Camera Permission Required
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please allow camera access in your browser settings to register your face.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Look for the camera icon in your browser's address bar and click it to allow access.
            </Typography>
            <Button
              variant="contained"
              onClick={handleRetryAfterPermissionError}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please position your face clearly in the camera frame and maintain good lighting for the best results.
            </Typography>
            
            {/* Error alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                {hasPlaybackError && (
                  <Button 
                    color="error" 
                    variant="text" 
                    size="small" 
                    onClick={handleManualPlay}
                    sx={{ ml: 1 }}
                  >
                    Click to play video
                  </Button>
                )}
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
              
              {/* Loading overlay */}
              {loadingCamera && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  zIndex: 2,
                  borderRadius: 2
                }}>
                  <CircularProgress color="primary" sx={{ mb: 2 }} />
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Initializing camera...
                  </Typography>
                </Box>
              )}
              
              {/* Video container */}
              <Box 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: 400,
                  bgcolor: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
                onClick={hasPlaybackError ? handleManualPlay : undefined}
              >
                <video
                  ref={videoRef}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                  }}
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Manual play button overlay for autoplay issues */}
                {hasPlaybackError && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                    onClick={handleManualPlay}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      sx={{ 
                        fontSize: '1.2rem', 
                        borderRadius: 8,
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Click to Start Camera
                    </Button>
                  </Box>
                )}
                
                {!streaming && !loadingCamera && (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 4 }}>
                    <CameraIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                    <Typography>
                      {error ? 'Camera error. Please try again.' : 'Preparing camera...'}
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
                disabled={submitting || countdown !== null || loadingCamera}
              >
                Reset Camera
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
                onClick={captureImage}
                disabled={submitting || countdown !== null || !streaming || loadingCamera || !videoInitialized}
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