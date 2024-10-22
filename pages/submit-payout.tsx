import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitPayoutProps {
  orderId: string;
  onPayoutSubmitted?: () => void;
}

const SubmitPayout: React.FC<SubmitPayoutProps> = ({ orderId, onPayoutSubmitted }) => {
  const [lnInvoice, setLnInvoice] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('Fetching order details for orderId:', orderId);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Raw order details response:', response);
        console.log('Order details data:', response.data);
        if (response.data && response.data.order) {
          setOrderDetails(response.data.order);
          console.log('Set orderDetails to:', response.data.order);
          // Log all properties of the order object
          console.log('Order properties:', Object.keys(response.data.order));
        } else {
          console.error('Unexpected order details format:', response.data);
          setErrorMessage('Unexpected order details format');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response status:', error.response?.status);
          console.error('Response data:', error.response?.data);
        }
        setErrorMessage('Failed to fetch order details');
      }
    };

    if (orderId) {
      fetchOrderDetails();
    } else {
      console.error('No orderId provided to SubmitPayout component');
      setErrorMessage('No order ID provided');
    }
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    console.log('Submitting payout. Current orderDetails:', orderDetails);

    if (!orderDetails) {
      console.error('orderDetails is null or undefined');
      setErrorMessage('Order details not available');
      return;
    }

    if (!orderDetails.amount_msat) {
      console.error('amount_msat is missing from orderDetails:', orderDetails);
      setErrorMessage('Order amount not available');
      return;
    }

    // New validation logic
    const invoiceAmount = parseInvoiceAmount(lnInvoice);
    if (invoiceAmount !== orderDetails.amount_msat) {
      console.error('Invoice amount does not match order amount:', invoiceAmount, orderDetails.amount_msat);
      setErrorMessage('Invoice amount does not match order amount');
      return;
    }

    try {
      console.log('Submitting payout with orderId:', orderId, 'and invoice:', lnInvoice);
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

      console.log('Payout submission response:', response.data);

      if (response.data.message) {
        setSuccessMessage('Payout submitted successfully.');
        if (onPayoutSubmitted) onPayoutSubmitted();
      }
    } catch (error) {
      console.error('Error submitting payout:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Helper function to decode a Bech32 string
  const decodeBech32 = (bech32: string) => {
    const separatorIndex = bech32.lastIndexOf('1');
    if (separatorIndex === -1) {
        throw new Error('Invalid Bech32 string');
    }

    const prefix = bech32.substring(0, separatorIndex);
    const data = bech32.substring(separatorIndex + 1);

    return { prefix, data };
  };

  // Helper function to parse the amount from the Lightning invoice
  const parseInvoiceAmount = (invoice: string): number => {
    try {
        const { prefix, data } = decodeBech32(invoice);

        // Define known prefixes for different networks
        const knownPrefixes = ['lntbs', 'lntb', 'lnbc']; // Add or adjust prefixes as needed

        // Extract the network prefix (e.g., 'lntbs') and amount part (e.g., '20n')
        const networkPrefix = knownPrefixes.find(p => prefix.startsWith(p));
        if (!networkPrefix) {
            throw new Error(`Unknown prefix: ${prefix}`);
        }

        // Extract the amount part from the prefix
        const amountPart = prefix.substring(networkPrefix.length);

        // Parse the amount using the amount part
        const amountPattern = /^(\d+)([munp]?)$/; // Regex to capture amount and multiplier
        const match = amountPart.match(amountPattern);

        if (!match) {
            throw new Error('Invalid amount in invoice');
        }

        let amount = parseInt(match[1], 10);
        const multiplier = match[2];

        // Convert amount based on the multiplier
        switch (multiplier) {
            case 'm': // millibitcoin
                amount *= 100000000;
                break;
            case 'u': // microbitcoin
                amount *= 100000;
                break;
            case 'n': // nanobitcoin
                amount *= 100;
                break;
            case 'p': // picobitcoin
                amount /= 10;
                break;
            default: // no multiplier, assume satoshis
                amount *= 1000;
                break;
        }

        return amount;
    } catch (error) {
        console.error('Error decoding invoice:', error);
        return 0;
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Submit Payout</h2>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
      {!orderDetails ? (
        <p>Loading order details...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="lnInvoice" className="block text-sm font-medium text-gray-700">
              Lightning Invoice (Signet)
            </label>
            <input
              type="text"
              id="lnInvoice"
              value={lnInvoice}
              onChange={(e) => setLnInvoice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter Signet Lightning Invoice"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit Payout
          </button>
        </form>
      )}
    </div>
  );
};

export default SubmitPayout;
