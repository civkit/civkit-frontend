// pages/register.js
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invoice, setInvoice] = useState('');
  const router = useRouter();

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/register', { username, password }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setInvoice(response.data.invoice);
      router.push(`/registerPayment?username=${username}`); // Redirect to payment page
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <label>
          Username:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterForm;
