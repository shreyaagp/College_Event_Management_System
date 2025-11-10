import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const ScanQR = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [message, setMessage] = useState('');
  const [scannedIds, setScannedIds] = useState(new Set());

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    const startScanner = async () => {
      try {
        const devices = await codeReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          setMessage('❌ No camera found');
          return;
        }

        const selectedDeviceId = devices[0].deviceId;
        codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result, err) => {
          if (!active) return;

          if (result) {
            let qrCode;
            try {
              const scannedText = result.getText();
              // QR code might be plain text (qr_code) or JSON
              try {
                const parsed = JSON.parse(scannedText);
                qrCode = parsed.qr_code || scannedText;
              } catch {
                // If not JSON, use the text directly as qr_code
                qrCode = scannedText;
              }
            } catch {
              setMessage('❌ Invalid QR code format');
              return;
            }

            if (!qrCode) {
              setMessage('❌ QR code missing data');
              return;
            }

            if (scannedIds.has(qrCode)) {
              setMessage(`⚠️ This QR code has already been scanned`);
              return;
            }

            try {
              const res = await API.post('/scan-qr', { qr_code: qrCode, event_id: eventId });
              setMessage(`✅ ${res.data.message} - ${res.data.participant?.name || 'Student'}`);
              setScannedIds(prev => new Set(prev).add(qrCode));
            } catch (err) {
              console.error(err);
              setMessage(err.response?.data?.error || '❌ Failed to mark attendance');
            }
          }

          if (err && !(err instanceof DOMException)) {
            console.error('QR scan error:', err);
          }
        });
      } catch (err) {
        console.error(err);
        setMessage('❌ Failed to start camera');
      }
    };

    startScanner();

    return () => {
      active = false;
      codeReader.reset();
    };
  }, [eventId, scannedIds]);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>📷 Scan QR Code for Event ID: {eventId}</h2>
      <video ref={videoRef} style={{ width: '320px', height: '240px', border: '1px solid #ccc', borderRadius: '8px' }} />
      <p style={{ marginTop: '1rem', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>
      {scannedIds.size > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#333' }}>
          Scanned Student IDs: {Array.from(scannedIds).join(', ')}
        </div>
      )}
    </div>
  );
};

export default ScanQR;
