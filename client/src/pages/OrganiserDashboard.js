import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const OrganiserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalFeedback: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/organiser/manage-events');
      const events = res.data || [];

      const today = new Date();
      const upcoming = events.filter(e => new Date(`${e.date}T${e.time}`) >= today);

      setStats({
        totalEvents: events.length,
        upcomingEvents: upcoming.length,
        totalFeedback: 0, 
      });

      setRecentEvents(events.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1>Organiser Dashboard</h1>
      <p style={{ color: '#666' }}>Welcome, {user?.name}!</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h2>{stats.totalEvents}</h2>
          <p>Total Events</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h2>{stats.upcomingEvents}</h2>
          <p>Upcoming Events</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link to="/organiser/create-event">
          <button className="btn btn-primary">+ Create New Event</button>
        </Link>
        <Link to="/organiser/manage-events">
          <button className="btn btn-secondary">Manage Events</button>
        </Link>
      </div>

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div>
          <h2>Recent Events</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {recentEvents.map(event => (
              <div key={event.id} className="event-card card" style={{ padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3>{event.title}</h3>
                <p style={{ color: '#666' }}>📅 {new Date(event.date).toLocaleDateString()} at {event.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganiserDashboard;