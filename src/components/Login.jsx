import React, { useEffect, useState } from 'react';
import { initThreeBackground } from '../utils/three-background';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = 'Whatsreporte - Iniciar Sesión'; // ✅ Título de la pestaña

    // ✅ Evita duplicar el canvas si ya existe
    const existingCanvas = document.querySelector('#three-bg canvas');
    if (!existingCanvas) {
      initThreeBackground('three-bg');
    }

    // 🧼 Limpia el fondo al desmontar el componente
    return () => {
      const container = document.getElementById('three-bg');
      if (container) container.innerHTML = '';
    };
  }, []);

  const handleLogin = () => {
    if (username.trim() && password.trim()) {
      fetch(`${process.env.REACT_APP_API_URL}/usuarios_api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('usuario', JSON.stringify(data)); // Guardar en localStorage
            onLogin(data); // Llama a tu función padre para mostrar el dashboard
          } else {
            alert(data.error || 'Credenciales inválidas');
          }
        })
        .catch(err => {
          console.error('Error al iniciar sesión:', err);
          alert('Error en el servidor');
        });
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
