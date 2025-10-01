"use client";

import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import "./ReportesFiltrables.css";

const ReportesFiltrables = () => {
  const API_URL =
    (process.env.REACT_APP_API_URL || "http://localhost/api") +
    "/obtener_reportes.php";

  const [reportes, setReportes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const LIMITE_POR_PAGINA = 50;

  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [ciudadano, setCiudadano] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState(null);
  const [folio, setFolio] = useState("");

  const totalPaginas = Math.ceil(filtered.length / LIMITE_POR_PAGINA);

  const normalizarEstado = (estado) => {
    const est = estado?.toLowerCase() || "";
    if (est.includes("sin revisar")) return "sin_revisar";
    if (est.includes("esperando")) return "esperando";
    if (est.includes("completado")) return "completado";
    if (est.includes("rechazado")) return "rechazado";
    return "otro";
  };

  const filtrar = useCallback(() => {
    const hastaFin = hasta
      ? new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999)
      : null;

    const filtrados = reportes.filter((rep) => {
      const fecha = new Date(rep.fecha_hora);
      const cumpleFecha =
        (!desde || fecha >= desde) && (!hastaFin || fecha <= hastaFin);

      const cumpleCiudadano = ciudadano
        ? rep.nombre?.toLowerCase().includes(ciudadano.toLowerCase())
        : true;

      const cumpleTelefono = telefono
        ? String(rep.telefono || "").includes(telefono)
        : true;

      const cumpleEstado = estado
        ? normalizarEstado(rep.estado) === estado.value
        : true;

      const cumpleFolio = folio
        ? String(rep.id).toLowerCase().includes(folio.toLowerCase())
        : true;

      return (
        cumpleFecha &&
        cumpleCiudadano &&
        cumpleTelefono &&
        cumpleEstado &&
        cumpleFolio
      );
    });

    setFiltered(filtrados);
    setPaginaActual(1);
  }, [reportes, desde, hasta, ciudadano, telefono, estado, folio]);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReportes(data);
          setFiltered(data);
        }
      })
      .catch((err) => {
        console.error("Error al obtener reportes:", err);
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  useEffect(() => {
    filtrar();
  }, [filtrar]);

  const limpiarFiltros = () => {
    setDesde(null);
    setHasta(null);
    setCiudadano("");
    setTelefono("");
    setEstado(null);
    setFolio("");
    setFiltered(reportes);
  };

  const exportarCSV = () => {
    const encabezados = [
      "Folio",
      "Ciudadano",
      "Teléfono",
      "Tipo",
      "Descripción",
      "Ubicación",
      "Evidencia",
      "Estado",
      "Fecha",
    ];

    const filas = filtered.map((r) => [
      r.id, // ya incluye rep-
      r.nombre,
      r.telefono,
      r.tipo_reporte,
      r.descripcion,
      r.ubicacion,
      r.evidencia || "Sin evidencia",
      r.estado,
      new Date(r.fecha_hora).toLocaleString("es-MX"),
    ]);

    const csvContent = [encabezados, ...filas]
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reportes_filtrados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const actualizarEstado = (rep, nuevoEstado) => {
    setSavingId(rep.id);
    fetch(
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/actualizar_estado.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rep.id, estado: nuevoEstado }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setReportes((prev) =>
            prev.map((r) =>
              r.id === rep.id ? { ...r, estado: nuevoEstado } : r
            )
          );
          setFiltered((prev) =>
            prev.map((r) =>
              r.id === rep.id ? { ...r, estado: nuevoEstado } : r
            )
          );
        }
      })
      .finally(() => setSavingId(null));
  };

  const opcionesEstados = [
    { label: "Sin revisar", value: "sin_revisar" },
    { label: "Esperando recepción", value: "esperando" },
    { label: "Completado", value: "completado" },
    { label: "Rechazado", value: "rechazado" },
  ];

  const inicio = (paginaActual - 1) * LIMITE_POR_PAGINA;
  const paginados = filtered.slice(inicio, inicio + LIMITE_POR_PAGINA);

  const cambiarPagina = (nueva) => {
    if (nueva < 1 || nueva > totalPaginas) return;
    setPaginaActual(nueva);
  };

  const renderPaginacion = () => {
    const paginas = [];
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, paginaActual + 2);

    if (paginaActual > 1) {
      paginas.push(
        <button key="first" onClick={() => cambiarPagina(1)}>
          « Primera
        </button>
      );
      paginas.push(
        <button key="prev" onClick={() => cambiarPagina(paginaActual - 1)}>
          ‹ Anterior
        </button>
      );
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(
        <button
          key={i}
          className={paginaActual === i ? "activo" : ""}
          onClick={() => cambiarPagina(i)}
        >
          {i}
        </button>
      );
    }

    if (paginaActual < totalPaginas) {
      paginas.push(
        <button key="next" onClick={() => cambiarPagina(paginaActual + 1)}>
          Siguiente ›
        </button>
      );
      paginas.push(
        <button key="last" onClick={() => cambiarPagina(totalPaginas)}>
          Última »
        </button>
      );
    }

    return paginas;
  };

  return (
    <div className="contenedor-reportes-filtrables">
      <h3>Reportes con Filtros</h3>

      <div className="filtros-reportes">
        <div className="campo-filtro">
          <label>Ciudadano:</label>
          <input
            type="text"
            value={ciudadano}
            onChange={(e) => setCiudadano(e.target.value)}
            placeholder="Buscar por nombre"
            className="input-text"
          />
        </div>

        <div className="campo-filtro">
          <label>Teléfono:</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Buscar por número"
            className="input-text"
          />
        </div>

        <div className="campo-filtro">
          <label>Estado:</label>
          <Select
            options={opcionesEstados}
            value={estado}
            onChange={setEstado}
            isClearable
            placeholder="Filtrar por estado"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="campo-filtro">
          <label>Folio:</label>
          <input
            type="text"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            placeholder="Ej. rep-123"
            className="input-text"
          />
        </div>

        <div className="campo-filtro">
          <label>Desde:</label>
          <DatePicker
            selected={desde}
            onChange={setDesde}
            dateFormat="dd/MM/yyyy"
            className="input-date"
            placeholderText="Selecciona fecha"
          />
        </div>

        <div className="campo-filtro">
          <label>Hasta:</label>
          <DatePicker
            selected={hasta}
            onChange={setHasta}
            dateFormat="dd/MM/yyyy"
            className="input-date"
            placeholderText="Selecciona fecha"
          />
        </div>

        <div className="campo-filtro campo-botones">
          <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
            Limpiar
          </button>
          <button className="btn-exportar" onClick={exportarCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "20px", fontWeight: "600" }}>
          Cargando datos...
        </p>
      ) : (
        <>
          <div className="tabla-wrapper-filtrables">
            <table className="tabla-reportes-filtrables">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Ciudadano</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Ubicación</th>
                  <th>Evidencia</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((rep) => (
                  <tr key={rep.id}>
                    <td>{rep.id}</td>
                    <td>{rep.nombre}</td>
                    <td>{rep.telefono}</td>
                    <td>{rep.tipo_reporte}</td>
                    <td>{rep.descripcion}</td>
                    <td>{rep.ubicacion}</td>
                    <td>
                      {rep.evidencia ? (
                        <a
                          href={rep.evidencia}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver
                        </a>
                      ) : (
                        "Sin evidencia"
                      )}
                    </td>
                    <td>
                      <select
                        className={`estado-${normalizarEstado(rep.estado)}`}
                        value={rep.estado}
                        onChange={(e) => actualizarEstado(rep, e.target.value)}
                        disabled={savingId === rep.id}
                      >
                        {opcionesEstados.map((opt) => (
                          <option key={opt.value} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(rep.fecha_hora).toLocaleString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="paginacion-filtrables">{renderPaginacion()}</div>
        </>
      )}
    </div>
  );
};

export default ReportesFiltrables;