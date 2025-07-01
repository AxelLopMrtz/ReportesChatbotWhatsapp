import React, { useState } from "react";
import Navbar from "./Navbar";
import SummaryCards from "./SummaryCards";
import ReportesTable from "./ReportesTable";
import MapaReportes from "./MapaReportes";
import Sidebar from "./Sidebar";

const Menu = ({ usuario }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [vista, setVista] = useState("historial");

  const handleLogout = () => window.location.reload();

  const renderVista = () => {
    switch (vista) {
      case "historial":
        return (
          <>
            <h2 className="mb-4">Bienvenido, {usuario.username}</h2>
            <div className="row"><SummaryCards /></div>
            <div className="row mt-4"><MapaReportes /></div>
            <div className="row mt-4"><ReportesTable /></div>
          </>
        );
      case "ciudadanos":
        return <h2>Vista de Ciudadanos (en desarrollo)</h2>;
      case "reportes":
        return <h2>Vista de Reportes (en desarrollo)</h2>;
      case "config":
        return <h2>Configuración del sistema (en desarrollo)</h2>;
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
