"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import L from "leaflet"
import "leaflet.markercluster"
import axios from "axios"
import "./MapaReportes.css"

// ================= ICONOS =================
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

// ================= FUNCIONES AUXILIARES =================
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
  if (e.includes("esperando")) return "Esperando recepción"
  if (e === "sin revisar" || e === "no revisado") return "Sin revisar"
  return "Sin revisar"
}

// ================= CLUSTER CUSTOM OPTIMIZADO =================
const CustomClusterLayer = ({ reportes }) => {
  const map = useMap()
  const clusterRef = useRef(null)

  useEffect(() => {
    if (!map) return

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    }

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: false,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let size = "small"
        if (count > 100) size = "large"
        else if (count > 10) size = "medium"
        return new L.DivIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: new L.Point(40, 40),
        })
      },
    })

    const markers = reportes.map((r) => {
      const icon = ICONS[r.estadoUI] || ICONS.default
      const marker = L.marker([r.lat, r.lng], { icon })
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

    clusterGroup.addLayers(markers)
    map.addLayer(clusterGroup)
    clusterRef.current = clusterGroup
    map._clusterGroupRef = clusterRef

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current)
        clusterRef.current = null
      }
    }
  }, [map, reportes])

  return null
}

// ================= IR AL MARCADOR =================
const IrAlMarcador = ({ reporte }) => {
  const map = useMap()

  useEffect(() => {
    if (!reporte || !map) return
    if (!Number.isFinite(reporte.lat) || !Number.isFinite(reporte.lng)) return

    map.flyTo([reporte.lat, reporte.lng], 15, { animate: true })

    const buscarYAbrirMarcador = () => {
      const clusterGroup = map._clusterGroupRef?.current
      if (!clusterGroup) return

      let marcadorEncontrado = null

      clusterGroup.eachLayer((marker) => {
        const mLat = marker.getLatLng().lat
        const mLng = marker.getLatLng().lng
        if (
          Math.abs(mLat - reporte.lat) < 0.0001 &&
          Math.abs(mLng - reporte.lng) < 0.0001
        ) {
          marcadorEncontrado = marker
        }
      })

      if (marcadorEncontrado) {
        const parent = clusterGroup.getVisibleParent(marcadorEncontrado)
        if (parent && parent !== marcadorEncontrado) {
          clusterGroup.zoomToShowLayer(marcadorEncontrado, () => {
            setTimeout(() => marcadorEncontrado.openPopup(), 300)
          })
        } else {
          marcadorEncontrado.openPopup()
        }

        // Scroll suave al popup
        setTimeout(() => {
          const popupEl = document.querySelector(`[data-id="popup-${reporte.id}"]`)
          if (popupEl) popupEl.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 600)
      }
    }

    setTimeout(buscarYAbrirMarcador, 400)
  }, [reporte, map])

  return null
}

// ================= COMPONENTE PRINCIPAL =================
const MapaReportes = ({ filtrosActivos = [], marcadorSeleccionado }) => {
  const [reportes, setReportes] = useState([])
  const [mapCenter, setMapCenter] = useState([19.23, -99.20])

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
        if (datos.length > 0) setMapCenter([datos[0].lat, datos[0].lng])
      })
      .catch((err) => console.error("❌ Error al cargar reportes:", err))
  }, [])

  const visibles = useMemo(() => {
    if (!filtrosActivos?.length) return reportes
    const setFilt = new Set(filtrosActivos.map((f) => estadoVisual(f)))
    return reportes.filter((r) => setFilt.has(r.estadoUI))
  }, [reportes, filtrosActivos])

  const reporteSeleccionado = useMemo(
    () => reportes.find((r) => r.id === marcadorSeleccionado),
    [reportes, marcadorSeleccionado]
  )

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
        {reporteSeleccionado && <IrAlMarcador reporte={reporteSeleccionado} />}
      </MapContainer>
    </div>
  )
}

export default MapaReportes
