// components/Dashboard/AttendanceChart.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AttendanceChart = ({ data }) => {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: 400 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Monthly Attendance Statistics</Typography>
      <Box sx={{ height: '90%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#4caf50" name="Present" />
            <Bar dataKey="absent" fill="#f44336" name="Absent" />
            <Bar dataKey="late" fill="#ff9800" name="Late" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default AttendanceChart;