import React, { useEffect, useMemo, useState } from "react";
import "./ReportesTable.css";

const ReportesTable = ({ onSeleccionar, filtroEstados = [] }) => {
  const [reportes, setReportes] = useState([]);            // datos crudos de la API
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => new Set()); // filas con descripción expandida

  // ========= Helpers seguros / normalización =========
  const safeStr = (v) => String(v ?? ""); // convierte null/undefined en ""

  const normalizar = (s) =>
    safeStr(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

  // Mapea a las 4 etiquetas de las cards, tolerante a variaciones
  const normalizarEstadoParaMatch = (estado) => {
    const e = normalizar(estado);
    if (e.includes("sin revisar")) return "sin revisar";
    if (e.includes("esperando")) return "esperando recepcion";
    if (e.includes("completado")) return "completado";
    if (e.includes("rechazado")) return "rechazado";
    return e;
  };

  const getEstadoColor = (estado) => {
    const e = normalizar(estado);
    if (e.includes("completado")) return "estado completado";
    if (e.includes("rechazado")) return "estado rechazado";
    if (e.includes("esperando")) return "estado esperando";
    if (e.includes("sin revisar")) return "estado sin-revisar";
    return "estado desconocido";
  };

  // ========= Resolver URL de evidencia =========
  // Puedes cambiar esta base cuando muevas a servidor.
  // Si defines REACT_APP_EVIDENCIAS_BASE en el futuro, se usará automáticamente.
  const EVID_BASE =
    process.env.REACT_APP_EVIDENCIAS_BASE ||
    "http://localhost/chatbotWwebhookdefinitivo/evidencias";

  const resolverEvidenciaUrl = (raw) => {
    if (!raw) return null;
    const s = safeStr(raw).trim();

    // si ya es a la base final, respeta
    if (s.startsWith(EVID_BASE)) return s;

    // si NO es URL absoluta (ej. "imagen_123.jpg"), compón directo
    if (!/^https?:\/\//i.test(s)) {
      const nombre = s.split("/").pop();
      return `${EVID_BASE}/${nombre}`;
    }

    // si es URL absoluta (ej. http://192.168.x.x:3001/imagen_123.jpg)
    try {
      const u = new URL(s);
      const nombre = u.pathname.split("/").pop(); // "imagen_123.jpg"
      return `${EVID_BASE}/${nombre}`;
    } catch {
      // fallback bruto
      const nombre = s.split("/").pop();
      return `${EVID_BASE}/${nombre}`;
    }
  };

  // ========= Data fetch =========
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/obtener_reportes.php`
      : "http://localhost/chatbotwhatsapp/api/obtener_reportes.php";

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setReportes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener reportes:", err);
        setReportes([]);
        setLoading(false);
      });
  }, []);

  // ========= Filtrado por estados (desde cards) =========
  const visibles = useMemo(() => {
    if (!Array.isArray(reportes)) return [];

    const activos = new Set(
      (Array.isArray(filtroEstados) ? filtroEstados : [])
        .filter((x) => x != null && safeStr(x).trim() !== "")
        .map((x) => normalizarEstadoParaMatch(x))
    );

    if (activos.size === 0) return reportes;

    return reportes.filter((rep) =>
      activos.has(normalizarEstadoParaMatch(rep?.estado))
    );
  }, [reportes, filtroEstados]);

  // ========= Expand/Collapse de descripción =========
  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return <p>Cargando reportes...</p>;
  if (!visibles.length) return <p>No hay reportes con los filtros actuales.</p>;

  return (
    <div className="tabla-reportes-container">
      <h3>Reportes recientes</h3>

      <div className="table-scroll">
        <table className="tabla-reportes">
          <thead>
            <tr>
              <th className="col-folio">Folio</th>
              <th className="col-ciudadano">Ciudadano</th>
              <th className="col-telefono">Teléfono</th>
              <th className="col-tipo">Tipo</th>
              <th className="col-desc">Descripción</th>
              <th className="col-ubi">Ubicación</th>
              <th className="col-evidencia">Evidencia</th>
              <th className="col-estado">Estado</th>
              <th className="col-fecha">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {visibles.map((rep) => {
              const rowId =
                rep?.id ?? `${safeStr(rep?.folio)}-${safeStr(rep?.telefono)}`;
              const isOpen = expanded.has(rowId);
              const desc = safeStr(rep?.descripcion);
              const shouldClamp = desc.length > 120;

              return (
                <tr
                  key={rowId}
                  onClick={() => onSeleccionar && onSeleccionar(rep?.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="col-folio">
                    {`REP-${safeStr(rep?.id).padStart(3, "0")}`}
                  </td>
                  <td className="col-ciudadano">
                    {safeStr(rep?.nombre) || "No registrado"}
                  </td>
                  <td className="col-telefono">
                    {safeStr(rep?.telefono) || "Sin teléfono"}
                  </td>
                  <td className="col-tipo">{safeStr(rep?.tipo_reporte)}</td>

                  <td className="col-desc" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={`desc ${isOpen ? "desc--expanded" : ""
                        } ${!isOpen && shouldClamp ? "desc--clamp" : ""}`}
                    >
                      {desc || "—"}
                    </div>
                    {shouldClamp && (
                      <button
                        type="button"
                        className="desc-toggle"
                        onClick={() => toggleExpand(rowId)}
                      >
                        {isOpen ? "Ver menos" : "Ver más"}
                      </button>
                    )}
                  </td>

                  <td className="col-ubi">{safeStr(rep?.ubicacion)}</td>

                  <td className="col-evidencia">
                    {rep?.evidencia_recurso ? (
                      <a
                        href={resolverEvidenciaUrl(rep.evidencia_recurso)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      "Sin archivo"
                    )}
                  </td>

                  <td className="col-estado">
                    <span className={getEstadoColor(rep?.estado)}>
                      {safeStr(rep?.estado) || "Sin estado"}
                    </span>
                  </td>

                  <td className="col-fecha">
                    {rep?.fecha_hora
                      ? new Date(rep.fecha_hora).toLocaleString("es-MX")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportesTable;
