import React, { useEffect, useState } from 'react';
import { initThreeBackground } from '../utils/three-background';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = 'Whatsreporte - Iniciar Sesión'; // ✅ Título de la pestaña
    initThreeBackground('three-bg');
  }, []);

  const handleLogin = () => {
    if (username.trim() && password.trim()) {
      onLogin({ username: username.trim(), password: password.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <div
        id="three-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          width: '100%',
          height: '100%',
        }}
      ></div>

      <div className="login-overlay">
        <div className="login-box">
          <h2 className="login-title"> Iniciar Sesión</h2>
          <input
            type="text"
            className="login-input"
            placeholder="Ingresa tu nombre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="login-button" onClick={handleLogin}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
