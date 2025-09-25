import React from "react";
import "./Sidebar.css";
import {
  FaTimes,
  FaHome,
  FaInbox,
  FaUsers,
  FaFileAlt,
  FaUserCog,
} from "react-icons/fa";

const Sidebar = ({ visible, onClose, onSelect, vistaActual }) => {
  return (
    <div className={`sidebar-slide ${visible ? "visible" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Menú</span>
        <FaTimes className="close-btn" onClick={onClose} />
      </div>
      <ul className="sidebar-options">
        <li
          className={vistaActual === "inicio" ? "activo" : ""}
          onClick={() => onSelect("inicio")}
        >
          <FaHome /> Inicio
        </li>
        <li
          className={vistaActual === "historial" ? "activo" : ""}
          onClick={() => onSelect("historial")}
        >
          <FaInbox /> Historial de Mensajes
        </li>
        <li
          className={vistaActual === "ciudadanos" ? "activo" : ""}
          onClick={() => onSelect("ciudadanos")}
        >
          <FaUsers /> Ciudadanos
        </li>
        <li
          className={vistaActual === "reportes" ? "activo" : ""}
          onClick={() => onSelect("reportes")}
        >
          <FaFileAlt /> Reportes
        </li>
        <li
          className={vistaActual === "dashboard" ? "activo" : ""}
          onClick={() => onSelect("dashboard")}
        >
          <FaHome /> Dashboard
        </li>
        <li
          className={vistaActual === "config" ? "activo" : ""}
          onClick={() => onSelect("config")}
        >
          <FaUserCog /> Gestión de Usuarios
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
