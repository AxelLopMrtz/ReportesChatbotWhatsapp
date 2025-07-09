import React from "react";
import "./CardResumen.css";

const CardResumen = ({ label, count, type, active = true, onClick, isStatic = false }) => {
  const clase = `card-resumen ${type || ""} ${active ? "" : "desactivado"}`;

  return (
    <div className={clase} onClick={!isStatic ? onClick : undefined}>
      <h4>{count}</h4>
      <p>{label.toUpperCase()}</p>
    </div>
  );
};

export default CardResumen;
