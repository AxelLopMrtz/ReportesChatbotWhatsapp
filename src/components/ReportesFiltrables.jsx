import React, { useEffect, useState } from "react";
import './ReportesFiltrables.css';

const ReportesFiltrables = () => {
  const [reportes, setReportes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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
        } else {
          console.error("La API no devolvió un array:", data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener reportes:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    filtrarPorFechas();
  }, [desde, hasta]);

  const filtrarPorFechas = () => {
    if (!desde && !hasta) {
      setFiltered(reportes);
      return;
    }

    const desdeDate = desde ? new Date(desde) : null;
    const hastaDate = hasta ? new Date(hasta + "T23:59:59") : null;

    const filtrados = reportes.filter((rep) => {
      const fechaRep = new Date(rep.fecha_hora);
      return (!desdeDate || fechaRep >= desdeDate) && (!hastaDate || fechaRep <= hastaDate);
    });

    setFiltered(filtrados);
  };

  const limpiarFiltros = () => {
    setDesde("");
    setHasta("");
    setFiltered(reportes);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completado":
        return "estado completado";
      case "Rechazado":
        return "estado rechazado";
      case "En proceso":
        return "estado proceso";
      case "Esperando recepción":
        return "estado esperando";
      case "Sin revisar":
        return "estado sinrevisar";
      default:
        return "estado desconocido";
    }
  };

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="contenedor-reportes-filtrables">
      <h3>Reportes con Filtros</h3>

      <div className="filtros-reportes">
        <label>
          Desde:
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta:
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>Limpiar</button>
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
                <td>{rep.id}</td>
                <td>{rep.nombre || "No registrado"}</td>
                <td>{rep.telefono || "Sin teléfono"}</td>
                <td>{rep.tipo_reporte}</td>
                <td>{rep.descripcion}</td>
                <td>{rep.ubicacion}</td>
                <td>
                  <span className={getEstadoColor(rep.estado)}>
                    {rep.estado || "Sin estado"}
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
