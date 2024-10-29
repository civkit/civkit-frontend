// components/LoginForm.js
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`,
        {
          username,
          password,
        }
      );

      const token = response.data.token;
      localStorage.setItem('token', token); // Store the token in local storage

      router.push('/dashboard'); // Redirect to create order page or another page
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div>
        <label>Username</label>
        <input
          type='text'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type='submit'>Login</button>
    </form>
  );
}
