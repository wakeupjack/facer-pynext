// src/pages/admin/register-face/[id].jsx
// ...kode sebelumnya yang sudah ada

const handleRegister = async () => {
  if (!imgSrc) {
    setError('Please capture an image first');
    return;
  }
  
  setIsProcessing(true);
  setMessage('Processing face registration...');
  setError('');
  
  try {
    // Convert base64 to Blob
    const fetchRes = await fetch(imgSrc);
    const blob = await fetchRes.blob();
    const file = new File([blob], `${user.name.replace(/\s+/g, '_')}_face.jpg`, { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('name', user.name);
    formData.append('image', file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const response = await fetch(`${apiUrl}/api/register`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message || `Face registered successfully for ${user.name}`);
      setIsRegistered(true);
      user.hasFaceRegistered = true;
    } else {
      setError(data.error || 'Registration failed');
    }
  } catch (err) {
    console.error(err);
    setError('An error occurred while registering the face. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};