import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import FeedbackSection from '../Feedback/FeedbackSection';
import API from '../../api/api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, registrationsRes] = await Promise.all([
        API.get(`/events/${id}`),
        API.get('/registrations/my-registrations'),
      ]);

      setEvent(eventRes.data?.data || null);

      const userReg = (registrationsRes.data || []).find(r => r.event_id === parseInt(id, 10));
      setRegistration(userReg);

      if (userReg) {
        try {
          const qrRes = await API.get(`/qrcode/${userReg.id}`);
          setQrCode(qrRes.data.qr_code);
        } catch (err) {
          console.error('Error fetching QR code:', err);
        }
      } else {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await API.post('/registrations', { event_id: parseInt(id, 10) });
      setSuccess('Successfully registered for this event!');
      setError('');
      setTimeout(fetchEventDetails, 600);
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      setSuccess('');
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      await API.delete(`/registrations/${registration.id}`);
      setSuccess('Registration cancelled successfully');
      setError('');
      setRegistration(null);
      setQrCode(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to cancel registration');
      setSuccess('');
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return (
      <div className="container">
        <div className="alert alert-error">Event not found</div>
        <button onClick={() => navigate('/events')} className="btn btn-secondary">
          Back to Events
        </button>
      </div>
    );
  }

  const eventDateTime = new Date(`${event.date}T${event.time}`);
  const isPastEvent = eventDateTime < new Date();

  return (
    <div className="container">
      <button onClick={() => navigate('/events')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back to Events
      </button>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {event.image && (
          <img 
            src={`http://localhost:5001${event.image}`} 
            alt={event.title}
            style={{
              width: "100%",
              height: "300px",
              objectFit: "cover",
              borderRadius: "8px 8px 0 0",
              marginBottom: "1rem"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <span className="department">{event.department}</span>
            <h1 style={{ marginTop: '1rem' }}>{event.title}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Created by: {event.created_by_name || 'Admin'}
            </div>
          </div>
        </div>

        {event.description && (
          <p style={{ marginTop: '1rem', marginBottom: '1rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
            {event.description}
          </p>
        )}

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <strong>📅 Date:</strong>
            <div style={{ marginTop: '0.5rem', color: '#666' }}>
              {eventDateTime.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </div>
          </div>
          <div>
            <strong>🕐 Time:</strong>
            <div style={{ marginTop: '0.5rem', color: '#666' }}>{event.time}</div>
          </div>
          {event.location && (
            <div>
              <strong>📍 Location:</strong>
              <div style={{ marginTop: '0.5rem', color: '#666' }}>{event.location}</div>
            </div>
          )}
          <div>
            <strong>👥 Participants:</strong>
            <div style={{ marginTop: '0.5rem', color: '#666' }}>
              {event.registered_count || 0}
              {event.max_participants && ` / ${event.max_participants} max`}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
          {!registration ? (
            <div>
              {event.status !== 'active' ? (
                <div className="alert alert-error">This event is not active</div>
              ) : isPastEvent ? (
                <div className="alert alert-error">This event has already passed</div>
              ) : (
                <button onClick={handleRegister} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                  Register for this Event
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                ✓ You are registered for this event
              </div>
              
              {qrCode && (
                <div className="qr-code-container" style={{ marginBottom: '1rem' }}>
                  <h3>Your Digital Pass (QR Code)</h3>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <QRCodeSVG value={qrCode} size={200} />
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Show this QR code at the event for check-in
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                    Code: {qrCode.substring(0, 8)}...
                  </p>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  Status: {registration.checked_in ? (
                    <span style={{ color: '#28a745' }}>✓ Checked In</span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>⏳ Pending Check-in</span>
                  )}
                </p>
                <button onClick={handleCancelRegistration} className="btn btn-danger">
                  Cancel Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {registration && registration.checked_in === 1 && isPastEvent && (
        <FeedbackSection eventId={parseInt(id, 10)} />
      )}
    </div>
  );
};

export default EventDetail;