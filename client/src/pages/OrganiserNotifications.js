import React, { useEffect, useState } from 'react';
import API from '../api/api';

const OrganiserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get('/notifications');
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading notifications...</div>;
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2>Recent Activity</h2>
      {error && <div className="alert alert-error" style={{ margin: '1rem 0' }}>{error}</div>}

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map((notif) => (
              <li key={notif.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
                <p style={{ margin: 0 }}>{notif.message}</p>
                <small style={{ color: '#777' }}>
                  {notif.event_title ? `Event: ${notif.event_title}` : ''}
                  {notif.created_at ? ` • ${new Date(notif.created_at).toLocaleString()}` : ''}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrganiserNotifications;

