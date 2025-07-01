import React from "react";
import "./Sidebar.css";
import { FaTimes, FaInbox, FaUsers, FaFileAlt, FaCogs } from "react-icons/fa";

const Sidebar = ({ visible, onClose, onSelect }) => {
  return (
    <div className={`sidebar-slide ${visible ? "visible" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Menú</span>
        <FaTimes className="close-btn" onClick={onClose} />
      </div>
      <ul className="sidebar-options">
        <li onClick={() => onSelect("historial")}><FaInbox /> Historial</li>
        <li onClick={() => onSelect("ciudadanos")}><FaUsers /> Ciudadanos</li>
        <li onClick={() => onSelect("reportes")}><FaFileAlt /> Reportes</li>
        <li onClick={() => onSelect("config")}><FaCogs /> Configuración</li>
      </ul>
    </div>
  );
};

export default Sidebar;
