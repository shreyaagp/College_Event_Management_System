import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const ProposedEvents = () => {
  const { user } = useAuth();
  const [proposedEvents, setProposedEvents] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    department: user?.department || ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProposedEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProposedEvents = async () => {
    try {
      const proposalsRes = await API.get('/votes/proposed');
      setProposedEvents(proposalsRes.data || []);

      // Fetch user votes for each proposed event (only if student)
      if (user && user.role === 'student') {
        const votesMap = {};
        for (const proposal of (proposalsRes.data || [])) {
          try {
            const voteRes = await API.get(`/votes/my-vote/${proposal.id}`);
            if (voteRes.data && voteRes.data.vote_type) {
              votesMap[proposal.id] = voteRes.data.vote_type;
            }
          } catch (err) {
            // User hasn't voted on this event
          }
        }
        setUserVotes(votesMap);
      }
    } catch (error) {
      console.error('Error fetching proposed events:', error);
      setError('Failed to load proposed events');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposedEventId, voteType) => {
    if (user?.role !== 'student') {
      alert('Only students can vote on proposed events');
      return;
    }

    try {
      await API.post('/votes/vote', {
        proposed_event_id: proposedEventId,
        vote_type: voteType
      });
      
      const currentVote = userVotes[proposedEventId];
      const newVotes = { ...userVotes };
      
      if (currentVote === voteType) {
        delete newVotes[proposedEventId];
      } else {
        newVotes[proposedEventId] = voteType;
      }
      
      setUserVotes(newVotes);
      fetchProposedEvents();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to vote');
    }
  };

  const handleProposeEvent = async (e) => {
    e.preventDefault();
    
    if (user?.role !== 'organiser') {
      alert('Only organisers can propose events');
      return;
    }
    
    try {
      await API.post('/votes/propose', proposalForm);
      setShowProposalForm(false);
      setProposalForm({ title: '', description: '', department: user?.department || '' });
      await fetchProposedEvents();
      alert('Event proposal submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to propose event');
    }
  };

  const departments = [
    'Computer Science',
    'Information Science',
    'Electronics and Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering'
    
  ];

  if (loading) {
    return <div className="loading">Loading proposed events...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Vote on Proposed Events</h1>
        {user?.role === 'organiser' && (
          <button
            onClick={() => setShowProposalForm(!showProposalForm)}
            className="btn btn-primary"
          >
            {showProposalForm ? 'Cancel' : '+ Propose New Event'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {user?.role === 'organiser' && showProposalForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Propose a New Event</h2>
          <form onSubmit={handleProposeEvent}>
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={proposalForm.title}
                onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={proposalForm.description}
                onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Department</label>
              <select
                value={proposalForm.department}
                onChange={(e) => setProposalForm({ ...proposalForm, department: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                Submit Proposal
              </button>
              <button
                type="button"
                onClick={() => setShowProposalForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {proposedEvents.length === 0 ? (
        <div className="card">
          <p>No proposed events to vote on. {user?.role === 'organiser' && 'Be the first to propose one!'}</p>
        </div>
      ) : (
        <div className="events-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {proposedEvents.map(event => (
            <div key={event.id} className="event-card" style={{
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
                {event.department}
              </span>
              <h3>{event.title}</h3>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>{event.description}</p>
              
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                Proposed by: {event.proposed_by_name}
              </div>

              {user?.role === 'student' && (
                <div className="vote-section" style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '1rem' 
                }}>
                  <button
                    onClick={() => handleVote(event.id, 'up')}
                    className={`vote-button ${userVotes[event.id] === 'up' ? 'active' : ''}`}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: userVotes[event.id] === 'up' ? '#28a745' : '#f0f0f0',
                      color: userVotes[event.id] === 'up' ? 'white' : 'black',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    👍 Upvote ({event.upvotes || 0})
                  </button>
                  <button
                    onClick={() => handleVote(event.id, 'down')}
                    className={`vote-button ${userVotes[event.id] === 'down' ? 'active' : ''}`}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: userVotes[event.id] === 'down' ? '#dc3545' : '#f0f0f0',
                      color: userVotes[event.id] === 'down' ? 'white' : 'black',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    👎 Downvote ({event.downvotes || 0})
                  </button>
                </div>
              )}

              {user?.role !== 'student' && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    👍 Upvotes: <strong>{event.upvotes || 0}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    👎 Downvotes: <strong>{event.downvotes || 0}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposedEvents;