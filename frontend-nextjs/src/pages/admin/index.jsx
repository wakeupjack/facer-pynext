// src/pages/admin/index.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, Container, Typography, Button, Paper, Grid, Card, CardContent, 
  Avatar, IconButton, Divider, Tabs, Tab, LinearProgress, 
  List, ListItem, ListItemText, ListItemIcon, ListItemAvatar,
  Badge, Chip, Tooltip, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AssignmentInd as AssignmentIndIcon,
  BarChart as BarChartIcon,
  Face as FaceIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import Chart from 'react-apexcharts';

// Dummy data untuk chart
const attendanceChartOptions = {
  chart: {
    type: 'area',
    height: 350,
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  colors: ['#4CAF50', '#F44336'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.2,
      stops: [0, 90, 100]
    }
  },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    labels: {
      style: {
        fontSize: '12px'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        fontSize: '12px'
      }
    }
  },
  legend: {
    position: 'top'
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
    }
  }
};

const attendanceChartSeries = [
  {
    name: 'Present',
    data: [76, 85, 90, 80, 88, 60, 78]
  },
  {
    name: 'Absent',
    data: [24, 15, 10, 20, 12, 40, 22]
  }
];

const pieChartOptions = {
  chart: {
    type: 'donut',
  },
  colors: ['#4CAF50', '#FF9800', '#F44336'],
  labels: ['On Time', 'Late', 'Absent'],
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

const pieChartSeries = [65, 20, 15];

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

// Mock data pengguna
const usersData = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "User", hasFaceRegistered: false, lastActive: "2025-06-06 09:30:22" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", hasFaceRegistered: true, lastActive: "2025-06-06 08:15:05" },
  { id: 3, name: "Robert Johnson", email: "robert@example.com", role: "User", hasFaceRegistered: false, lastActive: "2025-06-05 17:45:33" },
  { id: 4, name: "Emily Davis", email: "emily@example.com", role: "User", hasFaceRegistered: true, lastActive: "2025-06-06 10:20:18" },
  { id: 5, name: "Admin User", email: "admin@example.com", role: "Admin", hasFaceRegistered: true, lastActive: "2025-06-06 15:26:13" }
];

// Recent activities data
const recentActivities = [
  { id: 1, user: "Jane Smith", action: "marked attendance", time: "08:15 AM", success: true, avatar: "JS" },
  { id: 2, user: "John Doe", action: "attempted to mark attendance", time: "09:30 AM", success: false, avatar: "JD" },
  { id: 3, user: "Emily Davis", action: "marked attendance", time: "10:20 AM", success: true, avatar: "ED" },
  { id: 4, user: "Robert Johnson", action: "was marked absent", time: "11:00 AM", success: false, avatar: "RJ" },
  { id: 5, user: "Admin User", action: "added a new user", time: "12:45 PM", success: true, avatar: "AU" }
];

// Admin Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [todayDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  // Check admin authentication
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('adminUser');
      if (!storedUser) {
        router.push('/admin/login');
        return;
      }
      
      setAdminUser(JSON.parse(storedUser));
      // Simulasi loading data users
      setLoading(true);
      setTimeout(() => {
        setUsers(usersData);
        setLoading(false);
      }, 1000);
    };
    
    checkAuth();
  }, [router]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };
  
  const handleRegisterFace = (userId) => {
    router.push(`/admin/register-face/${userId}`);
  };
  
  if (!adminUser) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          bgcolor: 'background.paper',
          boxShadow: 2,
          position: 'fixed',
          height: '100vh',
          zIndex: 10,
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 45, height: 45, fontSize: '1.3rem' }}>A</Avatar>
          <Box>
            <Typography variant="h6" noWrap>
              Face Recognition
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              Admin Panel
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ px: 3, py: 1 }}>
          <Box sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
              {adminUser?.name?.charAt(0) || 'A'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {adminUser?.name || 'Admin'}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize="12px">
                {adminUser?.email || 'admin@example.com'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider />
        
        <List sx={{ px: 2 }}>
          <ListItem 
            button 
            selected={tabValue === 0}
            onClick={() => setTabValue(0)}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <DashboardIcon color={tabValue === 0 ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{ 
                fontWeight: tabValue === 0 ? 'bold' : 'normal'
              }}
            />
          </ListItem>
          
          <ListItem 
            button 
            selected={tabValue === 1}
            onClick={() => setTabValue(1)}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <FaceIcon color={tabValue === 1 ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Face Registration" 
              primaryTypographyProps={{ 
                fontWeight: tabValue === 1 ? 'bold' : 'normal'
              }}
            />
            <Badge badgeContent={users.filter(u => !u.hasFaceRegistered && u.role !== 'Admin').length} color="error" />
          </ListItem>
          
          <ListItem 
            button 
            selected={tabValue === 2}
            onClick={() => setTabValue(2)}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <PeopleIcon color={tabValue === 2 ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Users" 
              primaryTypographyProps={{ 
                fontWeight: tabValue === 2 ? 'bold' : 'normal'
              }}
            />
          </ListItem>
          
          <ListItem 
            button 
            selected={tabValue === 3}
            onClick={() => setTabValue(3)}
            sx={{ 
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <AssignmentIndIcon color={tabValue === 3 ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Attendance" 
              primaryTypographyProps={{ 
                fontWeight: tabValue === 3 ? 'bold' : 'normal'
              }}
            />
          </ListItem>
          
          <ListItem 
            button 
            selected={tabValue === 4}
            onClick={() => setTabValue(4)}
            sx={{ 
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.light' }
              }
            }}
          >
            <ListItemIcon>
              <BarChartIcon color={tabValue === 4 ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Reports" 
              primaryTypographyProps={{ 
                fontWeight: tabValue === 4 ? 'bold' : 'normal'
              }}
            />
          </ListItem>
        </List>
        
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            fullWidth
            onClick={handleLogout}
            sx={{ borderRadius: 2 }}
          >
            Logout
          </Button>
          <Typography variant="caption" display="block" textAlign="center" mt={1} color="text.secondary">
            © 2025 Face Recognition System
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          ml: { xs: 0, md: '280px' }, 
          width: { xs: '100%', md: 'calc(100% - 280px)' }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {tabValue === 0 && 'Dashboard'}
              {tabValue === 1 && 'Face Registration'}
              {tabValue === 2 && 'Users Management'}
              {tabValue === 3 && 'Attendance Records'}
              {tabValue === 4 && 'Reports & Analytics'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {todayDate} | Welcome back, {adminUser.name}!
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                <Badge badgeContent={4} color="error">
                  <NotificationsActiveIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Button 
                variant="contained" 
                onClick={() => router.push('/')}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Attendance Page
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Stats Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="medium">
                      Total Users
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {users.length}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: '16px', color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" color="success.main" fontWeight="medium">
                        +12% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                    <PeopleIcon sx={{ color: 'primary.main' }} fontSize="large" />
                  </Avatar>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="medium">
                      Faces Registered
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {users.filter(user => user.hasFaceRegistered).length}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight="medium">
                        <span style={{ color: '#4CAF50' }}>{Math.round(users.filter(user => user.hasFaceRegistered).length / users.length * 100)}%</span> of users
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 56, height: 56 }}>
                    <FaceIcon sx={{ color: 'secondary.main' }} fontSize="large" />
                  </Avatar>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="medium">
                      Today's Attendance
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      78
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight="medium">
                        <span style={{ color: '#4CAF50' }}>85%</span> present rate
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                    <CheckCircleOutlineIcon sx={{ color: 'success.main' }} fontSize="large" />
                  </Avatar>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="medium">
                      Pending Registrations
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {users.filter(u => !u.hasFaceRegistered && u.role !== 'Admin').length}
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small"
                      color="primary"
                      onClick={() => setTabValue(1)}
                      sx={{ p: 0, minWidth: 'auto' }}
                    >
                      Register now
                    </Button>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                    <PersonAddIcon sx={{ color: 'warning.main' }} fontSize="large" />
                  </Avatar>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Weekly Attendance Overview
                  </Typography>
                  <Chip 
                    label="This Week" 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                  />
                </Box>
                
                <Chart
                  options={attendanceChartOptions}
                  series={attendanceChartSeries}
                  type="area"
                  height={350}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Today's Attendance Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: 92 users
                  </Typography>
                </Box>

                <Chart
                  options={pieChartOptions}
                  series={pieChartSeries}
                  type="donut"
                  height={260}
                />
                
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        On Time
                      </Typography>
                      <Typography align="center" variant="h6" fontWeight="bold" color="success.main">
                        65%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        Late
                      </Typography>
                      <Typography align="center" variant="h6" fontWeight="bold" color="warning.main">
                        20%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        Absent
                      </Typography>
                      <Typography align="center" variant="h6" fontWeight="bold" color="error.main">
                        15%
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activities and Quick Actions */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Recent Activities
                </Typography>
                
                <List sx={{ py: 0 }}>
                  {recentActivities.map((activity) => (
                    <ListItem 
                      key={activity.id}
                      disablePadding 
                      sx={{ pt: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.success ? 'success.light' : 'error.light' }}>
                          {activity.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography variant="body2">
                            <Typography component="span" fontWeight="bold">
                              {activity.user}
                            </Typography> {activity.action}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Today at {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                      {activity.success ? (
                        <Chip 
                          label="Success" 
                          color="success" 
                          variant="outlined" 
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      ) : (
                        <Chip 
                          label="Failed" 
                          color="error" 
                          variant="outlined" 
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="text" size="small">
                    View All Activities
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      fullWidth 
                      startIcon={<PersonAddIcon />}
                      onClick={() => setTabValue(2)}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Add User
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      fullWidth 
                      startIcon={<FaceIcon />}
                      onClick={() => setTabValue(1)}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Register Face
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      color="success" 
                      fullWidth 
                      startIcon={<AssignmentIndIcon />}
                      onClick={() => setTabValue(3)}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      View Attendance
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      color="info" 
                      fullWidth 
                      startIcon={<BarChartIcon />}
                      onClick={() => setTabValue(4)}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Generate Report
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  System Status
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Face API Service</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      Online
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={100} 
                    color="success"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Database Storage</Typography>
                    <Typography variant="body2" color="info.main" fontWeight="medium">
                      46% used
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={46} 
                    color="info"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Camera Status</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      Connected
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={100} 
                    color="success"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Face Registration Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Register User Faces
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add facial recognition data for users to enable attendance tracking.
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {users
                .filter(user => user.role !== 'Admin') // Exclude admin users
                .map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Paper elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: 4, 
                      height: '100%',
                      border: user.hasFaceRegistered ? '1px solid' : 'none',
                      borderColor: user.hasFaceRegistered ? 'success.light' : 'transparent',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: user.hasFaceRegistered ? 'success.light' : 'warning.light', mr: 2 }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        {user.hasFaceRegistered && (
                          <Chip 
                            icon={<CheckCircleOutlineIcon />} 
                            label="Registered" 
                            color="success" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          Last active: {user.lastActive || 'Never'}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant={user.hasFaceRegistered ? "outlined" : "contained"}
                        color={user.hasFaceRegistered ? "secondary" : "primary"}
                        sx={{ mt: 3, borderRadius: 2 }}
                        fullWidth
                        onClick={() => handleRegisterFace(user.id)}
                      >
                        {user.hasFaceRegistered ? 'Update Face' : 'Register Face'}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">
            Users Management
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Add, update, or remove users from the system.
          </Typography>
        </TabPanel>
        
        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6">
            Attendance Records
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            View and manage daily attendance records.
          </Typography>
        </TabPanel>
        
        {/* Reports Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6">
            Reports & Analytics
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Generate analytical reports for attendance patterns.
          </Typography>
        </TabPanel>
        
        {/* Footer */}
        <Box sx={{ mt: 4, py: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 Face Recognition Attendance System. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Version 1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}