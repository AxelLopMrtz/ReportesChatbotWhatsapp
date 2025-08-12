import React from "react";
import "./CardResumen.css";

const CardResumen = ({
  label,
  count,
  type,
  active = true,      // si el filtro está activo
  onClick,
  isStatic = false,   // true para la tarjeta "Total"
}) => {
  const clase = `card-resumen ${type || ""} ${active ? "" : "desactivado"} ${isStatic ? "principal" : ""}`;
  const interactive = !isStatic;

  return (
    <div
      className={clase}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      onKeyDown={
        interactive
          ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.();
            }
          }
          : undefined
      }
    >
      <div className="card-count">{count}</div>
      <div className="card-label">{String(label).toUpperCase()}</div>
    </div>
  );
};

export default CardResumen;
