// src/components/CardResumen.jsx
import React from "react";
import "./CardResumen.css";

const CardResumen = ({ label, count, type = "normal" }) => {
  return (
    <div className={`card-resumen ${label.toLowerCase().replace(/\s/g, "-")} ${type}`}>
      <div className="card-count">{count}</div>
      <div className="card-label">{label.toUpperCase()}</div>
    </div>
  );
};

export default CardResumen;
