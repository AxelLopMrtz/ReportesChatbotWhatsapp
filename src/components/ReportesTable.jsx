import React, { useEffect, useMemo, useState } from "react"
import "./ReportesTable.css"

const LIMITE_POR_PAGINA = 50

const ORDEN_ESTADOS = [
  "Sin revisar",
  "Esperando recepción",
  "Completado",
  "Rechazado",
]

// Helpers
const safeStr = (v) => String(v ?? "")
const normalizar = (s) =>
  safeStr(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()

const canonEstado = (estado) => {
  const e = normalizar(estado)
  if (e.includes("sin revisar")) return "Sin revisar"
  if (e.includes("esperando")) return "Esperando recepción"
  if (e.includes("completado")) return "Completado"
  if (e.includes("rechazado")) return "Rechazado"
  return safeStr(estado)
}

const getEstadoColor = (estado) => {
  const e = normalizar(estado)
  if (e.includes("completado")) return "estado completado"
  if (e.includes("rechazado")) return "estado rechazado"
  if (e.includes("esperando")) return "estado esperando"
  if (e.includes("sin revisar")) return "estado sin-revisar"
  return "estado desconocido"
}

const ReportesTable = ({ onSeleccionar, filtroEstados = [] }) => {
  const [paginaActual, setPaginaActual] = useState(1)
  const [reportes, setReportes] = useState([])
  const [totalReportes, setTotalReportes] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Estados seleccionados en formato canónico
  const estadosSeleccionados = useMemo(() => {
    const set = new Set(
      (Array.isArray(filtroEstados) ? filtroEstados : []).map(canonEstado)
    )
    return Array.from(set)
  }, [filtroEstados])

  // Clave para resetear página cuando cambian los filtros
  const filtroKey = useMemo(
    () =>
      JSON.stringify(
        estadosSeleccionados.sort(
          (a, b) => ORDEN_ESTADOS.indexOf(a) - ORDEN_ESTADOS.indexOf(b)
        )
      ),
    [estadosSeleccionados]
  )

  const totalPaginas = Math.ceil(
    Math.max(0, totalReportes) / LIMITE_POR_PAGINA
  )

  const cambiarPagina = (nueva) => {
    if (nueva < 1 || nueva > Math.max(1, totalPaginas)) return
    setPaginaActual(nueva)
  }

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroKey])

  // Fetch con filtros
  useEffect(() => {
    const API_URL =
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/obtener_reportes_paginado.php"

    const params = new URLSearchParams({
      pagina: String(paginaActual),
      limite: String(LIMITE_POR_PAGINA),
    })

    if (estadosSeleccionados.length > 0) {
      params.append("estados", estadosSeleccionados.join(","))
    }

    const controller = new AbortController()

    const fetchReportes = async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Error al cargar reportes")
        }
        setReportes(Array.isArray(json.data) ? json.data : [])
        setTotalReportes(Number(json.total ?? 0))
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message)
          setReportes([])
          setTotalReportes(0)
        }
      } finally {
        setCargando(false)
      }
    }

    fetchReportes()
    return () => controller.abort()
  }, [paginaActual, filtroKey, estadosSeleccionados])

  // Exportar CSV
  const exportToCsv = (rows, filename = "export.csv") => {
    if (!rows || !rows.length) {
      alert("No hay datos para exportar")
      return
    }
    const headers = [
      "Folio",
      "Ciudadano",
      "Teléfono",
      "Tipo",
      "Descripción",
      "Ubicación",
      "Estado",
      "Fecha",
    ]
    const csvContent = [
      headers.join(","),
      ...rows.map((rep) => {
        const fila = [
          safeStr(rep.id),
          safeStr(rep.nombre),
          safeStr(rep.telefono),
          safeStr(rep.tipo_reporte),
          safeStr(rep.descripcion),
          safeStr(rep.ubicacion),
          safeStr(rep.estado),
          rep.fecha_hora
            ? new Date(rep.fecha_hora).toLocaleString("es-MX")
            : "",
        ]
        return fila
          .map((val) => {
            const escaped = String(val).replace(/"/g, '""')
            return escaped.includes(",") || escaped.includes("\n")
              ? `"${escaped}"`
              : escaped
          })
          .join(",")
      }),
    ].join("\r\n")

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPagina = () => {
    exportToCsv(reportes, `reportes_pagina_${paginaActual}.csv`)
  }

  const handleExportFiltrados = async () => {
    const API_URL =
      (process.env.REACT_APP_API_URL || "http://localhost/api") +
      "/obtener_reportes_paginado.php"

    const params = new URLSearchParams({
      pagina: "1",
      limite: String(Math.max(1, totalReportes || 100000)),
    })
    if (estadosSeleccionados.length > 0) {
      params.append("estados", estadosSeleccionados.join(","))
    }

    try {
      const res = await fetch(`${API_URL}?${params.toString()}`, {
        cache: "no-store",
      })
      const json = await res.json()
      exportToCsv(json.data || [], "reportes_filtrados.csv")
    } catch (e) {
      alert("Error al exportar: " + e.message)
    }
  }

  return (
    <div className="tabla-reportes-container">
      <h3>Reportes recientes</h3>

      <div className="botones-exportar">
        <button className="boton-exportar" onClick={handleExportPagina}>
          Exportar página actual
        </button>
        <button className="boton-exportar" onClick={handleExportFiltrados}>
          Exportar CSV
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
                    <td>{safeStr(rep.id)}</td>
                    <td>{safeStr(rep.nombre) || "—"}</td>
                    <td>{safeStr(rep.telefono) || "—"}</td>
                    <td>{safeStr(rep.tipo_reporte) || "—"}</td>
                    <td>{safeStr(rep.descripcion) || "—"}</td>
                    <td>{safeStr(rep.ubicacion) || "—"}</td>
                    <td>
                      <span className={getEstadoColor(rep.estado)}>
                        {rep.estado}
                      </span>
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
              .filter(
                (n) =>
                  Math.abs(n - paginaActual) <= 2 ||
                  n === 1 ||
                  n === totalPaginas
              )
              .map((n, i, arr) => {
                const prev = arr[i - 1]
                const gap = prev && n - prev > 1
                if (gap)
                  return (
                    <span key={`gap-${n}`} className="paginacion-gap">
                      ...
                    </span>
                  )
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
