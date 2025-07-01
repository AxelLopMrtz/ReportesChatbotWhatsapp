import React, { useState } from "react";

const ExcelUploaderMultiple = ({ onSheetsLoaded }) => {
  const [archivo, setArchivo] = useState(null);

  const leerArchivo = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const contenido = e.target.result;
      const workbook = window.XLSX.read(contenido, { type: "binary" });

      const datosPorHoja = {};
      workbook.SheetNames.forEach((nombreHoja) => {
        if (nombreHoja.toLowerCase() !== "santiago") {
          const datos = window.XLSX.utils.sheet_to_json(workbook.Sheets[nombreHoja]);
          datosPorHoja[nombreHoja] = datos;
        }
      });

      onSheetsLoaded(datosPorHoja);
    };
    reader.readAsBinaryString(archivo);
  };

  return (
    <div className="container">
      <h2>Subir archivo Excel con múltiples hojas</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setArchivo(e.target.files[0])}
      />
      <button onClick={leerArchivo} disabled={!archivo}>
        Cargar hojas
      </button>
    </div>
  );
};

export default ExcelUploaderMultiple;
