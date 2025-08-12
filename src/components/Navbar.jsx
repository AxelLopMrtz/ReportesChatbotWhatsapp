import React from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import { FaBars, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ usuario, onLogout, onToggleMenu }) => {
  return (
    <nav className="navbar" role="navigation" aria-label="Barra de navegación">
      <div className="navbar-inner">
        {/* Izquierda */}
        <div className="navbar-left">
          <button
            type="button"
            className="menu-btn"
            onClick={onToggleMenu}
            aria-label="Abrir menú"
          >
            <FaBars className="menu-icon" />
          </button>

          <img src={logo} alt="Logo WhatsReporte" className="navbar-logo" />
          <span className="navbar-title">WhatsReporte</span>
        </div>

        {/* Derecha */}
        <div className="navbar-right">
          <span className="user-pill">
            <FaUserCircle className="user-icon" />
            <span className="user-name">{usuario?.username}</span>
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            <FaSignOutAlt className="logout-icon" />
            <span className="logout-text">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
