import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Box, 
  Typography, 
  Alert,
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AddUserModal = ({ open, handleClose, onUserAdded }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  const handleSubmit = async () => {
    if (!name || name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // API call to add user to the system
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }
      
      setSuccess(true);
      
      // Reset form and notify parent component
      setTimeout(() => {
        setName('');
        setSuccess(false);
        onUserAdded(data);
        handleClose();
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while adding the user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setName('');
    setError('');
    setSuccess(false);
    handleClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={isSubmitting ? null : handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonAddIcon sx={{ mr: 1 }} />
          Add New User
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add a new user to the system. You will need to register their face after creating the user.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            User added successfully!
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          label="User's Full Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting || success}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This name will be used for identification during face recognition.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleCancel} 
          disabled={isSubmitting}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={isSubmitting || success}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          sx={{ borderRadius: 2 }}
        >
          {isSubmitting ? 'Adding...' : 'Add User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;