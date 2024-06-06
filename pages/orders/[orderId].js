// pages/orders/[orderId].js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const OrderDetails = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentHash, setPaymentHash] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const fetchOrder = async () => {
    try {
      console.log(`Fetching order with ID: ${orderId}`);
      const response = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Order fetched:', response.data);
      setOrder(response.data);

      console.log(`Fetching invoice for order ID: ${orderId}`);
      const invoiceResponse = await axios.get(`http://localhost:3000/api/invoice/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Invoice fetched:', invoiceResponse.data);
      setInvoice(invoiceResponse.data.bolt11);
      setPaymentHash(invoiceResponse.data.payment_hash);

      // Check if the invoice is accepted
      checkInvoiceStatus(invoiceResponse.data.payment_hash);
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash) => {
    try {
      console.log('Syncing invoices...');
      // Sync invoices
      await axios.post('http://localhost:3000/api/sync-invoices', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log(`Checking invoice status for payment hash: ${paymentHash}`);
      // Check invoice status
      const response = await axios.post('http://localhost:3000/api/holdinvoicelookup', {
        payment_hash: paymentHash
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Invoice status response:', response.data);

      if (response.data.state === 'accepted') {
        console.log('Invoice accepted');
        setIsAccepted(true);
      } else {
        console.log('Invoice not yet accepted');
        setIsAccepted(false);
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (invoice && paymentHash && !isAccepted) {
      const interval = setInterval(() => {
        checkInvoiceStatus(paymentHash);
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [invoice, paymentHash, isAccepted]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {order.order_id}</p>
      <p>Order Details: {order.order_details}</p>
      <p>Amount: {order.amount_msat}</p>
      <p>Currency: {order.currency}</p>
      <p>Payment Method: {order.payment_method}</p>
      <p>Status: {order.status}</p>
      <p>Type: {order.type === 0 ? 'Buy' : 'Sell'}</p>

      {invoice ? (
        <div>
          <h2>Pay the Invoice</h2>
          <p>Bolt11 Invoice: {invoice}</p>
          <QRCode value={invoice} />
          {isAccepted && <p>Payment received and bond locked!</p>}
        </div>
      ) : (
        <p>Loading invoice...</p>
      )}
    </div>
  );
};

export default OrderDetails;
