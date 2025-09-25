import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import SummaryCards from "./SummaryCards";
import ReportesTable from "./ReportesTable";
import MapaReportes from "./MapaReportes";
import Sidebar from "./Sidebar";
import HistorialMensajes from "./HistorialMensajes";
import Usuarios from "./Usuarios";
import ReportesFiltrables from "./ReportesFiltrables";
import CiudadanosCards from "./CiudadanosCards";
import N8nFlowViewer from "./n8nFlowViewer";
import Dashboard from "./Dashboard";

const Menu = ({ usuario, onLogout }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [vista, setVista] = useState("inicio");

  const [filtrosActivos, setFiltrosActivos] = useState([
    "Sin revisar",
    "Esperando recepción",
    "Completado",
    "Rechazado",
  ]);

  const [marcadorSeleccionado, setMarcadorSeleccionado] = useState(null);

  // Estado centralizado de reportes (se carga una sola vez)
  const [reportes, setReportes] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/obtener_reportes.php`
      : "http://localhost/chatbotwhatsapp/api/obtener_reportes.php";

    const fetchReportes = async () => {
      try {
        setCargandoReportes(true);
        setErrorReportes(null);
        const res = await fetch(API_URL);
        const data = await res.json();
        setReportes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener reportes:", err);
        setErrorReportes("No se pudieron cargar los reportes.");
        setReportes([]);
      } finally {
        setCargandoReportes(false);
      }
    };

    fetchReportes();
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  const renderVista = () => {
    switch (vista) {
      case "inicio":
        return (
          <>
            <h2 className="mb-4">Bienvenido, {usuario.username}</h2>

            <div className="row">
              <SummaryCards
                filtrosActivos={filtrosActivos}
                setFiltrosActivos={setFiltrosActivos}
              />
            </div>

            <div className="row mt-4">
              <h3 className="mb-3">Flujo n8n (visualización)</h3>
              <N8nFlowViewer />
            </div>

            <div className="row mt-4">
              <MapaReportes
                filtrosActivos={filtrosActivos}
                marcadorSeleccionado={marcadorSeleccionado}
                reportes={reportes}
                cargando={cargandoReportes}
                error={errorReportes}
              />
            </div>

            <div className="row mt-4">
              <ReportesTable
                reportes={reportes}
                cargando={cargandoReportes}
                error={errorReportes}
                onSeleccionar={(id) => setMarcadorSeleccionado(id)}
                filtroEstados={filtrosActivos}
              />
            </div>
          </>
        );

      case "historial":
        return (
          <div className="row mt-4">
            <HistorialMensajes />
          </div>
        );

      case "ciudadanos":
        return (
          <div className="row mt-4">
            <CiudadanosCards />
          </div>
        );

      case "reportes":
        return (
          <div className="row mt-4">
            <ReportesFiltrables />
          </div>
        );

      case "config":
        return (
          <div className="row mt-4">
            <Usuarios />
          </div>
        );

      case "dashboard":
        return (
          <div className="row mt-4">
            <Dashboard reportes={reportes} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="menu-dashboard">
      <Navbar
        usuario={usuario}
        onLogout={handleLogout}
        onToggleMenu={() => setMenuVisible(true)}
      />

      <Sidebar
        visible={menuVisible}
        vistaActual={vista}
        onClose={() => setMenuVisible(false)}
        onSelect={(v) => {
          setVista(v);
          setMenuVisible(false);
        }}
      />

      <div className="container mt-5">{renderVista()}</div>
    </div>
  );
};

export default Menu;
