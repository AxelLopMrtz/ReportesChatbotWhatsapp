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
  const LIMITE_POR_PAGINA = 50;

  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [ciudadano, setCiudadano] = useState(null);
  const [telefono, setTelefono] = useState(null);
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

  const getEstadoColor = (estado) => {
    const norm = normalizarEstado(estado);
    switch (norm) {
      case "completado":
        return "badge verde";
      case "rechazado":
        return "badge rojo";
      case "esperando":
        return "badge naranja";
      case "sin_revisar":
        return "badge morado";
      default:
        return "badge gris";
    }
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
        ? rep.nombre === ciudadano.value
        : true;
      const cumpleTelefono = telefono
        ? rep.telefono === telefono.value
        : true;
      const cumpleEstado = estado
        ? normalizarEstado(rep.estado) === estado.value
        : true;
      const cumpleFolio = folio
        ? String(rep.id).includes(folio.replace(/^REP-/, ""))
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
      });
  }, [API_URL]);

  useEffect(() => {
    filtrar();
  }, [filtrar]);

  const limpiarFiltros = () => {
    setDesde(null);
    setHasta(null);
    setCiudadano(null);
    setTelefono(null);
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
      `REP-${r.id}`,
      r.nombre,
      r.telefono,
      r.tipo_reporte,
      r.descripcion,
      r.ubicacion,
      r.evidencia || "Sin evidencia",
      r.estado,
      new Date(r.fecha_hora).toLocaleString("es-MX"),
    ]);

    // Comillas dobles + BOM UTF-8
    const csvContent = [encabezados, ...filas]
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell ?? "").replace(/"/g, '""')}"` // escapamos comillas internas
          )
          .join(",")
      )
      .join("\n");

    const BOM = "\uFEFF"; // BOM UTF-8
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

  const opcionesCiudadanos = Array.from(
    new Set(reportes.map((r) => r.nombre))
  ).map((nombre) => ({
    label: nombre,
    value: nombre,
  }));

  const opcionesTelefonos = Array.from(
    new Set(reportes.map((r) => r.telefono))
  ).map((tel) => ({
    label: tel,
    value: tel,
  }));

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
          <Select
            options={opcionesCiudadanos}
            value={ciudadano}
            onChange={setCiudadano}
            isClearable
            placeholder="Buscar por nombre"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="campo-filtro">
          <label>Teléfono:</label>
          <Select
            options={opcionesTelefonos}
            value={telefono}
            onChange={setTelefono}
            isClearable
            placeholder="Buscar por número"
            className="react-select-container"
            classNamePrefix="react-select"
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
            placeholder="Ej. REP-001 o 15"
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
                <td>REP-{rep.id}</td>
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
                  <span className={getEstadoColor(rep.estado)}>
                    {opcionesEstados.find(
                      (opt) => opt.value === normalizarEstado(rep.estado)
                    )?.label || rep.estado}
                  </span>
                </td>
                <td>{new Date(rep.fecha_hora).toLocaleString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="paginacion-filtrables">{renderPaginacion()}</div>
    </div>
  );
};

export default ReportesFiltrables;
