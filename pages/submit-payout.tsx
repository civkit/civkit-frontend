import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { decode } from 'bolt11';

const SubmitPayout = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [lnInvoice, setLnInvoice] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setErrorMessage('Error fetching order details. Please try again.');
    }
  };

  const validateInvoice = (invoice, orderAmount) => {
    try {
      console.log('Invoice to validate:', invoice);
      
      // Check if the invoice starts with the Signet prefix
      if (!invoice.startsWith('lntbs')) {
        throw new Error('Invalid invoice: Not a Signet invoice');
      }

      // Extract the amount part
      const amountMatch = invoice.match(/lntbs(\d+)([pnum]?)/i);
      if (!amountMatch) {
        throw new Error('Unable to extract amount from invoice');
      }

      const [, amountStr, unit] = amountMatch;
      let invoiceAmountMsat = BigInt(amountStr);

      // Convert to millisatoshis based on the unit
      switch (unit.toLowerCase()) {
        case 'p':
          invoiceAmountMsat *= BigInt(10); // pico-BTC to msat
          break;
        case 'n':
          invoiceAmountMsat *= BigInt(100); // nano-BTC to msat
          break;
        case 'u':
          invoiceAmountMsat *= BigInt(100000); // micro-BTC to msat
          break;
        case 'm':
          invoiceAmountMsat *= BigInt(100000000); // milli-BTC to msat
          break;
        case '':
          invoiceAmountMsat *= BigInt(100000000); // BTC to msat
          break;
        default:
          throw new Error('Unsupported amount unit in invoice');
      }

      console.log('Decoded invoice amount:', invoiceAmountMsat.toString(), 'msat');
      
      // Check if the invoice amount matches the order amount
      if (invoiceAmountMsat !== BigInt(orderAmount)) {
        throw new Error(`Invoice amount (${invoiceAmountMsat} msat) does not match order amount (${orderAmount} msat)`);
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error(`Invalid invoice: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Validate the invoice
      validateInvoice(lnInvoice, orderDetails.amount_msat);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payouts/submit`, {
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
      setErrorMessage(error.message);
      console.error('Error submitting payout:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Submit Payout</h1>
        {orderDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700"><strong>Order ID:</strong> {orderDetails.order_id}</p>
            <p className="text-gray-700"><strong>Amount:</strong> {orderDetails.amount_msat} msat</p>
            <p className="text-gray-700"><strong>Currency:</strong> {orderDetails.currency}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={lnInvoice}
            onChange={(e) => setLnInvoice(e.target.value)}
            placeholder="Enter Signet Lightning Invoice"
            required
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button 
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit Payout
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitPayout;
