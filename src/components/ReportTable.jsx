import React from "react";

const ReportTable = ({ datos }) => {
  if (!datos || datos.length === 0) return <p style={{ textAlign: "center" }}>No hay datos cargados.</p>;

  const columnas = Object.keys(datos[0]);

  return (
    <div className="container" style={{ background: "transparent", boxShadow: "none" }}>
      <table>
        <thead>
          <tr>
            {columnas.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i}>
              {columnas.map((col, j) => (
                <td key={j}>{fila[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
