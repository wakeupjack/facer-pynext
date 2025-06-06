// pages/admin/reports.jsx
import React, { useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Mock data
const generateAttendanceData = () => {
  const users = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Brown'];
  const statuses = ['Present', 'Late', 'Absent'];
  const data = [];

  // Generate 100 records
  for (let i = 0; i < 100; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate a random date within the last month
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    // Generate a random time
    const hours = Math.floor(Math.random() * 3) + 8; // Between 8 and 10 AM
    const minutes = Math.floor(Math.random() * 60);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    data.push({
      id: i + 1,
      name: randomUser,
      date: date.toISOString().split('T')[0],
      time: timeString,
      status: randomStatus
    });
  }

  return data;
};

const AttendanceReports = () => {
  const [attendanceData, setAttendanceData] = useState(generateAttendanceData());
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    startDate: null,
    endDate: null
  });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name) => (event) => {
    setFilters({
      ...filters,
      [name]: event.target.value
    });
    setPage(0);
  };

  const handleDateChange = (name) => (date) => {
    setFilters({
      ...filters,
      [name]: date
    });
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      status: '',
      startDate: null,
      endDate: null
    });
    setPage(0);
  };

  // Apply filters
  const filteredData = attendanceData.filter(record => {
    // Filter by name
    if (filters.name && !record.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (filters.status && record.status !== filters.status) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate) {
      const recordDate = new Date(record.date);
      if (recordDate < filters.startDate) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const recordDate = new Date(record.date);
      if (recordDate > filters.endDate) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Attendance Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and filter attendance records
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filter Options
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Name"
              value={filters.name}
              onChange={handleFilterChange('name')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={handleFilterChange('status')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="Late">Late</MenuItem>
                <MenuItem value="Absent">Absent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" sx={{ mr: 1 }} onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button variant="contained">
              Export Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="attendance table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => (
                  <TableRow hover key={record.id}>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status} 
                        color={
                          record.status === 'Present' ? 'success' :
                          record.status === 'Late' ? 'warning' : 'error'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </AdminLayout>
  );
};

export default AttendanceReports;