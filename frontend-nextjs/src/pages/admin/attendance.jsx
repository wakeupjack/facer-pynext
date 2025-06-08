import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Grid, 
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Chip, IconButton,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel, Card, CardContent, Tooltip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Timer as TimerIcon,
  Today as TodayIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { fetchAttendanceRecords, exportAttendanceData } from '../../services/api';

export default function AttendancePage() {
  const router = useRouter();
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [todayDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  // Current timestamp
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Load attendance data
  useEffect(() => {
    const checkAuth = () => {
      // In browser environment only
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('adminUser');
        if (!storedUser) {
          router.push('/admin/login');
          return false;
        }
        
        setAdminUser(JSON.parse(storedUser));
        return true;
      }
      return false;
    };
    
    const isAuthenticated = checkAuth();
    if (isAuthenticated) {
      fetchAttendanceData();
    }
  }, [router]);
  
  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [attendanceRecords, nameFilter, statusFilter, startDateFilter, endDateFilter]);
  
  // Fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchAttendanceRecords();
      
      if (data) {
        setAttendanceRecords(data);
        setFilteredRecords(data);
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance records. Please try again.');
      
      // Use dummy data if API fails
      const dummyData = generateDummyAttendanceData();
      setAttendanceRecords(dummyData);
      setFilteredRecords(dummyData);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter application
  const applyFilters = () => {
    let filtered = [...attendanceRecords];
    
    if (nameFilter) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    if (startDateFilter) {
      filtered = filtered.filter(record => record.date >= format(startDateFilter, 'yyyy-MM-dd'));
    }
    
    if (endDateFilter) {
      filtered = filtered.filter(record => record.date <= format(endDateFilter, 'yyyy-MM-dd'));
    }
    
    setFilteredRecords(filtered);
    setPage(0); // Reset to first page when filters change
  };
  
  // Reset all filters
  const resetFilters = () => {
    setNameFilter('');
    setStatusFilter('');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setFilteredRecords(attendanceRecords);
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      // Create filters object for export
      const filters = {
        name: nameFilter || undefined,
        status: statusFilter || undefined,
        startDate: startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : undefined,
        endDate: endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : undefined
      };
      
      // Call export function
      exportAttendanceData(filters);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    }
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Open edit dialog
  const handleOpenEditDialog = (record) => {
    setRecordToEdit(record);
    setCheckInTime(record.check_in || '');
    setCheckOutTime(record.check_out || '');
    setEditMessage('');
    setEditDialogOpen(true);
  };
  
  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setRecordToEdit(null);
    setEditMessage('');
  };
  
  // Validate time format (HH:MM:SS)
  const isValidTimeFormat = (time) => {
    // Allow empty value
    if (!time) return true;
    
    // Check format HH:MM:SS or HH:MM
    const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    if (!regex.test(time)) return false;
    
    return true;
  };
  
  // Save edited record
  const handleSaveEdit = async () => {
    // Validate time formats
    if (!isValidTimeFormat(checkInTime)) {
      setEditMessage('Invalid check-in time format. Please use HH:MM:SS or HH:MM');
      return;
    }
    
    if (!isValidTimeFormat(checkOutTime)) {
      setEditMessage('Invalid check-out time format. Please use HH:MM:SS or HH:MM');
      return;
    }
    
    // Make sure checkInTime has seconds
    const formattedCheckInTime = checkInTime ? 
      (checkInTime.includes(':') ? 
        (checkInTime.split(':').length === 3 ? checkInTime : `${checkInTime}:00`) 
        : `${checkInTime}:00:00`) 
      : '';

    // Make sure checkOutTime has seconds
    const formattedCheckOutTime = checkOutTime ? 
      (checkOutTime.includes(':') ? 
        (checkOutTime.split(':').length === 3 ? checkOutTime : `${checkOutTime}:00`) 
        : `${checkOutTime}:00:00`)
      : '';
      
    // Update timestamps too based on edited times
    const today = new Date(recordToEdit.date);
    
    let checkInTimestamp = null;
    if (formattedCheckInTime) {
      const [hours, minutes, seconds] = formattedCheckInTime.split(':').map(Number);
      checkInTimestamp = new Date(today);
      checkInTimestamp.setHours(hours, minutes, seconds);
    }
    
    let checkOutTimestamp = null;
    if (formattedCheckOutTime) {
      const [hours, minutes, seconds] = formattedCheckOutTime.split(':').map(Number);
      checkOutTimestamp = new Date(today);
      checkOutTimestamp.setHours(hours, minutes, seconds);
    }
    
    // In a real app, you would update the record via API
    // For now, just update the local state
    const updatedRecords = attendanceRecords.map(record => {
      if (record.id === recordToEdit.id) {
        const updatedRecord = {
          ...record,
          check_in: formattedCheckInTime,
          check_out: formattedCheckOutTime,
          check_in_timestamp: checkInTimestamp ? checkInTimestamp.toISOString() : null,
          check_out_timestamp: checkOutTimestamp ? checkOutTimestamp.toISOString() : null
        };
        
        // Calculate duration if both times exist
        if (formattedCheckInTime && formattedCheckOutTime) {
          const checkInDate = new Date(`2000-01-01T${formattedCheckInTime}`);
          const checkOutDate = new Date(`2000-01-01T${formattedCheckOutTime}`);
          
          // Handle case where checkout is on next day
          let duration = (checkOutDate - checkInDate) / (1000 * 60);
          if (duration < 0) {
            duration += 24 * 60; // Add 24 hours in minutes
          }
          
          updatedRecord.duration_minutes = Math.round(duration);
          
          // Update status based on check-in time (for example, late after 9:00)
          const lateThreshold = 9 * 60; // 9:00 AM in minutes
          const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
          
          if (checkInMinutes > lateThreshold) {
            updatedRecord.status = 'late';
          } else {
            updatedRecord.status = 'present';
          }
        } else if (formattedCheckInTime && !formattedCheckOutTime) {
          // Only check-in, no check-out
          updatedRecord.status = 'incomplete';
          updatedRecord.duration_minutes = null;
        }
        
        return updatedRecord;
      }
      return record;
    });
    
    setAttendanceRecords(updatedRecords);
    applyFilters();
    setEditMessage('Attendance record updated successfully');
    
    // Close dialog after a delay
    setTimeout(() => {
      handleCloseEditDialog();
    }, 1500);
  };
  
  // Generate dummy attendance data for testing
  const generateDummyAttendanceData = () => {
    const users = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'wakeupjack'];
    const statuses = ['present', 'late', 'incomplete'];
    const records = [];
    
    // Generate records for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Generate 1-3 records per day
      const recordsPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < recordsPerDay; j++) {
        const userName = users[Math.floor(Math.random() * users.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random check-in time between 7:00 and 9:30
        const checkInHour = Math.floor(Math.random() * 3) + 7;
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInStr = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}:00`;
        
        // Random check-out time between 16:00 and 18:30
        const checkOutHour = Math.floor(Math.random() * 3) + 16;
        const checkOutMinute = Math.floor(Math.random() * 60);
        const checkOutStr = status === 'incomplete' ? null : `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}:00`;
        
        // Calculate duration in minutes
        let duration = null;
        if (checkOutStr) {
          const checkInDate = new Date(`2000-01-01T${checkInStr}`);
          const checkOutDate = new Date(`2000-01-01T${checkOutStr}`);
          duration = (checkOutDate - checkInDate) / (1000 * 60);
        }

        // Add timestamp data
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - i);
        timestamp.setHours(checkInHour, checkInMinute, 0);
        
        const checkInTimestamp = timestamp.toISOString();
        
        let checkOutTimestamp = null;
        if (checkOutStr) {
          const checkOutDate = new Date(timestamp);
          checkOutDate.setHours(checkOutHour, checkOutMinute, 0);
          checkOutTimestamp = checkOutDate.toISOString();
        }
        
        records.push({
          id: records.length + 1,
          name: userName,
          date: dateStr,
          check_in: checkInStr,
          check_in_verified: true,
          check_out: checkOutStr,
          check_out_verified: status === 'incomplete' ? false : true,
          duration_minutes: duration,
          status: status,
          check_in_timestamp: checkInTimestamp,
          check_out_timestamp: checkOutTimestamp
        });
      }
    }
    
    // Add today's record for current user
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTimestamp = new Date();
    todayTimestamp.setHours(7, 32, 26);
    
    records.push({
      id: records.length + 1,
      name: 'wakeupjack',
      date: today,
      check_in: '07:32:26',
      check_in_verified: true,
      check_out: null,
      check_out_verified: false,
      duration_minutes: null,
      status: 'incomplete',
      check_in_timestamp: todayTimestamp.toISOString(),
      check_out_timestamp: null
    });
    
    return records;
  };
  
  // Render status chip
  const renderStatusChip = (status) => {
    switch(status) {
      case 'present':
        return <Chip label="Present" color="success" size="small" icon={<CheckIcon />} />;
      case 'late':
        return <Chip label="Late" color="warning" size="small" icon={<AccessTimeIcon />} />;
      case 'incomplete':
        return <Chip label="Incomplete" color="error" size="small" icon={<ClearIcon />} />;
      default:
        return <Chip label={status || 'Unknown'} size="small" />;
    }
  };
  
  // Format time string for display (converts HH:MM:SS to HH:MM)
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '-';
    
    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return timeStr;
  };
  
  // Format duration minutes as HH:MM
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch (err) {
      try {
        return format(new Date(dateStr), 'dd MMM yyyy');
      } catch (error) {
        return dateStr;
      }
    }
  };
  
  // Format timestamp for display
  const formatTimestampDisplay = (timestampStr) => {
    if (!timestampStr) return '-';
    
    try {
      return format(parseISO(timestampStr), 'dd MMM yyyy, HH:mm:ss');
    } catch (err) {
      return timestampStr;
    }
  };
  
  // Get today's records
  const getTodayRecords = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendanceRecords.filter(record => record.date === today);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/admin')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Attendance Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {todayDate} | Manage daily attendance records
          </Typography>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Current Timestamp Display */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', bgcolor: 'primary.light' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="div">
              Current System Time
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="div" fontWeight="bold">
                {format(currentTime, 'HH:mm:ss')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Card sx={{ minWidth: 275, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Today's Attendance Status
                  </Typography>
                  <Typography variant="body1">
                    <strong>{getTodayRecords().length}</strong> check-ins recorded today
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <EventAvailableIcon sx={{ mr: 1, color: 'success.main', fontSize: '1rem' }} />
                    <Typography variant="body2" color="text.secondary">
                      {format(currentTime, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">
            Attendance List
            {filteredRecords.length > 0 && (
              <Typography component="span" color="text.secondary" variant="body2" sx={{ ml: 1 }}>
                ({filteredRecords.length} records)
              </Typography>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ borderRadius: 2 }}
            >
              {filterOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ borderRadius: 2 }}
            >
              Export CSV
            </Button>
            
            <IconButton 
              onClick={fetchAttendanceData} 
              color="primary" 
              sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
              title="Refresh Data"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Filters Section */}
        {filterOpen && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Name Filter"
                variant="outlined"
                fullWidth
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search by name"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Status"
                variant="outlined"
                fullWidth
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="incomplete">Incomplete</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDateFilter}
                  onChange={(date) => setStartDateFilter(date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  inputFormat="dd/MM/yyyy"
                  maxDate={endDateFilter || undefined}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDateFilter}
                  onChange={(date) => setEndDateFilter(date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  inputFormat="dd/MM/yyyy"
                  minDate={startDateFilter || undefined}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                sx={{ borderRadius: 2, mr: 1 }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No attendance records found.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="attendance table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Check-In</TableCell>
                    <TableCell>Check-Out</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell component="th" scope="row">
                          {record.name}
                        </TableCell>
                        <TableCell>{formatDateDisplay(record.date)}</TableCell>
                        <TableCell>
                          <Tooltip title={record.check_in_timestamp ? `Timestamp: ${formatTimestampDisplay(record.check_in_timestamp)}` : ""} arrow placement="top">
                            <Box>
                              {formatTimeDisplay(record.check_in)}
                              {record.check_in_verified && (
                                <CheckIcon sx={{ fontSize: 14, color: 'success.main', ml: 0.5 }} />
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={record.check_out_timestamp ? `Timestamp: ${formatTimestampDisplay(record.check_out_timestamp)}` : ""} arrow placement="top">
                            <Box>
                              {formatTimeDisplay(record.check_out)}
                              {record.check_out_verified && (
                                <CheckIcon sx={{ fontSize: 14, color: 'success.main', ml: 0.5 }} />
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatDuration(record.duration_minutes)}</TableCell>
                        <TableCell>{renderStatusChip(record.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEditDialog(record)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Detailed Timestamps Section */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" gutterBottom>
          Today's Attendance Timestamps
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detailed check-in and check-out timestamps for today
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : getTodayRecords().length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No attendance records found for today.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Check-In Time</TableCell>
                  <TableCell>Check-In Timestamp (UTC)</TableCell>
                  <TableCell>Check-Out Time</TableCell>
                  <TableCell>Check-Out Timestamp (UTC)</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getTodayRecords().map((record, index) => (
                  <TableRow key={index} sx={record.name === 'wakeupjack' ? { bgcolor: 'primary.lighter' } : {}}>
                    <TableCell>
                      <Typography fontWeight={record.name === 'wakeupjack' ? 'bold' : 'normal'}>
                        {record.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatTimeDisplay(record.check_in)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={record.name === 'wakeupjack' ? 'primary.main' : 'text.primary'}
                        fontWeight={record.name === 'wakeupjack' ? 'bold' : 'normal'}
                      >
                        {record.check_in_timestamp ? formatTimestampDisplay(record.check_in_timestamp) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatTimeDisplay(record.check_out)}</TableCell>
                    <TableCell>
                      {record.check_out_timestamp ? formatTimestampDisplay(record.check_out_timestamp) : '-'}
                    </TableCell>
                    <TableCell>{renderStatusChip(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {recordToEdit && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>{recordToEdit.name}</strong> - {formatDateDisplay(recordToEdit.date)}
              </Typography>
              
              {editMessage && (
                <Alert 
                  severity={editMessage.includes('successfully') ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {editMessage}
                </Alert>
              )}
              
              <TextField
                margin="dense"
                label="Check-In Time (HH:MM:SS)"
                type="text"
                fullWidth
                variant="outlined"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="09:00:00"
                sx={{ mb: 2 }}
                helperText="Format: HH:MM:SS or HH:MM"
                error={checkInTime && !isValidTimeFormat(checkInTime)}
              />
              
              <TextField
                margin="dense"
                label="Check-Out Time (HH:MM:SS)"
                type="text"
                fullWidth
                variant="outlined"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="17:00:00"
                helperText="Format: HH:MM:SS or HH:MM"
                error={checkOutTime && !isValidTimeFormat(checkOutTime)}
              />
              
              {recordToEdit.check_in_timestamp && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Timestamp Information
                  </Typography>
                  <Typography variant="body2">
                    Check-In Timestamp: {formatTimestampDisplay(recordToEdit.check_in_timestamp)}
                  </Typography>
                  {recordToEdit.check_out_timestamp && (
                    <Typography variant="body2">
                      Check-Out Timestamp: {formatTimestampDisplay(recordToEdit.check_out_timestamp)}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            sx={{ borderRadius: 2 }}
            disabled={editMessage.includes('successfully')}
          >
            {editMessage.includes('successfully') ? 'Saved' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}