import React, { useState } from "react";
import Login from "./components/Login";
import Menu from "./components/Menu";
import './styles.css';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <div>
      {!usuario ? (
        <Login onLogin={setUsuario} />
      ) : (
        <Menu usuario={usuario} />
      )}
    </div>
  );
}

export default App;
