import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import "./ReportesFiltrables.css";

const ReportesFiltrables = () => {
  const [reportes, setReportes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [ciudadano, setCiudadano] = useState(null);
  const [telefono, setTelefono] = useState(null);
  const [estado, setEstado] = useState(null);
  const [folio, setFolio] = useState("");

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/obtener_reportes.php`
      : "http://localhost/api/obtener_reportes.php";

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReportes(data);
          setFiltered(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener reportes:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    filtrar();
  }, [desde, hasta, ciudadano, telefono, estado, folio]);

  const filtrar = () => {
    const filtrados = reportes.filter((rep) => {
      const fecha = new Date(rep.fecha_hora);
      const cumpleFecha = (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      const cumpleCiudadano = ciudadano ? rep.nombre === ciudadano.value : true;
      const cumpleTelefono = telefono ? rep.telefono === telefono.value : true;
      const cumpleEstado = estado ? normalizarEstado(rep.estado) === estado.value : true;
      const cumpleFolio = folio ? String(rep.id).includes(folio.replace(/^REP-/, "")) : true;

      return cumpleFecha && cumpleCiudadano && cumpleTelefono && cumpleEstado && cumpleFolio;
    });
    setFiltered(filtrados);
  };

  const limpiarFiltros = () => {
    setDesde(null);
    setHasta(null);
    setCiudadano(null);
    setTelefono(null);
    setEstado(null);
    setFolio("");
    setFiltered(reportes);
  };

  const normalizarEstado = (estado) => {
    const est = estado.toLowerCase();
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

  const opcionesCiudadanos = Array.from(new Set(reportes.map((r) => r.nombre))).map((nombre) => ({
    label: nombre,
    value: nombre,
  }));

  const opcionesTelefonos = Array.from(new Set(reportes.map((r) => r.telefono))).map((tel) => ({
    label: tel,
    value: tel,
  }));

  const opcionesEstados = [
    { label: "Sin revisar", value: "sin_revisar" },
    { label: "Esperando recepción", value: "esperando" },
    { label: "Completado", value: "completado" },
    { label: "Rechazado", value: "rechazado" },
  ];

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="contenedor-reportes-filtrables">
      <h3>Reportes con Filtros</h3>

      <div className="filtros-reportes">
        <div className="fila-filtros-superior">
          <div className="campo-filtro">
            <label>Ciudadano:</label>
            <Select
              options={opcionesCiudadanos}
              value={ciudadano}
              onChange={setCiudadano}
              isClearable
              placeholder="Buscar por nombre"
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
        </div>

        <div className="fila-filtros-inferior">
          <div className="campo-filtro">
            <label>Desde:</label>
            <DatePicker
              selected={desde}
              onChange={setDesde}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecciona fecha"
              className="input-date"
            />
          </div>

          <div className="campo-filtro">
            <label>Hasta:</label>
            <DatePicker
              selected={hasta}
              onChange={setHasta}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecciona fecha"
              className="input-date"
            />
          </div>

          <div className="campo-filtro">
            <button onClick={limpiarFiltros} className="btn-limpiar-filtros">
              Limpiar
            </button>
          </div>
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
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rep) => (
              <tr key={rep.id}>
                <td>REP-{String(rep.id).padStart(3, "0")}</td>
                <td>{rep.nombre}</td>
                <td>{rep.telefono}</td>
                <td>{rep.tipo_reporte}</td>
                <td>{rep.descripcion}</td>
                <td>{rep.ubicacion}</td>
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
    </div>
  );
};

export default ReportesFiltrables;
