// src/pages/admin/users.jsx
// Tambahkan ini di bagian atas file
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// ...kode lainnya

// Ubah fungsi fetchUsers untuk mengambil data user dari sistem
const fetchUsers = async () => {
  setLoading(true);
  try {
    // Dalam implementasi nyata, Anda akan mengambil data dari API
    // Untuk sementara, kita masih menggunakan data dummy
    // karena backend Flask tidak memiliki endpoint untuk daftar users
    
    // const response = await fetch(`${apiUrl}/api/users`);
    // const data = await response.json();
    // if (response.ok) {
    //   setUsers(data);
    // } else {
    //   setError(data.error || 'Failed to fetch users');
    // }
    
    // Data dummy
    setUsers(usersData);
  } catch (err) {
    console.error('Error fetching users:', err);
    setError('An error occurred while fetching users');
  } finally {
    setLoading(false);
  }
};