import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { state } = useLocation();
  const authMessage = state?.message;

  const handleLogin = (e) => {
    e.preventDefault(); // ✅ Prevent page refresh
    if (email === 'admin@example.com' && password === 'admin123') {
      navigate('/home', { state: { token: 'dummy-static-token' } });
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>
        
        {/* Display authentication message if redirected */}
        {authMessage && (
          <div style={styles.messageContainer}>
            <p style={styles.messageText}>{authMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};


const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(to right, #FF7F50, #FFEC4E)',
     fontFamily: 'Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    width: '300px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  messageContainer: {
    marginBottom: '20px',
    padding: '10px',
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '5px',
  },
  messageText: {
    margin: 0,
    color: '#856404',
    fontSize: '14px',
    fontFamily: 'Roboto, sans-serif',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#FF7F50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.3s ease',
     fontFamily: 'Roboto, sans-serif',
  },
};

export default Login;
