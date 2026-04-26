async function createAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'System Admin',
        email: 'admin@kazilog.com',
        password: 'password123',
        role: 'admin'
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create admin');
    
    console.log('Successfully created admin:', data);
  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
}

createAdmin();
