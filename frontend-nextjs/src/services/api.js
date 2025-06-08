// API Services
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Fetch attendance records
export const fetchAttendanceRecords = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/attendance`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return null;
  }
};

// Post attendance (check-in or check-out)
export const postAttendance = async (imageBlob, type = 'check_in') => {
  try {
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('type', type);
    
    const response = await fetch(`${apiUrl}/api/attend`, {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error posting attendance:', error);
    throw new Error('Failed to mark attendance');
  }
};

// Get attendance summary data
export const fetchAttendanceSummary = async (year, month) => {
  try {
    const response = await fetch(`${apiUrl}/api/attendance/summary?year=${year}&month=${month}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return null;
  }
};

// Export attendance data to CSV
export const exportAttendanceData = (filters = {}) => {
  // Construct query parameters from filters
  const queryParams = new URLSearchParams();
  
  if (filters.name) queryParams.append('name', filters.name);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.startDate) queryParams.append('start_date', filters.startDate);
  if (filters.endDate) queryParams.append('end_date', filters.endDate);
  
  // Create the export URL
  const exportUrl = `${apiUrl}/api/attendance/export?${queryParams.toString()}`;
  
  // Open in new tab/window
  window.open(exportUrl, '_blank');
};