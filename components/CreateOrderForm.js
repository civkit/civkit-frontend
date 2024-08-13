import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const CreateOrderForm = ({ onOrderCreated }) => {
  const [orderDetails, setOrderDetails] = useState('');
  const [amountMsat, setAmountMsat] = useState('');
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [type, setType] = useState(0); // Default to Buy Order
  const router = useRouter();

  useEffect(() => {
    // Fetch currencies from the JSON file
    const fetchCurrencies = async () => {
      const response = await fetch('/currencies.json');
      const data = await response.json();
      setCurrencies(Object.entries(data).map(([id, code]) => ({ id, code })));
    };
    fetchCurrencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        order_details: orderDetails,
        amount_msat: parseInt(amountMsat),
        currency,
        payment_method: paymentMethod,
        status: 'Pending',
        type,
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.order) {
        onOrderCreated(response.data.order);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Create a New Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="orderDetails">
              Order Details
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="orderDetails"
              type="text"
              value={orderDetails}
              onChange={(e) => setOrderDetails(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amountMsat">
              Amount (msat)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="amountMsat"
              type="number"
              value={amountMsat}
              onChange={(e) => setAmountMsat(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
              Currency
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="" disabled>Select currency</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
              Payment Method
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="paymentMethod"
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
              Order Type
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="type"
              value={type}
              onChange={(e) => setType(parseInt(e.target.value))}
              required
            >
              <option value={0}>Buy</option>
              <option value={1}>Sell</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Create Order
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => router.push('/orders')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderForm;
