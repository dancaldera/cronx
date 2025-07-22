const axios = require('axios');

async function createUser() {
  try {
    const userData = {
      email: 'dancaldera@proton.me',
      username: 'dancaldera',
      password: 'admin123!',
      firstName: 'Dan',
      lastName: 'Caldera'
    };

    console.log('Creating user...');
    
    const response = await axios.post('http://localhost:3001/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ User created successfully!');
      console.log('User ID:', response.data.data.user.id);
      console.log('Email:', response.data.data.user.email);
      console.log('Username:', response.data.data.user.username);
      console.log('Access Token:', response.data.data.tokens.accessToken.substring(0, 50) + '...');
    } else {
      console.error('❌ Failed to create user:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data.error || error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
      console.error('Make sure the API server is running on http://localhost:3001');
    }
  }
}

createUser();