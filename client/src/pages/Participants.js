import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';

const Participants = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) fetchParticipants();
    else setLoading(false);
  }, [eventId]);

  useEffect(() => {
  
    const checkLastScan = setInterval(() => {
      const last = localStorage.getItem('lastCheckedIn');
      if (last) {
        const updated = JSON.parse(last);
        setParticipants((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...p, checked_in: 1 } : p))
        );
        localStorage.removeItem('lastCheckedIn');
      }
    }, 3000);
    return () => clearInterval(checkLastScan);
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/organiser/event/${eventId}/participants`);
      setEvent(res.data.event);
      setParticipants(res.data.participants || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (registrationId) => {
    if (!window.confirm('Mark this student as attended?')) {
      return;
    }

    try {
      const res = await API.post(`/organiser/event/${eventId}/mark-attendance/${registrationId}`);
      alert(res.data.message || 'Attendance marked successfully');
      fetchParticipants(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading participants...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Participants</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/organiser/manage-events')}>
          ← Back
        </button>
      </div>

      {error && <div style={{ padding: '1rem', background: '#fee', color: '#c33', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}

      {event && <h3>{event.title}</h3>}

      {participants.length === 0 ? (
        <p>No participants registered yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th>Name</th>
              <th>Email</th>
              <th>USN</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.name || 'N/A'}</td>
                <td>{p.email || 'N/A'}</td>
                <td>{p.usn || 'N/A'}</td>
                <td>{p.department || 'N/A'}</td>
                <td>{p.semester || 'N/A'}</td>
                <td style={{ color: p.checked_in ? 'green' : 'orange' }}>
                  {p.checked_in ? '✓ Attended' : '⏳ Pending'}
                </td>
                <td>
                  {!p.checked_in && (
                    <button
                      onClick={() => handleMarkAttendance(p.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      Mark Attended
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Participants;
