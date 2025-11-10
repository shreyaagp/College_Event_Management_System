import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/api';

const Feedback = () => {
  const { eventId } = useParams(); 
  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchFeedback();
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
  
  }, [eventId]);

  const fetchFeedback = async () => {
    try {
      const [eventRes, feedbackRes] = await Promise.all([
        API.get(`/events/${eventId}`),
        API.get(`/feedback/event/${eventId}`),
      ]);

      setEvent(eventRes.data?.data || null);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length)
    : 0;

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Event Feedback</h2>
      {error && <div className="alert alert-error">{error}</div>}

      {event && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{event.title}</h3>
          <p>Date: {new Date(event.date).toLocaleDateString()}</p>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="card">
          <p>No feedback received for this event yet.</p>
        </div>
      ) : (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Summary</h3>
            <p style={{ fontSize: '1.2rem' }}>
              Average Rating: <strong>{avgRating.toFixed(1)}</strong> / 5
            </p>
            <p>Total Reviews: {feedback.length}</p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>All Reviews</h3>
            {feedback.map(item => (
              <div key={item.id} style={{
                padding: '1rem',
                borderBottom: '1px solid #eee',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{item.user_name}</strong>
                  <div style={{ fontSize: '1.2rem', color: '#ffc107' }}>
                    {renderStars(item.rating)}
                  </div>
                </div>
                {item.comment && (
                  <p style={{ color: '#666', marginTop: '0.5rem' }}>{item.comment}</p>
                )}
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;