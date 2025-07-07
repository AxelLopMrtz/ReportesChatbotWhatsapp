import React, { useState } from "react";
import Navbar from "./Navbar";
import SummaryCards from "./SummaryCards";
import ReportesTable from "./ReportesTable"; // ← Aún se importa por si lo usas en otra parte
import MapaReportes from "./MapaReportes";
import Sidebar from "./Sidebar";
import HistorialMensajes from "./HistorialMensajes";
import Usuarios from "./Usuarios";
import ReportesFiltrables from "./ReportesFiltrables"; // ✅ Nuevo componente filtrable

const Menu = ({ usuario }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [vista, setVista] = useState("inicio");

  const handleLogout = () => window.location.reload();

  const renderVista = () => {
    switch (vista) {
      case "inicio":
        return (
          <>
            <h2 className="mb-4">Bienvenido, {usuario.username}</h2>
            <div className="row"><SummaryCards /></div>
            <div className="row mt-4"><MapaReportes /></div>
            <div className="row mt-4"><ReportesTable /></div>
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
            <h2>Vista de Ciudadanos (en desarrollo)</h2>
          </div>
        );
      case "reportes":
        return (
          <div className="row mt-4">
            <ReportesFiltrables /> {/* ✅ Aquí ya usamos la tabla con filtros */}
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
      <div className="container mt-5">
        {renderVista()}
      </div>
    </div>
  );
};

export default Menu;
