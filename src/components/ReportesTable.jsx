import React, { useEffect, useState } from "react"
import "./ReportesTable.css"

const LIMITE_POR_PAGINA = 50

const ReportesTable = ({ onSeleccionar }) => {
  const [paginaActual, setPaginaActual] = useState(1)
  const [reportes, setReportes] = useState([])
  const [totalReportes, setTotalReportes] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Carga de la página actual
  useEffect(() => {
    const API_URL =
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/obtener_reportes_paginado.php"
    const fetchReportes = async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch(
          `${API_URL}?pagina=${paginaActual}&limite=${LIMITE_POR_PAGINA}`
        )
        const json = await res.json()
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Error al cargar reportes")
        }
        setReportes(json.data || [])
        setTotalReportes(json.total || 0)
      } catch (e) {
        setError(e.message)
        setReportes([])
      } finally {
        setCargando(false)
      }
    }
    fetchReportes()
  }, [paginaActual])

  const totalPaginas = Math.ceil(totalReportes / LIMITE_POR_PAGINA)

  const safeStr = (v) => String(v ?? "")
  const normalizar = (s) =>
    safeStr(s)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()

  const getEstadoColor = (estado) => {
    const e = normalizar(estado)
    if (e.includes("completado")) return "estado completado"
    if (e.includes("rechazado")) return "estado rechazado"
    if (e.includes("esperando")) return "estado esperando"
    if (e.includes("sin revisar")) return "estado sin-revisar"
    return "estado desconocido"
  }

  const cambiarPagina = (nueva) => {
    if (nueva < 1 || nueva > totalPaginas) return
    setPaginaActual(nueva)
  }

  const exportToCsv = (rows, filename = "export.csv") => {
    if (!rows || !rows.length) {
      alert("No hay datos para exportar")
      return
    }

    // Define columnas en orden deseado
    const headers = [
      "Folio",
      "Ciudadano",
      "Teléfono",
      "Tipo",
      "Descripción",
      "Ubicación",
      "Estado",
      "Fecha"
    ]

    const csvContent = [
      headers.join(","), // encabezados
      ...rows.map((rep) => {
        const fila = [
          `REP-${String(rep.id).padStart(3, "0")}`,
          safeStr(rep.nombre),
          safeStr(rep.telefono),
          safeStr(rep.tipo_reporte),
          safeStr(rep.descripcion),
          safeStr(rep.ubicacion),
          safeStr(rep.estado),
          rep.fecha_hora
            ? new Date(rep.fecha_hora).toLocaleString("es-MX")
            : ""
        ]
        return fila.map((val) => {
          const escaped = String(val).replace(/"/g, '""')
          if (escaped.includes(",") || escaped.includes("\n")) {
            return `"${escaped}"`
          }
          return escaped
        }).join(",")
      }),
    ].join("\r\n")

    // BOM para que Excel muestre bien caracteres acentuados
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  // Exportar la página actual
  const handleExportPagina = () => {
    // usaremos `reportes` que ya están cargados
    exportToCsv(reportes, `reportes_pagina_${paginaActual}.csv`)
  }

  // Exportar todos los reportes (petición aparte)
  const handleExportTodos = async () => {
    const API_URL =
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/obtener_reportes.php" // ojo: el endpoint que devuelve todos
    try {
      const res = await fetch(API_URL)
      const json = await res.json()
      // si usaste el endpoint original que devuelve array directamente
      const rows = Array.isArray(json) ? json : json.data || []
      exportToCsv(rows, "reportes_todos.csv")
    } catch (e) {
      alert("Error al obtener todos los datos para exportar: " + e.message)
    }
  }

  return (
    <div className="tabla-reportes-container">
      <h3>Reportes recientes</h3>

      {/* Botones de exportar */}
      <div className="botones-exportar">
        <button className="boton-exportar" onClick={handleExportPagina}>
          Exportar página actual
        </button>
        <button className="boton-exportar" onClick={handleExportTodos}>
          Exportar todos
        </button>
      </div>


      {cargando && <p>Cargando página {paginaActual}...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!cargando && !error && reportes.length === 0 && <p>No hay datos.</p>}

      {!cargando && !error && reportes.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="tabla-reportes">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Ciudadano</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((rep) => (
                  <tr
                    key={rep.id}
                    onClick={() => onSeleccionar?.(rep.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{`${String(rep.id).padStart(3, "0")}`}</td>
                    <td>{safeStr(rep.nombre) || "—"}</td>
                    <td>{safeStr(rep.telefono) || "—"}</td>
                    <td>{safeStr(rep.tipo_reporte) || "—"}</td>
                    <td>{safeStr(rep.descripcion) || "—"}</td>
                    <td>{safeStr(rep.ubicacion) || "—"}</td>
                    <td>
                      <span className={getEstadoColor(rep.estado)}>{rep.estado}</span>
                    </td>
                    <td>
                      {rep.fecha_hora
                        ? new Date(rep.fecha_hora).toLocaleString("es-MX")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <div className="paginacion">
            <button onClick={() => cambiarPagina(1)} disabled={paginaActual === 1}>
              « Primera
            </button>
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹ Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - paginaActual) <= 2 || n === 1 || n === totalPaginas)
              .map((n, i, arr) => {
                const prev = arr[i - 1]
                const gap = prev && n - prev > 1
                if (gap) return <span key={`gap-${n}`} className="paginacion-gap">...</span>
                return (
                  <button
                    key={n}
                    onClick={() => cambiarPagina(n)}
                    className={n === paginaActual ? "activo" : ""}
                  >
                    {n}
                  </button>
                )
              })}

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente ›
            </button>
            <button
              onClick={() => cambiarPagina(totalPaginas)}
              disabled={paginaActual === totalPaginas}
            >
              Última »
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportesTable
