import React, { useState } from "react";
import Navbar from "./Navbar";
import SummaryCards from "./SummaryCards";
import ReportesTable from "./ReportesTable";
import MapaReportes from "./MapaReportes";
import Sidebar from "./Sidebar";
import HistorialMensajes from "./HistorialMensajes";
import Usuarios from "./Usuarios";
import ReportesFiltrables from "./ReportesFiltrables";
import CiudadanosCards from "./CiudadanosCards";
import N8nFlowViewer from './n8nFlowViewer';

const Menu = ({ usuario }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [vista, setVista] = useState("inicio");

  const [filtrosActivos, setFiltrosActivos] = useState([
    "Sin revisar",
    "Esperando recepción",
    "Completado",
    "Rechazado"
  ]);

  const [marcadorSeleccionado, setMarcadorSeleccionado] = useState(null); // 🆕 NUEVO

  const handleLogout = () => window.location.reload();

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
            <div className="row mt-5">
              <h3 className="mb-3">Flujo n8n (visualización)</h3>
              <N8nFlowViewer />
            </div>
            <div className="row mt-4">
              <MapaReportes
                filtrosActivos={filtrosActivos}
                marcadorSeleccionado={marcadorSeleccionado} // 🆕
              />
            </div>
            <div className="row mt-4">
              <ReportesTable
                onSeleccionar={(id) => setMarcadorSeleccionado(id)} // 🆕
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
