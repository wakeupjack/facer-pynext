// absensi_wajah_app/frontend-nextjs/pages/index.js
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';

const videoConstraints = {
  width: 400,
  height: 400,
  facingMode: 'user',
};

export default function AttendancePage() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recognizedName, setRecognizedName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);


  const handleAttendance = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setMessage('Processing...');
    setError('');
    setRecognizedName('');

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Could not capture image.');
      setIsProcessing(false);
      return;
    }

    // Convert base64 to Blob
    const fetchRes = await fetch(imageSrc);
    const blob = await fetchRes.blob();
    const file = new File([blob], "attendance_capture.jpg", { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5001/api/attend', { // Alamat backend Flask
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Attendance check complete.');
        setRecognizedName(data.name || 'Unknown');
      } else {
        setError(data.error || 'Attendance check failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1>Face Attendance</h1>
      <Link href="/register">Go to Register</Link>
      <div style={{ margin: '20px 0' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={videoConstraints.width}
          height={videoConstraints.height}
          videoConstraints={videoConstraints}
          style={{ border: '1px solid black' }}
        />
      </div>
      
      <button onClick={handleAttendance} disabled={isProcessing} style={{ padding: '10px 20px', fontSize: '16px' }}>
        {isProcessing ? 'Processing...' : 'Clock In / Out'}
      </button>
      
      {message && <p style={{ color: recognizedName !== 'Unknown' && recognizedName !== '' ? 'green' : 'orange' }}>{message}</p>}
      {recognizedName && recognizedName !== 'Unknown' && <p>Recognized: <strong>{recognizedName}</strong></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}