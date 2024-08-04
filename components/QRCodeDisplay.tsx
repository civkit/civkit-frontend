// components/QRCodeDisplay.js
import QRCode from 'qrcode.react';

export default function QRCodeDisplay({ value }) {
  return (
    <div>
      <QRCode value={value} />
      <p>{value}</p>
    </div>
  );
}
