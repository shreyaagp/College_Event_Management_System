import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, registrationsRes] = await Promise.all([
        API.get('/events'),
        API.get('/registrations/my-registrations'),
      ]);

      const allEvents = eventsRes.data?.data || [];
      const today = new Date();
      const upcoming = allEvents
        .filter(e => new Date(`${e.date}T${e.time}`) >= today)
        .slice(0, 6);

      setUpcomingEvents(upcoming);
      setMyRegistrations((registrationsRes.data || []).slice(0, 3));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Welcome, {user?.name}!</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Discover and register for exciting college events.
      </p>

      {/* --- Centered cards section --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        {[
          { to: '/events', icon: '📅', title: 'Browse Events', desc: 'Explore all available events' },
          { to: '/my-registrations', icon: '🎫', title: 'My Registrations', desc: 'View your registered events' },
          { to: '/proposed-events', icon: '🗳️', title: 'Vote on Events', desc: 'Propose and vote on events' },
        ].map((card, idx) => (
          <Link
            key={idx}
            to={card.to}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              textDecoration: 'none',
              background: '#f9f9f9',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
            }}
          >
            <h2 style={{ marginBottom: '0.5rem' }}>
              {card.icon} {card.title}
            </h2>
            <p style={{ color: '#555' }}>{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* --- My Registrations Section --- */}
      {myRegistrations.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>My Upcoming Registrations</h2>
          <div
            className="events-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {myRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="event-card"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <h3>{reg.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  📅 {new Date(reg.date).toLocaleDateString()} at {reg.time}
                </p>
                <Link to={`/events/${reg.event_id}`}>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    View Details
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Upcoming Events Section --- */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Upcoming Events</h2>
          <div
            className="events-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="event-card"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
              >
                <span
                  className="department"
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {event.department}
                </span>
                <h3>{event.title}</h3>
                {event.description && (
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {event.description.substring(0, 100)}
                    {event.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  📅 {new Date(event.date).toLocaleDateString()} at {event.time}
                </p>
                <Link to={`/events/${event.id}`}>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    View Details
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

export default Dashboard;
