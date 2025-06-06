// components/Auth/LoginForm.jsx
import React, { useState } from 'react';
import { 
  Box, TextField, Button, FormControl,
  InputLabel, OutlinedInput, InputAdornment,
  IconButton, Typography, Paper, FormControlLabel,
  Checkbox, Link as MuiLink
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';

const LoginForm = () => {
  const [values, setValues] = useState({
    email: '',
    password: '',
    showPassword: false,
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

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
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
        router.push('/admin');
      } else if (values.email === 'user@example.com' && values.password === 'user') {
        router.push('/dashboard');
      } else {
        setErrors({ submit: 'Invalid email or password' });
      }
    }
  };

  return (
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
        
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password" required error={Boolean(errors.password)}>
            Password
          </InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            type={values.showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={handleChange('password')}
            error={Boolean(errors.password)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {values.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
          {errors.password && (
            <Typography variant="caption" color="error" sx={{ ml: 2 }}>
              {errors.password}
            </Typography>
          )}
        </FormControl>
        
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
          <Link href="/forgot-password" passHref>
            <MuiLink variant="body2">Forgot password?</MuiLink>
          </Link>
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
            Don't have an account?{' '}
            <Link href="/register" passHref>
              <MuiLink variant="body2">Sign Up</MuiLink>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default LoginForm;