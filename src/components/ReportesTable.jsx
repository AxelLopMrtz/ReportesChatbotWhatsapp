import React, { useEffect, useState } from "react";
import "./ReportesTable.css";

const ReportesTable = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/obtener_reportes.php`
      : "http://localhost/api/obtener_reportes.php";

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReportes(data);
        } else {
          console.error("La API no devolvió un array:", data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener reportes:", err);
        setLoading(false);
      });
  }, []);

  const getEstadoColor = (estado) => {
    const lower = estado?.toLowerCase() || "";
    if (lower.includes("completado")) return "estado completado";
    if (lower.includes("rechazado")) return "estado rechazado";
    if (lower.includes("esperando")) return "estado esperando";
    if (lower.includes("sin revisar")) return "estado sin-revisar";
    return "estado desconocido";
  };

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="tabla-reportes-container">
      <h3>Reportes recientes</h3>
      <table className="tabla-reportes">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Ciudadano</th>
            <th>Teléfono</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {reportes.map((rep) => (
            <tr key={rep.id}>
              <td>{`REP-${String(rep.id).padStart(3, "0")}`}</td>
              <td>{rep.nombre || "No registrado"}</td>
              <td>{rep.telefono || "Sin teléfono"}</td>
              <td>{rep.tipo_reporte}</td>
              <td>{rep.descripcion}</td>
              <td>{rep.ubicacion}</td>
              <td>
                <span className={getEstadoColor(rep.estado)}>
                  {rep.estado || "Sin estado"}
                </span>
              </td>
              <td>{new Date(rep.fecha_hora).toLocaleString("es-MX")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportesTable;
