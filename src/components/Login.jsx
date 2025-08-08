import React, { useEffect, useState } from 'react';
import ThreeBackground from '../utils/three-background';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Whatsreporte - Iniciar Sesión';
    // Ya no necesitas initThreeBackground ni buscar el canvas aquí,
    // el componente ThreeBackground se encarga de su propia inicialización y limpieza.
  }, []);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) return;
    fetch(`${process.env.REACT_APP_API_URL}/usuarios_api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('usuario', JSON.stringify(data));
          onLogin(data);
        } else {
          alert(data.error || 'Credenciales inválidas');
        }
      })
      .catch(err => {
        console.error('Error al iniciar sesión:', err);
        alert('Error en el servidor');
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Renderiza el nuevo componente ThreeBackground aquí */}
      <ThreeBackground />
      <div className="login-overlay">
        <div className="login-box">
          <h2 className="login-title">Iniciar Sesión</h2>
          <div className="login-form">
            {/* Usuario */}
            <div className="login-input-group">
              <span className="login-icon-left"><FaUser /></span>
              <input
                type="text"
                className="login-input"
                placeholder="Ingresa tu nombre"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="username"
              />
              <span className="login-icon-right-placeholder" /> {/* vacío para mantener simetría con el ojo */}
            </div>
            {/* Contraseña */}
            <div className="login-input-group">
              <span className="login-icon-left"><FaLock /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button className="login-button" onClick={handleLogin}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
