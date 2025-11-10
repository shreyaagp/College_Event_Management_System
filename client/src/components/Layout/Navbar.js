import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      if (user?.role !== 'organiser') return;
      try {
        const res = await API.get('/notifications');
        if (mounted) setNotifCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        // ignore
      }
    };
    if (user?.role === 'organiser') fetchNotifications();
    return () => { mounted = false; };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav>
      <div className="nav-container">
        <Link to={user.role === "organiser" ? "/organiser" : "/"} className="logo">
          🎓 College Events
        </Link>

        <ul className="nav-links">
          {user.role === "student" ? (
            <>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/calendar">Calendar</Link></li>
              <li><Link to="/my-registrations">My Registrations</Link></li>
              <li><Link to="/proposed-events">Vote on Events</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/organiser">Dashboard</Link></li>
              <li><Link to="/organiser/create-event">Create Event</Link></li>
              <li><Link to="/organiser/manage-events">Manage Events</Link></li>
              <li><Link to="/organiser/proposed-events">Propose Events</Link></li>
              <li><Link to="/organiser/notifications">Notifications</Link></li>
            </>
          )}
          <li><Link to="/about">About</Link></li>
        </ul>

        <div className="user-info">
          <span>{user.name || user.email}</span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
