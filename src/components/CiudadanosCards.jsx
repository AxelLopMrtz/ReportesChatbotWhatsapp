import React, { useEffect, useState } from "react";
import "./CiudadanosCards.css";

const CiudadanosCards = () => {
  const [ciudadanos, setCiudadanos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/obtener_ciudadanos.php`
      : "http://localhost/api/obtener_ciudadanos.php";

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setCiudadanos(data);
        setFiltrados(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener ciudadanos:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const resultado = ciudadanos.filter((c) =>
      c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    );
    setFiltrados(resultado);
  }, [busqueda, ciudadanos]);

  if (loading) return <p>Cargando ciudadanos...</p>;

  return (
    <div className="contenedor-ciudadanos">
      <h3>Ciudadanos registrados</h3>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input-buscador-ciudadano"
      />

      <div className="tarjetas-ciudadanos">
        {filtrados.map((c) => (
          <div className="card-ciudadano" key={c.id}>
            <h4>{c.nombre || "Sin nombre"}</h4>
            <p><strong>Teléfono:</strong> {c.telefono}</p>
            <p><strong>Estado:</strong> {c.estado || "Sin estado"}</p>
            <p><strong>Reporte asociado:</strong> {c.id_reporte || "N/A"}</p>
            <p><strong>Fecha registro:</strong> {new Date(c.fecha_registro).toLocaleString("es-MX")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CiudadanosCards;
