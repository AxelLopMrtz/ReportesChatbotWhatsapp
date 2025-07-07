import React, { useEffect, useState } from "react";
import "./TablaEstilo.css";

const HistorialMensajes = () => {
  const [mensajes, setMensajes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("http://localhost/api/get_historialmensajes.php")
      .then((res) => res.json())
      .then((data) => setMensajes(data))
      .catch((error) => console.error("Error:", error));
  }, []);

  const mensajesFiltrados = mensajes.filter((m) =>
    m.ciudadano?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Obtener nombres únicos para el dropdown
  const ciudadanosUnicos = [...new Set(mensajes.map((m) => m.ciudadano).filter(Boolean))];

  return (
    <div className="tabla-container">
      <h3>Historial de Mensajes</h3>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar por nombre del ciudadano"
          className="form-control"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="form-control mt-2"
          onChange={(e) => setBusqueda(e.target.value)}
          value={busqueda}
        >
          <option value="">-- Seleccionar ciudadano --</option>
          {ciudadanosUnicos.map((nombre, idx) => (
            <option key={idx} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Ciudadano</th>
            <th>Mensaje</th>
            <th>Fecha y Hora</th>
          </tr>
        </thead>
        <tbody>
          {mensajesFiltrados.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.ciudadano}</td>
              <td>{m.mensaje}</td>
              <td>{m.fecha_hora}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialMensajes;
