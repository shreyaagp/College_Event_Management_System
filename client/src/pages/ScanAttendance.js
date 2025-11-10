import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const ScanAttendance = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      const scannedText = data.text || data;
      setScanResult(scannedText);

      try {
        let qrCode;
        // Try to parse as JSON first, otherwise use text directly
        try {
          const parsed = JSON.parse(scannedText);
          qrCode = parsed.qr_code || scannedText;
        } catch {
          qrCode = scannedText;
        }

        const res = await API.post(
          '/registrations/checkin',
          { qr_code: qrCode }
        );

        setMessage(`✅ ${res.data.message} for ${res.data.event_title}`);

        // 💾 Store updated participant so Participants page refreshes automatically
        if (res.data.participant) {
          localStorage.setItem('lastCheckedIn', JSON.stringify(res.data.participant));
        }
      } catch (err) {
        const msg = err.response?.data?.error || '❌ Invalid or already used QR code';
        setMessage(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setMessage('Error accessing camera or scanning QR code.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Scan Participant QR Code</h2>
      <div className="bg-white shadow-md rounded-xl p-4 w-[320px]">
        <QrReader
          onResult={(result, error) => {
            if (result) handleScan(result);
            if (error) handleError(error);
          }}
          style={{ width: '100%' }}
        />
      </div>

      {message && <div className="mt-4 text-center text-lg font-medium text-gray-700">{message}</div>}
      {loading && <div className="mt-2 text-blue-500 animate-pulse">Processing...</div>}
    </div>
  );
};

export default ScanAttendance;
