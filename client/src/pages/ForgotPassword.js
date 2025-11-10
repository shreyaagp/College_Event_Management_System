import React, { useState } from 'react';
import API from '../api/api'; 

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await API.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div 
      className="container" 
      style={{ 
        maxWidth: '400px', 
        marginTop: '5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      <div 
        className="card" 
        style={{ 
          padding: '2rem', 
          width: '100%', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
          borderRadius: '10px' 
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Forgot Password</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '1.5rem' }}>
          Enter your registered email
        </p>

        {message && <div style={{ color: 'green', textAlign: 'center', marginBottom: '1rem' }}>{message}</div>}
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your college email"
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                outline: 'none',
                fontSize: '1rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ccc'}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#0056b3'}
            onMouseLeave={(e) => e.target.style.background = '#007bff'}
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;