import React, { useEffect, useState } from "react"
import "./ReportesTable.css"

const LIMITE_POR_PAGINA = 50

const ReportesTable = ({ onSeleccionar }) => {
  const [paginaActual, setPaginaActual] = useState(1)
  const [reportes, setReportes] = useState([])
  const [totalReportes, setTotalReportes] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const API_URL =
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/obtener_reportes_paginado.php"
    const fetchReportes = async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}?pagina=${paginaActual}&limite=${LIMITE_POR_PAGINA}`)
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

  return (
    <div className="tabla-reportes-container">
      <h3>Reportes recientes</h3>

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
                    <td>{`REP-${String(rep.id).padStart(3, "0")}`}</td>
                    <td>{safeStr(rep.nombre) || "—"}</td>
                    <td>{safeStr(rep.telefono) || "—"}</td>
                    <td>{safeStr(rep.tipo_reporte) || "—"}</td>
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
            <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
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
