import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useNostr } from './useNostr';
import { GiOstrich } from 'react-icons/gi';
import QRCode from 'qrcode.react';
import { Spinner } from '../components';

interface TakeOrderProps {
  orderId?: string | string[];
  onOrderFetched?: (order: any) => void;
  onHoldInvoiceCreated?: (invoice: any) => void;
}

const TakeOrder: React.FC<TakeOrderProps> = ({ orderId: propOrderId, onOrderFetched, onHoldInvoiceCreated }) => {
  const router = useRouter();
  const { orderId: routerOrderId } = router.query;
  const [order, setOrder] = useState(null);
  const [takerHoldInvoice, setTakerHoldInvoice] = useState(null);
  const [error, setError] = useState('');
  const [nostrEventSent, setNostrEventSent] = useState(false);

  const { signAndSendEvent } = useNostr();

  const effectiveOrderId = propOrderId || routerOrderId;

  useEffect(() => {
    if (effectiveOrderId) {
      fetchOrderAndCreateInvoice();
      const intervalId = setInterval(() => checkHoldInvoiceStatus(), 5000);
      return () => clearInterval(intervalId);
    }
  }, [effectiveOrderId]);

  const fetchOrderAndCreateInvoice = async () => {
    try {
      const orderResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${effectiveOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setOrder(orderResponse.data);
      if (onOrderFetched) onOrderFetched(orderResponse.data);

      const invoiceResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/taker-invoice/${effectiveOrderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Taker hold invoice:', invoiceResponse.data.holdInvoice);
      setTakerHoldInvoice(invoiceResponse.data.holdInvoice);
      if (onHoldInvoiceCreated) onHoldInvoiceCreated(invoiceResponse.data.holdInvoice);
    } catch (error) {
      console.error(
        'Error fetching order or creating taker hold invoice:',
        error
      );
      setError('Failed to fetch order or create taker hold invoice');
    }
  };

  const checkHoldInvoiceStatus = async () => {
    try {
      const paymentHash = takerHoldInvoice?.payment_hash;
      if (!paymentHash) {
        console.error('No payment hash available for taker hold invoice');
        return;
      }

      console.log(
        'Checking status for taker hold invoice payment hash:',
        paymentHash
      );

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/holdinvoicelookup`,
        { payment_hash: paymentHash },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const invoiceState = response.data.state;
      setTakerHoldInvoice((prevState) => ({
        ...prevState,
        status: invoiceState,
      }));

      if (invoiceState === 'ACCEPTED') {
        console.log('Taker hold invoice has been paid!');
        // Handle paid state (e.g., show success message, update UI)
      }
    } catch (error) {
      console.error('Error checking taker hold invoice status:', error);
    }
  };

  const sendNostrEvent = async () => {
    try {
      const nostrEventData = {
        order_id: effectiveOrderId,
        amount_msat: order?.amount_msat,
        type: order?.type,
        status: 'taker_hold_invoice_paid',
        currency: order?.currency,
        payment_method: order?.payment_method,
      };
      await signAndSendEvent(nostrEventData, 1507);
      setNostrEventSent(true);
      console.log('Nostr event sent successfully');
    } catch (error) {
      console.error('Error sending Nostr event:', error);
    }
  };

  const handleRedirect = () => {
    if (order) {
      if (order.type === 0) {
        // Buy order
        const fullUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/full-invoice?orderid=${effectiveOrderId}`;
        console.log('Redirecting to full invoice page:', fullUrl);
        window.location.href = fullUrl;
      } else {
        // Sell order (type === 1)
        const payoutUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/submit-payout?orderId=${effectiveOrderId}`;
        console.log('Redirecting to submit payout page:', payoutUrl);
        window.location.href = payoutUrl;
      }
    }
  };

  return (
    <div className='flex flex-col gap-4 w-full h-full max-w-2xl rounded-lg bg-white p-8 text-center shadow-lg'>
      <h1 className='mb-6 text-3xl font-bold text-orange-500'>Take Order</h1>
        {error ? (
          <div className='flex min-h-screen items-center justify-center text-red-600'>
            Error: {error}
          </div>
        ) : !order || !takerHoldInvoice ? (
          <div className='flex gap-2 h-full w-full items-center justify-center text-green-500'>
            Loading...
            <Spinner />
          </div>
        ) : (
          <div className='flex flex-col gap-4 text-gray-700 dark:text-gray-700'>
            <div className='mb-8'>
              <h2 className='mb-4 text-2xl font-semibold'>Order Details</h2>
              <p className='mb-2'>
                <span className='font-semibold'>Order ID:</span> {order.order_id}
              </p>
              <p className='mb-2'>
                <span className='font-semibold'>Amount:</span> {order.amount_msat}{' '}
                msat
              </p>
              <p className='mb-2'>
                <span className='font-semibold'>Status:</span> {order.status}
              </p>
            </div>

            <div className='mb-8'>
              <h2 className='mb-4 text-2xl font-semibold'>Taker Hold Invoice</h2>
              <div className='mb-4 flex justify-center'>
                <QRCode value={takerHoldInvoice.bolt11} size={200} />
              </div>
              <div className='mb-4 rounded-lg bg-gray-100 p-4'>
                <p className='break-all font-mono text-sm'>
                  {takerHoldInvoice.bolt11}
                </p>
              </div>
              <p className='mb-2'>
                <span className='font-semibold'>Amount:</span>{' '}
                {takerHoldInvoice.amount_msat} msat
              </p>
              <p className='mb-4'>
                <span className='font-semibold'>Status:</span>
                <span
                  className={`ml-2 ${takerHoldInvoice.status === 'ACCEPTED' ? 'text-green-600' : 'text-yellow-600'}`}
                >
                  {takerHoldInvoice.status}
                </span>
              </p>
              {takerHoldInvoice.status === 'ACCEPTED' && (
                <p className='mb-4 font-semibold text-green-600'>
                  Hold invoice has been paid! Proceeding with the order...
                </p>
              )}
              <button
                onClick={() => checkHoldInvoiceStatus()}
                className='focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none'
              >
                Refresh Invoice Status
              </button>
            </div>

            {takerHoldInvoice.status === 'ACCEPTED' && !nostrEventSent && (
              <button
                onClick={sendNostrEvent}
                className='focus:shadow-outline mr-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none'
              >
                Send to Relay
              </button>
            )}

            {nostrEventSent && (
              <p className='mb-4 font-bold text-green-500'>
                Nostr event sent successfully!
              </p>
            )}

          </div>
        )}
    </div>
  );
};

export default TakeOrder;
