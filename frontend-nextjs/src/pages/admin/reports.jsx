import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Grid, 
  TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Card, CardContent,
  Alert, CircularProgress, Divider, Chip, Tabs, Tab,
  IconButton
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import the Chart component with SSR disabled
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>,
});

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [todayDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  // Report filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Summary data
  const [summaryData, setSummaryData] = useState(null);
  
  // Chart options
  const attendanceChartOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#4CAF50', '#FF9800', '#F44336'],
    xaxis: {
      categories: [],
      title: {
        text: 'Days of Month'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Users'
      }
    },
    legend: {
      position: 'top'
    },
    dataLabels: {
      enabled: false
    }
  };
  
  const [attendanceChartSeries, setAttendanceChartSeries] = useState([
    { name: 'Present', data: [] },
    { name: 'Late', data: [] },
    { name: 'Absent', data: [] }
  ]);
  
  const pieChartOptions = {
    chart: {
      type: 'donut',
    },
    colors: ['#4CAF50', '#FF9800', '#F44336', '#9E9E9E'],
    labels: ['Present', 'Late', 'Incomplete', 'Absent'],
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  const [pieChartSeries, setPieChartSeries] = useState([0, 0, 0, 0]);
  
  const hoursChartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        borderRadius: 4
      },
    },
    colors: ['#5C6BC0'],
    xaxis: {
      categories: [],
      title: {
        text: 'Average Hours'
      }
    },
    dataLabels: {
      formatter: function (val) {
        return val + ' hrs';
      }
    }
  };
  
  const [hoursChartSeries, setHoursChartSeries] = useState([
    { name: 'Avg. Hours', data: [] }
  ]);
  
  // Check authentication and load data
  useEffect(() => {
    const checkAuth = () => {
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
      fetchReportData();
    }
  }, [router]);
  
  // Fetch data when month/year changes
  useEffect(() => {
    if (adminUser) {
      fetchReportData();
    }
  }, [selectedMonth, selectedYear]);
  
  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call with the selected month/year
      const response = await fetch(
        `${apiUrl}/api/attendance/summary?month=${selectedMonth + 1}&year=${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data = await response.json();
      setSummaryData(data);
      
      // Update chart data
      updateChartData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
      
      // Use dummy data if API fails
      const dummyData = generateDummySummaryData();
      setSummaryData(dummyData);
      updateChartData(dummyData);
    } finally {
      setLoading(false);
    }
  };
  
  // Update chart data based on summary data
  const updateChartData = (data) => {
    if (!data || !data.daily_summary) return;
    
    // Extract data for the daily attendance chart
    const days = [];
    const presentData = [];
    const lateData = [];
    const absentData = [];
    
    data.daily_summary.forEach(day => {
      // Extract day number from date (e.g. "2025-06-08" -> "8")
      const dayNumber = parseInt(day.date.split('-')[2], 10);
      days.push(dayNumber);
      
      presentData.push(day.present_count);
      lateData.push(day.late_count);
      absentData.push(day.absent_count);
    });
    
    setAttendanceChartSeries([
      { name: 'Present', data: presentData },
      { name: 'Late', data: lateData },
      { name: 'Absent', data: absentData }
    ]);
    
    // Update x-axis categories
    attendanceChartOptions.xaxis.categories = days;
    
    // Update pie chart
    setPieChartSeries([
      data.present_count - data.late_count - data.incomplete_count, // Regular present
      data.late_count,
      data.incomplete_count,
      data.absent_count
    ]);
    
    // Update hours chart
    if (data.users_summary && data.users_summary.length > 0) {
      const userNames = [];
      const avgHours = [];
      
      data.users_summary.forEach(user => {
        userNames.push(user.name);
        // Convert minutes to hours
        avgHours.push((user.avg_duration_minutes / 60).toFixed(1));
      });
      
      setHoursChartSeries([
        { name: 'Avg. Hours', data: avgHours }
      ]);
      
      hoursChartOptions.xaxis.categories = userNames;
    }
  };
  
  // Generate dummy summary data
  const generateDummySummaryData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const userNames = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis'];
    
    // Generate daily summary
    const dailySummary = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Generate random counts
      const presentCount = Math.floor(Math.random() * (userNames.length + 1));
      const lateCount = Math.floor(Math.random() * Math.min(2, presentCount + 1));
      const incompleteCount = Math.floor(Math.random() * Math.min(2, presentCount - lateCount + 1));
      const absentCount = userNames.length - presentCount;
      
      dailySummary.push({
        date,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        incomplete_count: incompleteCount
      });
    }
    
    // Generate user summary
    const usersSummary = userNames.map(name => {
      const presentDays = Math.floor(Math.random() * (daysInMonth + 1));
      const lateDays = Math.floor(Math.random() * Math.min(5, presentDays + 1));
      const incompleteDays = Math.floor(Math.random() * Math.min(3, presentDays - lateDays + 1));
      
      // Random average duration between 7-9 hours (in minutes)
      const avgDurationMinutes = (420 + Math.random() * 120).toFixed(1);
      
      return {
        name,
        present_days: presentDays,
        absent_days: daysInMonth - presentDays,
        late_days: lateDays,
        incomplete_days: incompleteDays,
        avg_duration_minutes: parseFloat(avgDurationMinutes),
        total_duration_minutes: parseFloat(avgDurationMinutes) * presentDays
      };
    });
    
    // Calculate totals
    const totalPresent = dailySummary.reduce((sum, day) => sum + day.present_count, 0);
    const totalLate = dailySummary.reduce((sum, day) => sum + day.late_count, 0);
    const totalIncomplete = dailySummary.reduce((sum, day) => sum + day.incomplete_count, 0);
    const totalAbsent = dailySummary.reduce((sum, day) => sum + day.absent_count, 0);
    
    return {
      total_users: userNames.length,
      total_days: daysInMonth,
      month: `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`,
      present_count: totalPresent,
      absent_count: totalAbsent,
      late_count: totalLate,
      incomplete_count: totalIncomplete,
      users_summary: usersSummary,
      daily_summary: dailySummary
    };
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle month change
  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value, 10));
  };
  
  // Handle year change
  const handleYearChange = (event) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };
  
  // Format minutes to hours:minutes
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    return `${hours} hrs ${mins} mins`;
  };
  
  // Generate years for select
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = currentYear - 5; i <= currentYear; i++) {
      years.push(i);
    }
    
    return years;
  };
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Calculate attendance rate percentage
  const calculateAttendanceRate = (present, total) => {
    if (!total) return 0;
    return Math.round((present / total) * 100);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/admin')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Attendance Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {todayDate} | View attendance analytics and patterns
          </Typography>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">
            Monthly Attendance Report
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Month"
              value={selectedMonth}
              onChange={handleMonthChange}
              sx={{ minWidth: 120 }}
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            >
              {monthNames.map((month, index) => (
                <MenuItem key={index} value={index}>
                  {month}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              label="Year"
              value={selectedYear}
              onChange={handleYearChange}
              sx={{ minWidth: 100 }}
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            >
              {generateYearOptions().map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
            
            <IconButton 
              onClick={fetchReportData} 
              color="primary" 
              sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
              title="Refresh Data"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : !summaryData ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No report data available.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                    {calculateAttendanceRate(summaryData.present_count, summaryData.present_count + summaryData.absent_count)}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      {summaryData.present_count} present / {summaryData.present_count + summaryData.absent_count} total
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} lg={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">
                    Late Arrivals
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                    {summaryData.late_count}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="warning.main" fontWeight="medium">
                      {calculateAttendanceRate(summaryData.late_count, summaryData.present_count)}% of present
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} lg={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">
                    Incomplete Records
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                    {summaryData.incomplete_count}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="error.main" fontWeight="medium">
                      Missing check-out records
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} lg={3}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                    {summaryData.total_users}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      For {monthNames[selectedMonth]} {selectedYear}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Tabs for different views */}
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                <Tab label="Overview" />
                <Tab label="Daily Trends" />
                <Tab label="User Performance" />
              </Tabs>
            </Box>
            
            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Monthly Attendance Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Distribution of attendance status for {monthNames[selectedMonth]} {selectedYear}
                    </Typography>
                    
                    {/* Pie Chart */}
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={pieChartOptions}
                        series={pieChartSeries}
                        type="donut"
                        height={300}
                      />
                    )}
                    
                    {/* Legend with counts */}
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Present</Typography>
                          <Typography variant="h6" color="success.main">{pieChartSeries[0]}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Late</Typography>
                          <Typography variant="h6" color="warning.main">{pieChartSeries[1]}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Incomplete</Typography>
                          <Typography variant="h6" color="error.main">{pieChartSeries[2]}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Absent</Typography>
                          <Typography variant="h6" color="text.secondary">{pieChartSeries[3]}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Top Performers
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Users with highest attendance rate and work hours
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="center">Attendance</TableCell>
                            <TableCell align="right">Avg. Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summaryData.users_summary
                            .sort((a, b) => 
                              (b.present_days / summaryData.total_days) - 
                              (a.present_days / summaryData.total_days) ||
                              b.avg_duration_minutes - a.avg_duration_minutes
                            )
                            .slice(0, 5)
                            .map((user, index) => (
                              <TableRow key={index}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={`${Math.round((user.present_days / summaryData.total_days) * 100)}%`} 
                                    size="small"
                                    color={
                                      (user.present_days / summaryData.total_days) >= 0.9 
                                        ? 'success' 
                                        : (user.present_days / summaryData.total_days) >= 0.7 
                                          ? 'primary'
                                          : 'default'
                                    }
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {(user.avg_duration_minutes / 60).toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Monthly Statistics
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Average Work Hours:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {(summaryData.users_summary.reduce((sum, user) => 
                              sum + user.avg_duration_minutes, 0) / 
                              (summaryData.users_summary.length * 60)
                            ).toFixed(1)} hrs
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Avg Present Days:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {(summaryData.users_summary.reduce((sum, user) => 
                              sum + user.present_days, 0) / 
                              summaryData.users_summary.length
                            ).toFixed(1)} days
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Daily Trends Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Attendance Trends
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Number of users present, absent, and late each day in {monthNames[selectedMonth]} {selectedYear}
                    </Typography>
                    
                    {/* Line Chart */}
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={attendanceChartOptions}
                        series={attendanceChartSeries}
                        type="line"
                        height={400}
                      />
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Attendance Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Breakdown of attendance records for each day
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Present</TableCell>
                            <TableCell align="right">Late</TableCell>
                            <TableCell align="right">Incomplete</TableCell>
                            <TableCell align="right">Absent</TableCell>
                            <TableCell align="right">Attendance Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summaryData.daily_summary
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((day, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(day.date).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </TableCell>
                                <TableCell align="right">{day.present_count}</TableCell>
                                <TableCell align="right">{day.late_count}</TableCell>
                                <TableCell align="right">{day.incomplete_count}</TableCell>
                                <TableCell align="right">{day.absent_count}</TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${calculateAttendanceRate(day.present_count, day.present_count + day.absent_count)}%`}
                                    size="small"
                                    color={
                                      calculateAttendanceRate(day.present_count, day.present_count + day.absent_count) >= 90
                                        ? 'success'
                                        : calculateAttendanceRate(day.present_count, day.present_count + day.absent_count) >= 70
                                          ? 'primary'
                                          : 'default'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* User Performance Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Average Working Hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Average daily hours spent by each user
                    </Typography>
                    
                    {/* Hours Chart */}
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={hoursChartOptions}
                        series={hoursChartSeries}
                        type="bar"
                        height={350}
                      />
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} lg={6}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      User Attendance Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Detailed attendance statistics by user
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell align="right">Present</TableCell>
                            <TableCell align="right">Late</TableCell>
                            <TableCell align="right">Incomplete</TableCell>
                            <TableCell align="right">Avg. Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summaryData.users_summary.map((user, index) => (
                            <TableRow key={index}>
                              <TableCell>{user.name}</TableCell>
                              <TableCell align="right">
                                {user.present_days} / {summaryData.total_days} days
                              </TableCell>
                              <TableCell align="right">{user.late_days}</TableCell>
                              <TableCell align="right">{user.incomplete_days}</TableCell>
                              <TableCell align="right">
                                {(user.avg_duration_minutes / 60).toFixed(1)} hrs
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" gutterBottom>
                      Performance Indicators
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Attendance metrics and performance indicators
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {summaryData.users_summary.map((user, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card elevation={0} sx={{ 
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            borderRadius: 2
                          }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">{user.name}</Typography>
                                <Chip 
                                  label={`${Math.round((user.present_days / summaryData.total_days) * 100)}%`} 
                                  color={
                                    (user.present_days / summaryData.total_days) >= 0.9 
                                      ? 'success' 
                                      : (user.present_days / summaryData.total_days) >= 0.7 
                                        ? 'primary'
                                        : 'default'
                                  }
                                  size="small"
                                />
                              </Box>
                              
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Present Days:
                                  </Typography>
                                  <Typography variant="body2">
                                    {user.present_days} days
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Late Days:
                                  </Typography>
                                  <Typography variant="body2" color={user.late_days > 3 ? 'error.main' : 'text.primary'}>
                                    {user.late_days} days
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Avg. Hours:
                                  </Typography>
                                  <Typography variant="body2">
                                    {(user.avg_duration_minutes / 60).toFixed(1)} hrs
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Incomplete:
                                  </Typography>
                                  <Typography variant="body2" color={user.incomplete_days > 0 ? 'error.main' : 'text.primary'}>
                                    {user.incomplete_days} days
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Attendance Rate:
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.round((user.present_days / summaryData.total_days) * 100)} 
                                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                  color={
                                    (user.present_days / summaryData.total_days) >= 0.9 
                                      ? 'success' 
                                      : (user.present_days / summaryData.total_days) >= 0.7 
                                        ? 'primary'
                                        : 'error'
                                  }
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
}