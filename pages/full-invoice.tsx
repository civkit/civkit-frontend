import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { Spinner } from '../components';

interface FullInvoiceProps {
  invoice: any;  // Type this properly
  onCheckStatus: () => void;
  loading: boolean;
}

const FullInvoice: React.FC<FullInvoiceProps> = ({ 
  invoice, 
  onCheckStatus,
  loading 
}) => {
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Full Invoice Details</h2>
      {/* Display invoice details */}
      <button onClick={onCheckStatus}>
        Check Invoice Status
      </button>
    </div>
  );
};

export default FullInvoice;
