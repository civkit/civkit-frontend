import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitPayoutProps {
  orderId: string;
  onPayoutSubmitted: () => void;
}

const SubmitPayout: React.FC<SubmitPayoutProps> = ({ orderId, onPayoutSubmitted }) => {
  const [lnInvoice, setLnInvoice] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setOrderDetails(response.data.order);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setErrorMessage('Failed to fetch order details');
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const validateInvoice = (invoice: string, orderAmountMsat: number) => {
    try {
      console.log('Invoice to validate:', invoice);
      console.log('Order amount (msat):', orderAmountMsat);

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

      console.log('Raw invoice amount:', amountStr, 'Unit:', unit);

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

      console.log('Decoded invoice amount (msat):', invoiceAmountMsat.toString());
      console.log('Order amount (msat):', orderAmountMsat);

      // Convert order amount to BigInt for comparison
      const orderAmountMsatBigInt = BigInt(orderAmountMsat);

      // Compare amounts
      if (invoiceAmountMsat !== orderAmountMsatBigInt) {
        throw new Error(`Invoice amount (${invoiceAmountMsat} msat) does not match order amount (${orderAmountMsatBigInt} msat)`);
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error(`Invalid invoice: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!orderDetails) {
      setErrorMessage('Order details not available');
      return;
    }

    try {
      validateInvoice(lnInvoice, orderDetails.amount_msat);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payouts/submit`,
        {
          order_id: parseInt(orderId),
          ln_invoice: lnInvoice,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.message) {
        setSuccessMessage('Payout submitted successfully.');
        onPayoutSubmitted();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error submitting payout:', error);
    }
  };

  if (!orderDetails) {
    return <div>Loading order details...</div>;
  }

  return (
    <div>
      <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>Submit Payout</h2>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor="lnInvoice" className='block text-sm font-medium text-gray-700'>
            Lightning Invoice
          </label>
          <input
            type="text"
            id="lnInvoice"
            value={lnInvoice}
            onChange={(e) => setLnInvoice(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
            placeholder="Enter Lightning Invoice"
            required
          />
        </div>
        <button
          type="submit"
          className='w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none focus:shadow-outline'
        >
          Submit Payout
        </button>
      </form>
    </div>
  );
};

export default SubmitPayout;
