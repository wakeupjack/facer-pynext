// absensi_wajah_app/frontend-nextjs/pages/register.js
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';

const videoConstraints = {
  width: 400,
  height: 400,
  facingMode: 'user',
};

export default function RegisterPage() {
  const webcamRef = useRef(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef, setImgSrc]);

  const retake = () => {
    setImgSrc(null);
    setMessage('');
    setError('');
  }

  const handleSubmit = async () => {
    if (!imgSrc || !name) {
      setError('Please capture an image and enter your name.');
      return;
    }
    setError('');
    setMessage('Processing...');

    // Convert base64 to Blob
    const fetchRes = await fetch(imgSrc);
    const blob = await fetchRes.blob();
    const file = new File([blob], `${name.replace(' ', '_')}_registration.jpg`, { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5001/api/register', { // Alamat backend Flask
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Registration successful!');
        setName(''); // Reset nama setelah berhasil
        setImgSrc(null); // Reset gambar setelah berhasil
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1>Register Face</h1>
      <Link href="/">Go to Attendance</Link>
      <div style={{ margin: '20px 0' }}>
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={videoConstraints.width}
              height={videoConstraints.height}
              videoConstraints={videoConstraints}
              style={{ border: '1px solid black' }}
            />
            <button onClick={capture} style={{ display: 'block', margin: '10px auto', padding: '10px' }}>Capture photo</button>
          </>
        ) : (
          <>
            <img src={imgSrc} alt="Captured" style={{ border: '1px solid black', width: videoConstraints.width, height: videoConstraints.height }}/>
            <button onClick={retake} style={{ display: 'block', margin: '10px auto', padding: '10px' }}>Retake Photo</button>
          </>
        )}
      </div>
      
      {imgSrc && (
         <div>
            <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ padding: '10px', margin: '10px', width: '200px' }}
            />
            <button onClick={handleSubmit} style={{ padding: '10px' }}>Register</button>
         </div>
      )}
      
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}