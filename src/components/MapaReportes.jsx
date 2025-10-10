"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import L from "leaflet"
import "leaflet.markercluster"
import axios from "axios"
import "./MapaReportes.css"

// Pre-crea iconos para reutilizarlos
const ICONS = {
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

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()

const estadoVisual = (estadoCrudo) => {
  const e = norm(estadoCrudo)
  if (e === "completado") return "Completado"
  if (e === "rechazado") return "Rechazado"
  if (e === "esperando" || e.includes("esperando")) return "Esperando recepción"
  if (e === "sin revisar" || e === "no revisado") return "Sin revisar"
  return "Sin revisar"
}

const CustomClusterLayer = ({ reportes }) => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Crear cluster group con opciones optimizadas
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: false, // desactiva animación costosa
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
    })

    // Prepara un array de marcadores para bulk
    const markers = reportes.map((r) => {
      const lat = r.lat, lng = r.lng
      const icon = ICONS[r.estadoUI] || ICONS.default
      const marker = L.marker([lat, lng], { icon })
      const popupHtml = `
        <div data-id="popup-${r.id}">
          <strong>${r.tipo_reporte || "Tipo no definido"}</strong><br/>
          ${r.descripcion || ""}<br/>
          <strong>Ciudadano:</strong> ${r.nombre}<br/>
          <strong>Estado:</strong> ${r.estadoUI}<br/>
          <em>${r.ubicacion || ""}</em>
        </div>
      `
      marker.bindPopup(popupHtml)
      return marker
    })

    // Añade todos juntos
    clusterGroup.addLayers(markers)

    map.addLayer(clusterGroup)
    map._markerClusterGroup = clusterGroup

    return () => {
      if (map._markerClusterGroup) {
        map.removeLayer(map._markerClusterGroup)
        delete map._markerClusterGroup
      }
    }
  }, [map, reportes])

  return null
}

const IrAlMarcador = ({ reporte }) => {
  const map = useMap()
  useEffect(() => {
    if (!reporte || !map) return
    if (!Number.isFinite(reporte.lat) || !Number.isFinite(reporte.lng)) return

    map.flyTo([reporte.lat, reporte.lng], 15, { animate: true })

    setTimeout(() => {
      const marker = map._markerClusterGroup?.getLayers()?.find(
        (m) => m.getLatLng().lat === reporte.lat && m.getLatLng().lng === reporte.lng
      )
      if (marker) {
        map._markerClusterGroup.zoomToShowLayer(marker, () => {
          marker.openPopup()
        })
      }
    }, 400)
  }, [reporte, map])
  return null
}

const MapaReportes = ({ filtrosActivos = [], marcadorSeleccionado }) => {
  const [reportes, setReportes] = useState([])
  const [mapCenter, setMapCenter] = useState([19.26, -99.16])

  useEffect(() => {
    const API_URL = (process.env.REACT_APP_API_URL || "http://localhost/api") + "/obtener_reportes.php"
    axios
      .get(API_URL, { headers: { Accept: "application/json" } })
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : res.data?.data || []
        const datos = payload
          .map((r) => {
            let lat = Number(r.lat)
            let lng = Number(r.lng)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              // fallback parse ubicación
              if (r.ubicacion && String(r.ubicacion).includes(",")) {
                const [a, b] = String(r.ubicacion).split(",").map((x) => Number(x))
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
        if (datos.length) {
          setMapCenter([datos[0].lat, datos[0].lng])
        }
      })
      .catch((err) => console.error("Error cargar reportes:", err))
  }, [])

  // aplica filtros locales si los usas (sin afectar mapa)
  const visibles = useMemo(() => {
    if (!filtrosActivos?.length) return reportes
    const setFilt = new Set(filtrosActivos.map((f) => estadoVisual(f)))
    return reportes.filter((r) => setFilt.has(r.estadoUI))
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
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CustomClusterLayer reportes={visibles} />
        {marcadorSeleccionado && <IrAlMarcador reporte={marcadorSeleccionado} />}
      </MapContainer>
    </div>
  )
}

export default MapaReportes
