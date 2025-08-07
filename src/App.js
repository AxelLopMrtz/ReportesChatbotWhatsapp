import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import Menu from "./components/Menu";
import './styles.css';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true); // 🆕 evitar parpadeo

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
    setLoading(false); // ⏳ Ya se revisó si había sesión
  }, []);

  const handleLogin = (user) => {
    localStorage.setItem("usuario", JSON.stringify(user));
    setUsuario(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '20vh' }}>Cargando...</div>;
  }

  return (
    <div>
      {!usuario ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Menu usuario={usuario} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
