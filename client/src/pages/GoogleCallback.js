import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        

        const redirectPath = userData.role === 'organiser' ? '/organiser' : '/';
        window.location.href = redirectPath;
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login?error=google_auth_failed');
      }
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Completing Google sign in...</p>
    </div>
  );
};

export default GoogleCallback;

