// pages/submit-payout.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const SubmitPayout = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [lnInvoice, setLnInvoice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/payouts/submit', {
        order_id: orderId,
        ln_invoice: lnInvoice,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.message) {
        setSuccessMessage('Payout submitted successfully.');
        setTimeout(() => {
          router.push(`/order-details?orderId=${orderId}`);
        }, 2000);
      }
    } catch (error) {
      setErrorMessage('Error submitting payout. Please try again.');
      console.error('Error submitting payout:', error);
    }
  };

  return (
    <div className="container">
      <h1>Submit Payout</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Lightning Invoice:</label>
          <input
            type="text"
            value={lnInvoice}
            onChange={(e) => setLnInvoice(e.target.value)}
            placeholder="Paste your Lightning Network invoice here"
            required
          />
        </div>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        <button type="submit">Submit Payout</button>
      </form>
    </div>
  );
};

export default SubmitPayout;
