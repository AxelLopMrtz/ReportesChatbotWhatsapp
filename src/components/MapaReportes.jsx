import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import "./MapaReportes.css";

// 🎨 Iconos por estado
const iconColors = {
  Completado: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "leaflet/dist/images/marker-shadow.png",
  }),
  Rechazado: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "leaflet/dist/images/marker-shadow.png",
  }),
  "Esperando recepción": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-orange.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "leaflet/dist/images/marker-shadow.png",
  }),
  "Sin revisar": new L.Icon({
    iconUrl: "/pins/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "leaflet/dist/images/marker-shadow.png",
  }),
  default: new L.Icon({
    iconUrl: "/pins/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "leaflet/dist/images/marker-shadow.png",
  }),
};

// ✅ Hook para centrar y abrir popup del marcador seleccionado con scroll
const IrAlMarcador = ({ reporte }) => {
  const map = useMap();

  useEffect(() => {
    if (reporte && map) {
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
        }, 300); // ⏱️ Espera a que se abra el popup
      }
    }
  }, [reporte, map]);

  return null;
};

const MapaReportes = ({ filtrosActivos, marcadorSeleccionado }) => {
  const [reportes, setReportes] = useState([]);
  const [mapCenter, setMapCenter] = useState([19.3, -99.15]);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL + "/obtener_reportes.php"
      : "http://localhost/api/obtener_reportes.php";

    axios
      .get(API_URL)
      .then((response) => {
        if (Array.isArray(response.data)) {
          const datos = response.data
            .map((r) => {
              if (!r.ubicacion) return null;
              const [lat, lng] = r.ubicacion.split(",").map(Number);
              if (isNaN(lat) || isNaN(lng)) return null;
              return { ...r, lat, lng };
            })
            .filter(Boolean);

          setReportes(datos);

          const primerValido = datos[0];
          if (primerValido) {
            setMapCenter([primerValido.lat, primerValido.lng]);
          }
        } else {
          console.error("La respuesta de la API no es un array:", response.data);
        }
      })
      .catch((err) => console.error("❌ Error al cargar reportes:", err));
  }, []);

  const reporteSeleccionado = reportes.find((r) => r.id === marcadorSeleccionado);

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

        {reportes
          .filter((reporte) => filtrosActivos.includes(reporte.estado))
          .map((reporte) => {
            const icon = iconColors[reporte.estado] || iconColors.default;
            return (
              <Marker
                key={reporte.id}
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
                    <strong>Estado:</strong> {reporte.estado || "Sin estado"}
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
