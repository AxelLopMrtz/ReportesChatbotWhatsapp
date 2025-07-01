import React from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import { FaBars } from 'react-icons/fa';

const Navbar = ({ usuario, onLogout, onToggleMenu }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <FaBars className="menu-icon" onClick={onToggleMenu} />
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span className="navbar-title">WhatsReporte</span>
      </div>

      <div className="navbar-right">
        <span className="navbar-user">
          <i className="fas fa-user-circle"></i> {usuario.username}
        </span>
        <button className="logout-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
