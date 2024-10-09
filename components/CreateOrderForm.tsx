import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CreateOrderFormProps {}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  onOrderCreated,
}) => {
  const [orderDetails, setOrderDetails] = useState('');
  const [amountMsat, setAmountMsat] = useState('');
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const timestamp = Date.now();
      const uniqueLabel = `order_${timestamp}`;

      const orderData = {
        order_details: orderDetails,
        amount_msat: parseInt(amountMsat),
        currency,
        payment_method: paymentMethod,
        status: 'Pending',
        type,
      };

      console.log('Submitting order data:', orderData);

      // Post order data to create the order
      const orderResponse = await axios.post<{ order: Order }>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      console.log('Order creation response:', orderResponse.data);

      if (!orderResponse.data.order || !orderResponse.data.order.order_id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.data.order.order_id;

      // Post hold invoice with unique label
      const holdInvoiceResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/holdinvoice`,
        {
          amount_msat: parseInt(amountMsat),
          label: uniqueLabel,
          description: orderDetails,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      console.log('Hold invoice response:', holdInvoiceResponse.data);

      if (!holdInvoiceResponse.data.payment_hash) {
        throw new Error('Failed to create hold invoice');
      }

      onOrderCreated(orderResponse.data.order);
      toast.success('Order created successfully!');

      // Redirect to order details page
      router.push(`/orders/${orderId}`);

      // If it's a sell order, start polling for hold invoice payment
      if (type === 1) {
        pollHoldInvoiceStatus(holdInvoiceResponse.data.payment_hash, orderId);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order.');
    }
  };

  const pollHoldInvoiceStatus = async (
    paymentHash: string,
    orderId: number
  ) => {
    const checkStatus = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/holdinvoicelookup`,
          { payment_hash: paymentHash },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        console.log('Hold invoice status:', response.data);

        if (response.data.state === 'accepted') {
          // Redirect to full invoice page
          router.push(`/full-invoice?orderId=${orderId}`);
        } else {
          // Continue polling
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('Error checking hold invoice status:', error);
        // Retry after a delay
        setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
  };

  return (
    <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
      <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>
        Create a New Order
      </h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='orderDetails'
          >
            Order Details
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='orderDetails'
            type='text'
            value={orderDetails}
            onChange={(e) => setOrderDetails(e.target.value)}
            required
            placeholder='Order details'
          />
        </div>
        <div className='mb-4'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='amountMsat'
          >
            Amount (msat)
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='amountMsat'
            type='number'
            value={amountMsat}
            onChange={(e) => setAmountMsat(e.target.value)}
            required
            placeholder='Amount in msats'
          />
        </div>
        <div className='mb-4'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='currency'
          >
            Currency
          </label>
          <select
            className='focus:shadow-outline w-full appearance-none rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='currency'
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          >
            <option value='' disabled>
              Select currency
            </option>
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </select>
        </div>
        <div className='mb-4'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='paymentMethod'
          >
            Payment Method
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='paymentMethod'
            type='text'
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          />
        </div>
        <div className='mb-6'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='type'
          >
            Order Type
          </label>
          <select
            className='focus:shadow-outline w-full appearance-none rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='type'
            value={type}
            onChange={(e) => setType(parseInt(e.target.value))}
            required
          >
            <option value={0}>Buy</option>
            <option value={1}>Sell</option>
          </select>
        </div>
        <div className='flex items-center justify-between'>
          <button
            className='focus:shadow-outline w-full rounded-lg bg-green-600 px-2 py-2 font-bold text-white hover:bg-green-700 focus:outline-none'
            type='submit'
          >
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderForm;
