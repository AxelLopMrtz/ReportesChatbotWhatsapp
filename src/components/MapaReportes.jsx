import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import "./MapaReportes.css";

// 🎨 Iconos por estado (claves en "forma visual")
const iconColors = {
  "Completado": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png",
  }),
  "Rechazado": new L.Icon({
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
  "default": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "/pins/marker-shadow.png"
  }),
};

// 🔤 Normaliza texto (quita acentos y usa minúsculas)
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

// 🔁 Mapea estados a etiquetas visuales estandarizadas (para icono y filtro)
const estadoVisual = (estadoCrudo) => {
  const e = norm(estadoCrudo);
  if (e === "completado") return "Completado";
  if (e === "rechazado") return "Rechazado";
  if (e === "esperando" || e === "esperando recepcion") return "Esperando recepción";
  if (e === "sin revisar" || e === "no revisado") return "Sin revisar";
  return "Sin revisar"; // por defecto
};

// ✅ Hook para centrar y abrir popup del marcador seleccionado con scroll
const IrAlMarcador = ({ reporte }) => {
  const map = useMap();

  useEffect(() => {
    if (reporte && map && Number.isFinite(reporte.lat) && Number.isFinite(reporte.lng)) {
      map.flyTo([reporte.lat, reporte.lng], 15, { animate: true });

      const marker = Object.values(map._layers).find(
        (layer) =>
          layer._latlng?.lat === reporte.lat &&
          layer._latlng?.lng === reporte.lng
      );

      if (marker && marker.openPopup) {
        marker.openPopup();

        setTimeout(() => {
          const popupElement = document.querySelector(`[data-id="popup-${reporte.id}"]`);
          if (popupElement) {
            popupElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [reporte, map]);

  return null;
};

const MapaReportes = ({ filtrosActivos = [], marcadorSeleccionado }) => {
  const [reportes, setReportes] = useState([]);
  const [mapCenter, setMapCenter] = useState([19.3, -99.15]);

  useEffect(() => {
    const API_URL = (process.env.REACT_APP_API_URL || "http://localhost/api") + "/obtener_reportes.php";

    axios
      .get(API_URL, { headers: { Accept: "application/json" } })
      .then((response) => {
        const payload = Array.isArray(response.data)
          ? response.data
          : response.data?.data || response.data?.reportes || [];

        const datos = (payload || [])
          .map((r) => {
            // 1) Prioriza lat/lng del backend
            let lat = Number(r.lat);
            let lng = Number(r.lng);

            // 2) Fallback: intenta parsear "ubicacion" como "lat,lng"
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              if (r.ubicacion && String(r.ubicacion).includes(",")) {
                const [a, b] = String(r.ubicacion).split(",").map((x) => Number(x));
                if (Number.isFinite(a) && Number.isFinite(b)) {
                  lat = a;
                  lng = b;
                }
              }
            }

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            const estadoUI = estadoVisual(r.estado);
            return { ...r, lat, lng, estadoUI };
          })
          .filter(Boolean);

        setReportes(datos);

        if (datos.length > 0) {
          setMapCenter([datos[0].lat, datos[0].lng]);
        }
      })
      .catch((err) => console.error("❌ Error al cargar reportes:", err));
  }, []);

  const reporteSeleccionado = useMemo(
    () => reportes.find((r) => r.id === marcadorSeleccionado),
    [reportes, marcadorSeleccionado]
  );

  // 🧲 Aplica filtros: si no pasan filtros, muestra todos
  const reportesVisibles = useMemo(() => {
    if (!filtrosActivos || filtrosActivos.length === 0) return reportes;
    const setFiltros = new Set(
      filtrosActivos.map((f) => estadoVisual(f)) // normaliza filtros entrantes
    );
    return reportes.filter((r) => setFiltros.has(r.estadoUI));
  }, [reportes, filtrosActivos]);

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

        {reportesVisibles.map((reporte) => {
          const icon = iconColors[reporte.estadoUI] || iconColors.default;
          return (
            <Marker
              key={String(reporte.id)}
              position={[reporte.lat, reporte.lng]}
              icon={icon}
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
            </Marker>
          );
        })}

        {reporteSeleccionado && <IrAlMarcador reporte={reporteSeleccionado} />}
      </MapContainer>
    </div>
  );
};

export default MapaReportes;
