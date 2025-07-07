import React, { useState, useEffect } from "react";
import "./Usuarios.css";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", rol: "operador", activo: 1 });
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    fetch("http://localhost/api/usuarios_api.php")
      .then((res) => res.json())
      .then(setUsuarios);
  }, []);

  const guardarUsuario = () => {
    const method = editando ? "PUT" : "POST";
    const payload = editando ? { ...form, id: editando } : form;

    fetch("http://localhost/api/usuarios_api.php", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(() => {
        setForm({ username: "", password: "", rol: "operador", activo: 1 });
        setEditando(null);
        return fetch("http://localhost/api/usuarios_api.php");
      })
      .then(res => res.json())
      .then(setUsuarios);
  };

  const eliminarUsuario = (id) => {
    if (window.confirm("¿Eliminar este usuario?")) {
      fetch("http://localhost/api/usuarios_api.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
        .then(res => res.json())
        .then(() => setUsuarios(prev => prev.filter(u => u.id !== id)));
    }
  };

  const editar = (usuario) => {
    setForm({ ...usuario, password: "" });
    setEditando(usuario.id);
  };

  return (
    <div className="tabla-container" style={{ marginTop: "80px" }}>
      <h3>Gestión de Usuarios</h3>
      <input className="form-control" placeholder="Usuario" value={form.username}
        onChange={e => setForm({ ...form, username: e.target.value })} />
      <input className="form-control mt-2" type="password" placeholder="Contraseña"
        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <select className="form-control mt-2" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
        <option value="admin">admin</option>
        <option value="operador">operador</option>
        <option value="revisor">revisor</option>
      </select>
      <button className="btn btn-success mt-2" onClick={guardarUsuario}>
        {editando ? "Actualizar" : "Agregar"} Usuario
      </button>

      <table className="tabla-reportes mt-4">
        <thead>
          <tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Activo</th><th>Fecha</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.rol}</td>
              <td>{u.activo ? "✔️" : "❌"}</td>
              <td>{new Date(u.fecha_creacion).toLocaleString("es-MX")}</td>
              <td>
                <button onClick={() => editar(u)}>✏️</button>
                <button onClick={() => eliminarUsuario(u.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;
