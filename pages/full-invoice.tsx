import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { Spinner } from '../components';

interface FullInvoiceProps {
  invoice: {
    bolt11: string;
    invoice_id: string;
    order_id: number;
    amount_msat: string;
    description: string;
    status: string;
    created_at: string;
    expires_at: string;
    payment_hash: string;
  };
  onCheckStatus: () => void;
  loading: boolean;
}

const FullInvoice: React.FC<FullInvoiceProps> = ({ 
  invoice, 
  onCheckStatus,
  loading 
}) => {
  // Add status change debugging
  useEffect(() => {
    console.log('Invoice status changed:', invoice?.status);
  }, [invoice?.status]);

  // Add automatic status checking
  useInvoiceStatusCheck(invoice, (updatedInvoice) => {
    onCheckStatus(updatedInvoice);
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center'>
        <Spinner /> Loading...
      </div>
    );
  }

  return (
    <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
      <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>
        Full Invoice Details
      </h2>
      
      {/* Invoice and QR Code */}
      <div className='mb-4'>
        <label className='mb-2 block font-bold text-gray-700'>Invoice:</label>
        <div className='break-words rounded bg-gray-100 p-2'>
          <p className='text-xs'>{invoice.bolt11}</p>
        </div>
      </div>
      
      <div className='my-4 flex justify-center'>
        <QRCode value={invoice.bolt11} size={200} />
      </div>

      {/* Invoice Details */}
      <div className='mt-4 space-y-2'>
        <p><strong>Invoice ID:</strong> {invoice.invoice_id}</p>
        <p><strong>Order ID:</strong> {invoice.order_id}</p>
        <p><strong>Amount:</strong> {parseInt(invoice.amount_msat) / 1000} sats</p>
        <p><strong>Description:</strong> {invoice.description}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`font-bold ${
            invoice.status === 'paid' ? 'text-green-600' : 'text-orange-500'
          }`}>
            {invoice.status}
          </span>
        </p>
        <p><strong>Created At:</strong> {new Date(invoice.created_at).toLocaleString()}</p>
        <p><strong>Expires At:</strong> {new Date(invoice.expires_at).toLocaleString()}</p>
        <p><strong>Payment Hash:</strong> {invoice.payment_hash}</p>
      </div>

      {/* Only show button if not paid */}
      {invoice.status !== 'paid' && (
        <button
          onClick={() => {
            onCheckStatus();
          }}
          className='mt-6 w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600'
        >
          Check Invoice Status
        </button>
      )}

      {/* Show paid message if applicable */}
      {invoice.status === 'paid' && (
        <div className='mt-4 text-center text-green-600 font-bold'>
          Invoice has been paid!
        </div>
      )}
    </div>
  );
};
const useInvoiceStatusCheck = (invoice, onStatusChange) => {
  useEffect(() => {
    // Stop checking if invoice is paid
    if (!invoice?.payment_hash || invoice.status === 'paid') return;

    const checkStatus = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-full-invoice/${invoice.order_id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.data.invoice.status !== invoice.status) {
          onStatusChange(response.data.invoice);
        }
      } catch (error) {
        console.error('Error checking invoice status:', error);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [invoice?.payment_hash, invoice?.status]);
};

export default FullInvoice;
