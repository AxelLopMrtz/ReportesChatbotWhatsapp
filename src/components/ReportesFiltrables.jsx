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
  }, [desde, hasta, ciudadano, telefono]);

  const filtrar = () => {
    const filtrados = reportes.filter((rep) => {
      const fecha = new Date(rep.fecha_hora);
      const cumpleFecha =
        (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

      const cumpleCiudadano = ciudadano
        ? rep.nombre === ciudadano.value
        : true;

      const cumpleTelefono = telefono
        ? rep.telefono === telefono.value
        : true;

      return cumpleFecha && cumpleCiudadano && cumpleTelefono;
    });

    setFiltered(filtrados);
  };

  const limpiarFiltros = () => {
    setDesde(null);
    setHasta(null);
    setCiudadano(null);
    setTelefono(null);
    setFiltered(reportes);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completado":
        return "badge verde";
      case "Rechazado":
        return "badge rojo";
      case "En proceso":
      case "Esperando recepción":
        return "badge naranja";
      case "Sin revisar":
        return "badge morado";
      default:
        return "badge gris";
    }
  };

  const opcionesCiudadanos = Array.from(
    new Set(reportes.map((r) => r.nombre))
  ).map((nombre) => ({ label: nombre, value: nombre }));

  const opcionesTelefonos = Array.from(
    new Set(reportes.map((r) => r.telefono))
  ).map((tel) => ({ label: tel, value: tel }));

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="contenedor-reportes-filtrables">
      <h3>Reportes con Filtros</h3>

    <div className="filtros-reportes">
      <div className="campo-filtro">
        <label>Ciudadano:</label>
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
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
          className="react-select-container"
          classNamePrefix="react-select"
          options={opcionesTelefonos}
          value={telefono}
          onChange={setTelefono}
          isClearable
          placeholder="Buscar por número"
        />
      </div>

      <div className="campo-filtro">
        <label>Desde:</label>
        <DatePicker
          selected={desde}
          onChange={(date) => setDesde(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Selecciona fecha"
          className="input-date"
        />
      </div>

      <div className="campo-filtro">
        <label>Hasta:</label>
        <DatePicker
          selected={hasta}
          onChange={(date) => setHasta(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Selecciona fecha"
          className="input-date"
        />
      </div>

      <div className="campo-filtro">
        <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
          Limpiar
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
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rep) => (
              <tr key={rep.id}>
                <td>REP-{rep.id.toString().padStart(3, "0")}</td>
                <td>{rep.nombre}</td>
                <td>{rep.telefono}</td>
                <td>{rep.tipo_reporte}</td>
                <td>{rep.descripcion}</td>
                <td>{rep.ubicacion}</td>
                <td>
                  <span className={getEstadoColor(rep.estado)}>
                    {rep.estado}
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
