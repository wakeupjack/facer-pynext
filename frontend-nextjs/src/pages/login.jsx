// src/pages/login.jsx
import React from 'react';
import { Box, Grid, Typography, Container, Paper, TextField, Button, FormControlLabel, Checkbox, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const Login = () => {
  const [values, setValues] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
    // Clear errors when user types
    if (errors[prop]) {
      setErrors({ ...errors, [prop]: '' });
    }
  };

  const handleCheckbox = (event) => {
    setValues({ ...values, remember: event.target.checked });
  };

  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    if (!values.email) {
      formIsValid = false;
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      formIsValid = false;
      tempErrors.email = 'Email is not valid';
    }

    if (!values.password) {
      formIsValid = false;
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      // Mock login logic - in real app would call API
      if (values.email === 'admin@example.com' && values.password === 'admin') {
        // Store user info in localStorage
        const user = {
          id: 1,
          email: values.email,
          name: 'Admin User',
          role: 'admin'
        };
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/admin');
      } else if (values.email === 'user@example.com' && values.password === 'user') {
        // Store user info in localStorage
        const user = {
          id: 2,
          email: values.email,
          name: 'John Doe',
          role: 'user'
        };
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        setErrors({ submit: 'Invalid email or password' });
      }
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        py: 8
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
                Face Recognition System
              </Typography>
              <Typography variant="h5" sx={{ mb: 4 }}>
                Attendance Made Simple
              </Typography>
              <Box 
                component="img"
                src="https://via.placeholder.com/600x400?text=Login+Illustration" // Placeholder image
                alt="Login Illustration"
                sx={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', borderRadius: 2 }}>
              <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
                Login to Face Recognition System
              </Typography>
              
              <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={values.email}
                  onChange={handleChange('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={values.remember} 
                        onChange={handleCheckbox} 
                        color="primary" 
                        size="small"
                      />
                    }
                    label="Remember me"
                  />
                  <MuiLink href="#" variant="body2">
                    Forgot password?
                  </MuiLink>
                </Box>
                
                {errors.submit && (
                  <Typography color="error" align="center" sx={{ mt: 2 }}>
                    {errors.submit}
                  </Typography>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                >
                  Sign In
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2">
                    Akun Demo:
                  </Typography>
                  <Typography variant="body2">
                    Admin: admin@example.com / admin
                  </Typography>
                  <Typography variant="body2">
                    User: user@example.com / user
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;