import React, { useMemo, useState, useEffect, useRef } from "react";
import { Pie, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./Dashboard.css";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    Title,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ChartDataLabels
);

const normalizar = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();

const parseLocalISO = (iso) => {
    if (!iso) return null;
    // iso esperado "YYYY-MM-DD"
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const formatDateLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
};

const dateOnlyFromTs = (ts) => {
    const d = new Date(ts);
    if (isNaN(d)) return null;
    return formatDateLocal(d);
};

const buildDateRange = (start, end) => {
    const arr = [];
    if (!start || !end) return arr;
    const cur = new Date(start.getTime());
    const last = new Date(end.getTime());
    while (cur <= last) {
        arr.push(formatDateLocal(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return arr;
};

const HeatmapLayer = ({ reportes }) => {
    const map = useMap();
    const heatRef = useRef(null);

    useEffect(() => {
        // limpia cualquier capa anterior
        if (heatRef.current) {
            map.removeLayer(heatRef.current);
            heatRef.current = null;
        }

        const puntos = (reportes || [])
            .map((r) => {
                if (!r.ubicacion) return null;
                const match = String(r.ubicacion).match(/([-]?\d+\.\d+),\s*([-]?\d+\.\d+)/);
                if (!match) return null;
                return [parseFloat(match[1]), parseFloat(match[2]), 1];
            })
            .filter(Boolean);

        if (puntos.length > 0) {
            const heat = window.L.heatLayer(puntos, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
            });
            heat.addTo(map);
            heatRef.current = heat;
        }

        return () => {
            if (heatRef.current) {
                map.removeLayer(heatRef.current);
                heatRef.current = null;
            }
        };
    }, [reportes, map]);

    return null;
};

const Dashboard = ({ reportes = [] }) => {
    // Filtros
    const [filtroFecha, setFiltroFecha] = useState({ desde: "", hasta: "" });
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");

    // Para selects
    const estados = useMemo(
        () => ["Sin revisar", "Esperando recepción", "Completado", "Rechazado"],
        []
    );
    const tipos = useMemo(
        () => [...new Set(reportes.map((r) => r.tipo_reporte).filter(Boolean))],
        [reportes]
    );

    const reportesFiltrados = useMemo(() => {
        // parse fechas de filtros
        const dDesde = filtroFecha.desde ? parseLocalISO(filtroFecha.desde) : null;
        const dHasta = filtroFecha.hasta ? parseLocalISO(filtroFecha.hasta) : null;
        if (dHasta) dHasta.setHours(23, 59, 59, 999); // inclusivo

        return reportes.filter((r) => {
            const fecha = r.fecha_hora ? new Date(r.fecha_hora) : null;

            if (dDesde && (!fecha || fecha < dDesde)) return false;
            if (dHasta && (!fecha || fecha > dHasta)) return false;

            if (filtroEstado && normalizar(r.estado) !== normalizar(filtroEstado)) return false;
            if (filtroTipo && normalizar(r.tipo_reporte) !== normalizar(filtroTipo)) return false;

            return true;
        });
    }, [reportes, filtroFecha, filtroEstado, filtroTipo]);

    // fechas para la serie 
    const { rangoFechas, conteoPorDia } = useMemo(() => {
        let start = filtroFecha.desde ? parseLocalISO(filtroFecha.desde) : null;
        let end = filtroFecha.hasta ? parseLocalISO(filtroFecha.hasta) : null;
        if (end) end.setHours(23, 59, 59, 999);

        // si no hay filtros de fecha, usar min/max de los datos filtrados
        if (!start || !end) {
            const fechasValidas = reportesFiltrados
                .map((r) => (r.fecha_hora ? new Date(r.fecha_hora) : null))
                .filter((d) => d && !isNaN(d));

            if (fechasValidas.length) {
                const min = new Date(Math.min(...fechasValidas));
                const max = new Date(Math.max(...fechasValidas));
                if (!start) start = new Date(min.getFullYear(), min.getMonth(), min.getDate());
                if (!end)
                    end = new Date(max.getFullYear(), max.getMonth(), max.getDate(), 23, 59, 59, 999);
            }
        }

        const fechasArr = start && end ? buildDateRange(start, end) : [];
        const conteo = fechasArr.map((dia) =>
            reportesFiltrados.filter((r) => dateOnlyFromTs(r.fecha_hora) === dia).length
        );
        return { rangoFechas: fechasArr, conteoPorDia: conteo };
    }, [reportesFiltrados, filtroFecha]);

    const conteoEstados = useMemo(
        () =>
            estados.map(
                (estado) =>
                    reportesFiltrados.filter(
                        (r) => normalizar(r.estado) === normalizar(estado)
                    ).length
            ),
        [estados, reportesFiltrados]
    );

    const conteoTipos = useMemo(
        () =>
            tipos.map(
                (tipo) =>
                    reportesFiltrados.filter(
                        (r) => normalizar(r.tipo_reporte) === normalizar(tipo)
                    ).length
            ),
        [reportesFiltrados, tipos]
    );

    const pieOptions = {
        plugins: {
            legend: {
                position: "bottom",
                labels: { font: { size: 13 }, color: "#34495e", usePointStyle: true },
            },
            datalabels: {
                color: "#fff",
                font: { weight: "bold", size: 14 },
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const p = total > 0 ? (value / total) * 100 : 0;
                    return p < 5 ? "" : `${p.toFixed(1)}%`;
                },
            },
            tooltip: {
                backgroundColor: "#2c3e50",
                titleColor: "#ecf0f1",
                bodyColor: "#ecf0f1",
                padding: 10,
                cornerRadius: 6,
            },
        },
        maintainAspectRatio: false,
    };

    const lineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            datalabels: {
                align: "top",
                anchor: "end",
                font: { size: 12, weight: "bold" },
                color: "#2c3e50",
                formatter: (value) => value,
            },
            tooltip: {
                backgroundColor: "#2c3e50",
                titleColor: "#ecf0f1",
                bodyColor: "#ecf0f1",
            },
        },
        elements: {
            line: { tension: 0, borderWidth: 2 },
            point: {
                radius: 2,
                backgroundColor: "#2980b9",
                borderColor: "#fff",
                borderWidth: 2,
                hoverRadius: 5,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: "#7f8c8d" } },
            y: { grid: { color: "#ecf0f1" }, ticks: { color: "#7f8c8d" } },
        },
    };

    const dataEstados = {
        labels: estados,
        datasets: [
            { data: conteoEstados, backgroundColor: ["#9b59b6", "#f1c40f", "#2ecc71", "#e74c3c"] },
        ],
    };

    const dataTipos = {
        labels: tipos,
        datasets: [
            { data: conteoTipos, backgroundColor: ["#3498db", "#1abc9c", "#e67e22", "#9b59b6", "#e74c3c"] },
        ],
    };

    const dataLine = {
        labels: rangoFechas,
        datasets: [
            { label: "Reportes", data: conteoPorDia, borderColor: "#2980b9", backgroundColor: "rgba(52, 152, 219, 0.2)", fill: true },
        ],
    };

    // Reset
    const resetFiltros = () => {
        setFiltroFecha({ desde: "", hasta: "" });
        setFiltroEstado("");
        setFiltroTipo("");
    };

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard</h1>

            {/* Filtros */}
            <div className="dashboard-filtros">
                <div className="form-field">
                    <label>Desde</label>
                    <input
                        type="date"
                        value={filtroFecha.desde}
                        onChange={(e) => setFiltroFecha({ ...filtroFecha, desde: e.target.value })}
                    />
                </div>
                <div className="form-field">
                    <label>Hasta</label>
                    <input
                        type="date"
                        value={filtroFecha.hasta}
                        onChange={(e) => setFiltroFecha({ ...filtroFecha, hasta: e.target.value })}
                    />
                </div>
                <div className="form-field">
                    <label>Estado</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos</option>
                        {estados.map((e) => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label>Tipo</label>
                    <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                        <option value="">Todos</option>
                        {tipos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div className="reset-col">
                    <button className="reset-btn" onClick={resetFiltros}>Limpiar</button>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <h5 className="dashboard-card-title">Reportes por Estado</h5>
                    <div className="chart-container">
                        <Pie data={dataEstados} options={pieOptions} />
                    </div>
                </div>
                <div className="dashboard-card">
                    <h5 className="dashboard-card-title">Reportes por Tipo</h5>
                    <div className="chart-container">
                        <Pie data={dataTipos} options={pieOptions} />
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card full-width">
                    <h5 className="dashboard-card-title">Evolución Temporal</h5>
                    <div className="chart-container">
                        <Line data={dataLine} options={lineOptions} plugins={[ChartDataLabels]} />
                    </div>
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card full-width">
                    <h5 className="dashboard-card-title">Mapa de Calor</h5>
                    <div className="map-container">
                        <MapContainer center={[19.23, -99.20]} zoom={12} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <HeatmapLayer reportes={reportesFiltrados} />
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
