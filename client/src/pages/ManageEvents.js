import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const ManageEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/organiser/manage-events');
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/organiser/delete-event/${eventId}`);
      await fetchEvents();
      alert('Event deleted successfully!');
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || 'Failed to delete event';
      alert(message);
    }
  };

  const handleEditClick = (event) => {
    setEditingEventId(event.id);
    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      max_participants: event.max_participants || 0,
      department: event.department || '',
    });
    setEditImageFile(null);
    setEditImagePreview(event.image ? `http://localhost:5001${event.image}` : null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'max_participants' ? Number(value) : value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (eventId) => {
    try {
      const formData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => formData.append(key, value));
      if (editImageFile) formData.append('image', editImageFile);

      await API.put(`/organiser/update-event/${eventId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Event updated successfully!');
      setEditingEventId(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      fetchEvents();
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.error || 'Failed to update event');
    }
  };

  const viewParticipants = (eventId) => navigate(`/organiser/participants/${eventId}`);
  const scanQRCode = (eventId) => navigate(`/organiser/scan/${eventId}`);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem' }}>Loading events...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage My Events</h2>
        <Link to="/organiser/create-event">
          <button className="btn btn-primary">+ Create New Event</button>
        </Link>
      </div>

      {error && <div style={{ padding: '1rem', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {events.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p>No events created yet.</p>
          <Link to="/organiser/create-event">
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>+ Create New Event</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => (
            <div key={event.id} className="event-card card" style={{ padding: 0, borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {event.image && editingEventId !== event.id && (
                <img src={`http://localhost:5001${event.image}`} alt={event.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              )}

              <div style={{ padding: '1.5rem' }}>
                {editingEventId === event.id ? (
                  <div>
                    {['title', 'description', 'date', 'time', 'location', 'max_participants', 'department'].map(field => (
                      <div key={field} className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'capitalize' }}>{field.replace('_', ' ')}</label>
                        {field === 'description' ? (
                          <textarea name={field} value={editFormData[field]} onChange={handleEditChange} style={{ width: '100%', padding: '0.5rem' }} rows={3} />
                        ) : (
                          <input
                            type={field === 'max_participants' ? 'number' : (field === 'date' ? 'date' : field === 'time' ? 'time' : 'text')}
                            name={field}
                            value={editFormData[field]}
                            onChange={handleEditChange}
                            style={{ width: '100%', padding: '0.5rem' }}
                          />
                        )}
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Update Image (Optional)</label>
                      <input type="file" accept="image/*" onChange={handleEditImageChange} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }} />
                      {editImagePreview && <img src={editImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '0.5rem', borderRadius: '4px' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={() => handleEditSubmit(event.id)} style={{ flex: 1 }}>Save</button>
                      <button className="btn btn-secondary" onClick={() => { setEditingEventId(null); setEditImageFile(null); setEditImagePreview(null); }} style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3>{event.title}</h3>
                    {event.description && <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>{event.description.substring(0, 100)}{event.description.length > 100 ? '...' : ''}</p>}
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>📅 {new Date(event.date).toLocaleDateString()} at {event.time}</p>
                    {event.location && <p style={{ fontSize: '0.85rem' }}>📍 {event.location}</p>}
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>👥 {event.registered_count || 0} / {event.max_participants || '∞'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      <button className="btn btn-primary" onClick={() => viewParticipants(event.id)} style={{ flex: '1 1 48%' }}>View Participants</button>
                      <button className="btn btn-secondary" onClick={() => handleEditClick(event)} style={{ flex: '1 1 48%' }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(event.id)} style={{ flex: '1 1 48%' }}>Delete</button>
                      <button className="btn btn-success" onClick={() => scanQRCode(event.id)} style={{ flex: '1 1 48%' }}>Scan QR</button>
                      <button className="btn btn-info" onClick={() => navigate(`/organiser/feedback/${event.id}`)} style={{ flex: '1 1 48%' }}>View Feedback</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageEvents;