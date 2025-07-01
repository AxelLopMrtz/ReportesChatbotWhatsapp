import React, { useEffect, useState } from "react";
import "./SummaryCards.css";
import CardResumen from "./CardResumen";

const SummaryCards = () => {
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/resumen_reportes.php`)
      .then((res) => res.json())
      .then((data) => setResumen(data))
      .catch((err) => console.error("Error al obtener resumen:", err));
  }, []);

  if (!resumen) return <p>Cargando resumen...</p>;

  return (
    <div className="summary-container">
      <CardResumen label="Total" count={resumen.total} type="principal" />
      <CardResumen label="Sin revisar" count={resumen.sin_revisar} />
      <CardResumen label="Esperando recepción" count={resumen.esperando} />
      <CardResumen label="Completado" count={resumen.completado} />
      <CardResumen label="Rechazado" count={resumen.rechazado} />
    </div>
  );
};

export default SummaryCards;
