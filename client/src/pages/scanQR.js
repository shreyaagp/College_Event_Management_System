import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

const ScanQR = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [message, setMessage] = useState("");
  const [scannedIds, setScannedIds] = useState(new Set());
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null); // ✅ Store the camera stream

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let active = true;

    const startScanner = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          setMessage("❌ No camera found");
          return;
        }

        const selectedDeviceId = devices[0].deviceId;

        // ✅ Start camera manually to store its MediaStream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDeviceId },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // ✅ Decode continuously using ZXing
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (result, err) => {
            if (!active) return;

            if (result) {
              const scannedText = result.getText();
              console.log("Scanned QR:", scannedText);

              let qrCode;
              try {
                const parsed = JSON.parse(scannedText);
                qrCode = parsed.qr_code || scannedText;
              } catch {
                qrCode = scannedText;
              }

              if (!qrCode) {
                setMessage("❌ Invalid QR code");
                return;
              }

              if (scannedIds.has(qrCode)) {
                setMessage("⚠️ Already scanned this code");
                return;
              }

              try {
                const res = await API.post("/scan-qr", {
                  qr_code: qrCode,
                  event_id: eventId,
                });
                setMessage(
                  `✅ ${res.data.message} - ${
                    res.data.participant?.name || "Student"
                  }`
                );
                setScannedIds((prev) => new Set(prev).add(qrCode));
              } catch (err) {
                console.error(err);
                setMessage(
                  err.response?.data?.error || "❌ Failed to mark attendance"
                );
              }
            }

            if (err && !(err instanceof DOMException)) {
              console.error("QR scan error:", err);
            }
          }
        );
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to start camera");
      }
    };

    startScanner();

    // ✅ Proper cleanup
    return () => {
      active = false;

      // Stop ZXing decode loop
      if (codeReaderRef.current?.stopContinuousDecode) {
        codeReaderRef.current.stopContinuousDecode();
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Backward compatibility cleanup
      if (codeReaderRef.current?.reset) {
        try {
          codeReaderRef.current.reset();
        } catch {
          console.warn("reset() not available on this ZXing version");
        }
      }

      console.log("✅ Camera stopped and cleanup complete");
    };
  }, [eventId]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>📷 Scan QR Code for Event ID: {eventId}</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "320px",
          height: "240px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />
      <p
        style={{
          marginTop: "1rem",
          color: message.includes("✅") ? "green" : "red",
        }}
      >
        {message}
      </p>
      {scannedIds.size > 0 && (
        <div style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
          Scanned IDs: {Array.from(scannedIds).join(", ")}
        </div>
      )}
    </div>
  );
};

export default ScanQR;
