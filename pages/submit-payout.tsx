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
        order_id: parseInt(orderId),
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
          router.push(`/orders`);
        }, 2000);
      }
    } catch (error) {
      setErrorMessage('Error submitting payout. Please try again.');
      console.error('Error submitting payout:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Submit Payout</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lnInvoice">
              Lightning Invoice:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              id="lnInvoice"
              value={lnInvoice}
              onChange={(e) => setLnInvoice(e.target.value)}
              placeholder="Paste your Lightning Network invoice here"
              required
            />
          </div>
          {errorMessage && <p className="text-red-500 text-xs italic">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-xs italic">{successMessage}</p>}
          <div className="flex items-center justify-between">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Submit Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitPayout;
