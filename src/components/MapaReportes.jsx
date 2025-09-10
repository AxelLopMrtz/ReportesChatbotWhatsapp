"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import L from "leaflet"
import "leaflet.markercluster"
import axios from "axios"
import "./MapaReportes.css"

// 🎨 Iconos por estado (claves en "forma visual")
const iconColors = {
  Completado: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
  Rechazado: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
  "Esperando recepción": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-orange.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
  "Sin revisar": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
  default: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
}

// 🔤 Normaliza texto (quita acentos y usa minúsculas)
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()

// 🔁 Mapea estados a etiquetas visuales estandarizadas (para icono y filtro)
const estadoVisual = (estadoCrudo) => {
  const e = norm(estadoCrudo)
  if (e === "completado") return "Completado"
  if (e === "rechazado") return "Rechazado"
  if (e === "esperando" || e === "esperando recepcion") return "Esperando recepción"
  if (e === "sin revisar" || e === "no revisado") return "Sin revisar"
  return "Sin revisar" // por defecto
}

// ✅ Hook para centrar y abrir popup del marcador seleccionado con scroll
const IrAlMarcador = ({ reporte }) => {
  const map = useMap()

  useEffect(() => {
    if (reporte && map && Number.isFinite(reporte.lat) && Number.isFinite(reporte.lng)) {
      map.flyTo([reporte.lat, reporte.lng], 15, { animate: true })

      // Buscar el marcador en todas las capas, incluyendo clusters
      const buscarYAbrirMarcador = () => {
        let marcadorEncontrado = false

        if (map._markerClusterGroup) {
          map._markerClusterGroup.eachLayer((marker) => {
            if (marker._latlng?.lat === reporte.lat && marker._latlng?.lng === reporte.lng) {
              // Si el marcador está en un cluster, expandir el cluster primero
              if (map._markerClusterGroup.getVisibleParent(marker) !== marker) {
                map._markerClusterGroup.zoomToShowLayer(marker, () => {
                  setTimeout(() => {
                    if (marker.openPopup) {
                      marker.openPopup()
                    }
                  }, 300)
                })
              } else {
                // Si el marcador ya es visible, abrir popup directamente
                if (marker.openPopup) {
                  marker.openPopup()
                }
              }
              marcadorEncontrado = true
            }
          })
        }

        // Scroll al popup después de un delay
        if (marcadorEncontrado) {
          setTimeout(() => {
            const popupElement = document.querySelector(`[data-id="popup-${reporte.id}"]`)
            if (popupElement) {
              popupElement.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          }, 500)
        }
      }

      // Ejecutar después de un pequeño delay para asegurar que el mapa esté listo
      setTimeout(buscarYAbrirMarcador, 100)
    }
  }, [reporte, map])

  return null
}

const CustomMarkerClusterGroup = ({ children }) => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Create marker cluster group
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let className = "marker-cluster marker-cluster-"

        if (count < 10) {
          className += "small"
        } else if (count < 100) {
          className += "medium"
        } else {
          className += "large"
        }

        return new L.DivIcon({
          html: `<div><span>${count}</span></div>`,
          className: className,
          iconSize: new L.Point(40, 40),
        })
      },
    })

    // Add to map
    map.addLayer(markerClusterGroup)

    // Store reference for cleanup and access
    map._markerClusterGroup = markerClusterGroup

    return () => {
      if (map._markerClusterGroup) {
        map.removeLayer(map._markerClusterGroup)
        delete map._markerClusterGroup
      }
    }
  }, [map])

  return null
}

const ClusteredMarker = ({ position, icon, children, reporte }) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !map._markerClusterGroup) return

    const marker = L.marker(position, { icon })

    // Add popup content
    if (children) {
      const popupContent = `
        <div data-id="popup-${reporte.id}">
          <strong>${reporte.tipo_reporte || "Tipo no definido"}</strong><br/>
          ${reporte.descripcion}<br/>
          <strong>Ciudadano:</strong> ${reporte.nombre}<br/>
          <strong>Estado:</strong> ${reporte.estadoUI}<br/>
          <em>${reporte.ubicacion}</em>
        </div>
      `
      marker.bindPopup(popupContent)
    }

    // Add to cluster group
    map._markerClusterGroup.addLayer(marker)

    return () => {
      if (map._markerClusterGroup) {
        map._markerClusterGroup.removeLayer(marker)
      }
    }
  }, [map, position, icon, children, reporte])

  return null
}

const MapaReportes = ({ filtrosActivos = [], marcadorSeleccionado }) => {
  const [reportes, setReportes] = useState([])
  const [mapCenter, setMapCenter] = useState([19.3, -99.15])

  useEffect(() => {
    const API_URL = (process.env.REACT_APP_API_URL || "http://localhost/api") + "/obtener_reportes.php"

    axios
      .get(API_URL, { headers: { Accept: "application/json" } })
      .then((response) => {
        const payload = Array.isArray(response.data)
          ? response.data
          : response.data?.data || response.data?.reportes || []

        const datos = (payload || [])
          .map((r) => {
            // 1) Prioriza lat/lng del backend
            let lat = Number(r.lat)
            let lng = Number(r.lng)

            // 2) Fallback: intenta parsear "ubicacion" como "lat,lng"
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              if (r.ubicacion && String(r.ubicacion).includes(",")) {
                const [a, b] = String(r.ubicacion)
                  .split(",")
                  .map((x) => Number(x))
                if (Number.isFinite(a) && Number.isFinite(b)) {
                  lat = a
                  lng = b
                }
              }
            }

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

            const estadoUI = estadoVisual(r.estado)
            return { ...r, lat, lng, estadoUI }
          })
          .filter(Boolean)

        setReportes(datos)

        if (datos.length > 0) {
          setMapCenter([datos[0].lat, datos[0].lng])
        }
      })
      .catch((err) => console.error("❌ Error al cargar reportes:", err))
  }, [])

  const reporteSeleccionado = useMemo(
    () => reportes.find((r) => r.id === marcadorSeleccionado),
    [reportes, marcadorSeleccionado],
  )

  // 🧲 Aplica filtros: si no pasan filtros, muestra todos
  const reportesVisibles = useMemo(() => {
    if (!filtrosActivos || filtrosActivos.length === 0) return reportes
    const setFiltros = new Set(
      filtrosActivos.map((f) => estadoVisual(f)), // normaliza filtros entrantes
    )
    return reportes.filter((r) => setFiltros.has(r.estadoUI))
  }, [reportes, filtrosActivos])

  return (
    <div className="mapa-card" id="mapa-reportes">
      <h4 className="titulo-mapa">Mapa de Reportes</h4>

      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="leaflet-container"
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CustomMarkerClusterGroup />

        {reportesVisibles.map((reporte) => {
          const icon = iconColors[reporte.estadoUI] || iconColors.default
          return (
            <ClusteredMarker
              key={String(reporte.id)}
              position={[reporte.lat, reporte.lng]}
              icon={icon}
              reporte={reporte}
            >
              <Popup>
                <div data-id={`popup-${reporte.id}`}>
                  <strong>{reporte.tipo_reporte || "Tipo no definido"}</strong>
                  <br />
                  {reporte.descripcion}
                  <br />
                  <strong>Ciudadano:</strong> {reporte.nombre}
                  <br />
                  <strong>Estado:</strong> {reporte.estadoUI}
                  <br />
                  <em>{reporte.ubicacion}</em>
                </div>
              </Popup>
            </ClusteredMarker>
          )
        })}

        {reporteSeleccionado && <IrAlMarcador reporte={reporteSeleccionado} />}
      </MapContainer>
    </div>
  )
}

export default MapaReportes
