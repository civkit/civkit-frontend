// components/LoginForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Spinner from './Spinner';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`,
        { username, password }
      );
      localStorage.setItem('token', response.data.token);
      router.push('/take-order');
    } catch (error) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? <Spinner /> : 'Login'}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
};

export default LoginForm;
