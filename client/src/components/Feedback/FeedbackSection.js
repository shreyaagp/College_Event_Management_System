import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FeedbackSection = ({ eventId }) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [myFeedback, setMyFeedback] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchFeedback = async () => {
    try {
      const [allFeedbackRes, myFeedbackRes] = await Promise.all([
        API.get(`/feedback/event/${eventId}`),
        API.get('/feedback/my-feedback'),
      ]);

      const all = allFeedbackRes.data.feedback || [];
      const mine = (myFeedbackRes.data || []).find(f => f.event_id === eventId) || null;

      setFeedback(all);
      setMyFeedback(mine);
      
      if (mine) {
        setFormData({
          rating: mine.rating,
          comment: mine.comment || ''
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await API.post('/feedback', {
        event_id: eventId,
        rating: formData.rating,
        comment: formData.comment
      });
      
      setShowForm(false);
      fetchFeedback();
      alert('Thank you for your feedback!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit feedback');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length)
    : 0;

  if (loading) {
    return <div className="loading">Loading feedback...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Event Feedback & Reviews</h2>

        {feedback.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
              Average Rating: {avgRating.toFixed(1)} / 5
            </div>
            <div style={{ marginBottom: '1rem' }}>
              Total Reviews: {feedback.length}
            </div>
          </div>
        )}

        {!myFeedback ? (
          <div>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                Submit Feedback
              </button>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ marginBottom: '1rem' }}>Your Feedback</h3>
                
                <div className="form-group">
                  <label>Rating (1-5 stars)</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    required
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={3}>3 - Good</option>
                    <option value={2}>2 - Fair</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', color: '#ffc107' }}>
                    {renderStars(formData.rating)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Comment (Optional)</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Share your thoughts about this event..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Submit Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="card" style={{ background: '#f8f9fa', marginBottom: '1rem' }}>
            <h3>Your Feedback</h3>
            <div className="rating">
              {renderStars(myFeedback.rating)}
            </div>
            {myFeedback.comment && (
              <p style={{ marginTop: '0.5rem' }}>{myFeedback.comment}</p>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Edit Feedback
            </button>
          </div>
        )}

        {feedback.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>All Reviews</h3>
            {feedback.map(item => (
              <div key={item.id} className="feedback-item" style={{
                padding: '1rem',
                borderBottom: '1px solid #eee',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{item.user_name}</strong>
                  <div className="rating">
                    {renderStars(item.rating)}
                  </div>
                </div>
                {item.comment && (
                  <p style={{ color: '#666' }}>{item.comment}</p>
                )}
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {feedback.length === 0 && !myFeedback && !showForm && (
          <p style={{ color: '#666' }}>No feedback yet. Be the first to review this event!</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection;