import React, { useState, useEffect } from 'react';
import keycloak from '../keycloak'; // Correct path

interface UserInfo {
  name?: string;
  email?: string;
  [key: string]: any;
}

const KeycloakLogin: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const isAuthenticated = await keycloak.init({
          onLoad: 'login-required',
          checkLoginIframe: false, 
        });
        if (isAuthenticated) {
          console.log('Authenticated ✅');
          setAuthenticated(true);

          const userInfo = await keycloak.loadUserInfo();
          setUserInfo(userInfo as UserInfo);

          setTimeout(() => {
            window.location.href = '/home';
          }, 1000);
        } else {
          console.error('Authentication failed ❌');
          setError('Authentication failed');
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
        setError('Failed to initialize Keycloak');
      }
    };

    initKeycloak();
  }, []);

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!authenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome {userInfo?.name || 'User'}!</h1>
      <p>Email: {userInfo?.email || 'Not Available'}</p>
    </div>
  );
};

export default KeycloakLogin;
