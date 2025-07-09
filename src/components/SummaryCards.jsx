import React, { useEffect, useState } from "react";
import "./CardResumen.css";

const estados = [
  { nombre: "Sin revisar", color: "azul" },
  { nombre: "Esperando recepción", color: "naranja" },
  { nombre: "Completado", color: "verde" },
  { nombre: "Rechazado", color: "rojo" },
];

const SummaryCards = ({ filtrosActivos, setFiltrosActivos }) => {
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost/api/resumen_reportes.php")
      .then((res) => res.json())
      .then((data) => {
        setConteos({
          "Sin revisar": data.sin_revisar,
          "Esperando recepción": data.esperando,
          Completado: data.completado,
          Rechazado: data.rechazado,
          total: data.total,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar resumen:", err);
        setLoading(false);
      });
  }, []);

  const toggleFiltro = (estado) => {
    setFiltrosActivos((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const total = conteos.total || 0;

  return (
    <div className="summary-container">
      {/* Total */}
      <div className="card-resumen principal">
        <div className="card-count">{loading ? "..." : total}</div>
        <div className="card-label">Total</div>
      </div>

      {/* Tarjetas por estado */}
      {estados.map((estado) => {
        const activo = filtrosActivos.includes(estado.nombre);
        const className = `card-resumen ${estado.color} ${activo ? "" : "desactivado"}`;

        return (
          <div
            key={estado.nombre}
            className={className}
            onClick={() => toggleFiltro(estado.nombre)}
          >
            <div className="card-count">
              {loading ? "..." : conteos[estado.nombre] || 0}
            </div>
            <div className="card-label">{estado.nombre}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
