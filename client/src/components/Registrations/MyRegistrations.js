import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import API from '../../api/api';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [qrCodes, setQrCodes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await API.get('/registrations/my-registrations');
      setRegistrations(response.data || []);

      // Fetch QR codes for all registrations
      const qrPromises = (response.data || []).map(async (reg) => {
        try {
          const qrRes = await API.get(`/qrcode/${reg.id}`);
          return { regId: reg.id, qrCode: qrRes.data.qr_code };
        } catch (err) {
          return { regId: reg.id, qrCode: null };
        }
      });

      const qrResults = await Promise.all(qrPromises);
      const qrMap = {};
      qrResults.forEach(({ regId, qrCode }) => {
        qrMap[regId] = qrCode;
      });
      setQrCodes(qrMap);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await API.delete(`/registrations/${registrationId}`);
      setRegistrations(registrations.filter(r => r.id !== registrationId));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel registration');
    }
  };

  if (loading) {
    return <div className="loading">Loading your registrations...</div>;
  }

  if (registrations.length === 0) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>My Registrations</h1>
        <div className="card">
          <p>You haven't registered for any events yet.</p>
          <Link to="/events">
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Browse Events
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Separate upcoming and past events
  const today = new Date();
  const upcoming = registrations.filter(reg => {
    const eventDate = new Date(`${reg.date}T${reg.time}`);
    return eventDate >= today;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

  const past = registrations.filter(reg => {
    const eventDate = new Date(`${reg.date}T${reg.time}`);
    return eventDate < today;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>My Registrations</h1>

      {upcoming.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Upcoming Events</h2>
          <div className="events-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "1.5rem" 
          }}>
            {upcoming.map(reg => (
              <div key={reg.id} className="event-card" style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "1.5rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}>
                <span className="department" style={{ 
                  display: "inline-block", 
                  padding: "0.25rem 0.75rem", 
                  background: "#007bff", 
                  color: "white", 
                  borderRadius: "4px", 
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem"
                }}>
                  {reg.department}
                </span>
                <h3>{reg.title}</h3>
                <div className="date-time">
                  📅 {new Date(reg.date).toLocaleDateString()} at {reg.time}
                </div>
                {reg.location && (
                  <div className="location">📍 {reg.location}</div>
                )}
                
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  Status: {reg.checked_in ? (
                    <span style={{ color: '#28a745' }}>✓ Checked In</span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>⏳ Pending Check-in</span>
                  )}
                </div>

                {qrCodes[reg.id] && (
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <QRCodeSVG value={qrCodes[reg.id]} size={150} />
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                      Your Digital Pass
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/events/${reg.event_id}`} style={{ flex: 1 }}>
                    <button className="btn btn-primary" style={{ width: '100%' }}>
                      View Event
                    </button>
                  </Link>
                  {reg.event_status === 'active' && (
                    <button
                      onClick={() => handleCancel(reg.id)}
                      className="btn btn-danger"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Past Events</h2>
          <div className="events-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "1.5rem" 
          }}>
            {past.map(reg => (
              <div key={reg.id} className="event-card" style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "1.5rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}>
                <span className="department" style={{ 
                  display: "inline-block", 
                  padding: "0.25rem 0.75rem", 
                  background: "#007bff", 
                  color: "white", 
                  borderRadius: "4px", 
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem"
                }}>
                  {reg.department}
                </span>
                <h3>{reg.title}</h3>
                <div className="date-time">
                  📅 {new Date(reg.date).toLocaleDateString()} at {reg.time}
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  {reg.checked_in ? (
                    <span style={{ color: '#28a745' }}>✓ Attended</span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>✗ Did not attend</span>
                  )}
                </div>

                <Link to={`/events/${reg.event_id}`}>
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
                    View Details & Feedback
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;