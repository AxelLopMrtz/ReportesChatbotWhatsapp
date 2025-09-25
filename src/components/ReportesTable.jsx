import React, { useMemo, useState } from "react";
import "./ReportesTable.css";

const OPCIONES_ESTADO = [
  "Sin revisar",
  "Esperando recepción",
  "Completado",
  "Rechazado",
];

const ReportesTable = ({
  reportes = [],
  cargando = false,
  error = null,
  onSeleccionar,
  filtroEstados = [],
}) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const [savingId, setSavingId] = useState(null);

  // Helpers
  const safeStr = (v) => String(v ?? "");
  const normalizar = (s) =>
    safeStr(s)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

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

  // resolver URL evidencia (usa evidencia_recurso)
  const EVID_BASE =
    process.env.REACT_APP_EVIDENCIAS_BASE ||
    "http://localhost/chatbotWwebhookdefinitivo/evidencias";

  const resolverEvidenciaUrl = (raw) => {
    if (!raw) return null;
    const s = safeStr(raw).trim();
    if (s.startsWith(EVID_BASE)) return s;
    if (!/^https?:\/\//i.test(s)) {
      const nombre = s.split("/").pop();
      return `${EVID_BASE}/${nombre}`;
    }
    try {
      const u = new URL(s);
      const nombre = u.pathname.split("/").pop();
      return `${EVID_BASE}/${nombre}`;
    } catch {
      const nombre = s.split("/").pop();
      return `${EVID_BASE}/${nombre}`;
    }
  };

  // ========= Filtrado por estados =========
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

  // ========= Expand/Collapse descripción =========
  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ========= Cambio de estado (POST a PHP) =========
  const actualizarEstado = async (rep, nuevoEstado) => {
    if (!rep?.id || !nuevoEstado) return;
    setSavingId(rep.id);
    try {
      const API_BASE = process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL
        : "http://localhost/chatbotwhatsapp/api";

      const resp = await fetch(`${API_BASE}/actualizar_estado.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporte_id: rep.id,
          estado: nuevoEstado,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado");
      }

      // Actualiza la fila en memoria (optimista)
      rep.estado = nuevoEstado;
    } catch (e) {
      alert(`Error al actualizar estado: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // ========= Render =========
  if (cargando) return <p>Cargando reportes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
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

                  <td className="col-tipo">
                    {safeStr(rep?.tipo_reporte)}
                  </td>

                  <td className="col-desc" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={`desc ${isOpen ? "desc--expanded" : ""} ${!isOpen && shouldClamp ? "desc--clamp" : ""
                        }`}
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

                  <td
                    className="col-estado"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      className={`estado-select ${getEstadoColor(rep?.estado)}`}
                      value={
                        OPCIONES_ESTADO.find(
                          (x) => normalizar(x) === normalizar(rep?.estado)
                        ) || "Sin revisar"
                      }
                      onChange={(e) => actualizarEstado(rep, e.target.value)}
                      disabled={savingId === rep.id}
                      title="Cambiar estado"
                    >
                      {OPCIONES_ESTADO.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
