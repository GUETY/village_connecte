import React, { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse"; // Ajout pour export CSV
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import Navbar from "../components/navbar";
// Import de l'API statistiques
import { statistiquesAPI, setAuthToken } from "../services/api.js";

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

/**
 * Page : Statistiques
 * - Sélection de date
 * - Graphique des connexions journalières (Chart.js)
 * - Tableau récapitulatif (datetime, code, forfaitType, user)
 * - Design professionnel avec animations
 * 
 * Champs BD : datetime, code, forfait, forfaitType, user
 */

function DateSelector({ onDateChange, selectedDate, onExport, exportDisabled, onExportExcel }) {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 md:p-6 mb-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg border border-orange-200">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 2a1 1 0 000 2h8a1 1 0 100-2H6zM4 5a2 2 0 012-2 1 1 0 000 2H2a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V6a1 1 0 00-1-1h-4a1 1 0 000-2 2 2 0 00-2-2H6a2 2 0 00-2 2zM2 6h16v10H2V6z" />
            </svg>
          </div>
          <label htmlFor="date-selector" className="text-sm font-bold text-gray-900">Sélectionner une date</label>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
          <input
            id="date-selector"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-4 py-2.5 border-2 border-orange-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition-all hover:border-orange-400 w-full sm:w-56 cursor-pointer shadow-sm hover:shadow-md"
            aria-label="Sélectionnez une date pour afficher les statistiques"
          />
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9933] shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Exporter CSV
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={exportDisabled}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff7a00] to-[#ffb347] shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Exporter Excel
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionChart({ data, chartRef }) {  // + chartRef
  const internalRef = chartRef || useRef(null);

  const chartData = {
    labels: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
    datasets: [
      {
        label: "Utilisateurs connectés",
        data: data,
        borderColor: "#ff7a00",
        backgroundColor: "rgba(255, 122, 0, 0.08)",
        borderWidth: 3,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#ff7a00",
        pointBorderColor: "#fff",
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#ff9933",
        pointStyle: "circle",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          font: { size: 11, weight: "600" },
          color: "#374151",
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          boxPadding: 8,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        titleColor: "#fff",
        titleFont: { size: 12, weight: "bold" },
        bodyColor: "#fff",
        bodyFont: { size: 11 },
        borderColor: "#ff7a00",
        borderWidth: 2,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context) => `  ${context.raw} utilisateurs`,
          title: (context) => `Heure : ${context[0].label}`,
        },
        boxPadding: 6,
      },
      filler: {
        propagate: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 150,
        ticks: {
          stepSize: 25,
          font: { size: 10, weight: "600" },
          color: "#6b7280",
          padding: 8,
          callback: (value) => value,
        },
        grid: {
          color: "rgba(209, 213, 219, 0.3)",
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          font: { size: 10, weight: "600" },
          color: "#6b7280",
          padding: 6,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300" style={{ transform: "none", perspective: "none" }}>
      <h3 className="text-sm md:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        Historique journalier des connexions
      </h3>
      <div style={{ height: "280px", minHeight: "280px" }} className="animate-fadeIn">
        <Line ref={internalRef} data={chartData} options={options} />
      </div>
    </div>
  );
}

function ForfaitDistributionChart({ forfaitData, chartRef }) { // + chartRef
  const internalRef = chartRef || useRef(null);

  const chartData = {
    labels: ["Premium", "Standard", "Basic"],
    datasets: [
      {
        data: [forfaitData.Premium, forfaitData.Standard, forfaitData.Basic],
        backgroundColor: [
          "rgba(251, 191, 36, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(16, 185, 129, 0.9)",
        ],
        borderColor: [
          "#fbbf24",
          "#3b82f6",
          "#10b981",
        ],
        borderWidth: 2,
        hoverBorderColor: "#fff",
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, weight: "600" },
          color: "#374151",
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        titleColor: "#fff",
        titleFont: { size: 12, weight: "bold" },
        bodyColor: "#fff",
        bodyFont: { size: 11 },
        borderColor: "#ff7a00",
        borderWidth: 2,
        padding: 10,
        callbacks: {
          label: (context) => `  ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300" style={{ transform: "none", perspective: "none" }}>
      <h3 className="text-sm md:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM16 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Distribution des forfaits
      </h3>
      <div style={{ height: "280px", minHeight: "280px" }} className="animate-fadeIn flex items-center justify-center">
        <Doughnut ref={internalRef} data={chartData} options={options} />
      </div>
    </div>
  );
}

function StatisticsTable({ data }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => {
      return (
        (item.code || "").toLowerCase().includes(q) ||
        (item.heure || "").toLowerCase().includes(q) ||
        new Date(item.datetime).toLocaleDateString("fr-FR").toLowerCase().includes(q) ||
        (item.forfaitType || "").toLowerCase().includes(q) ||
        (item.user || "").toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm"
      style={{ transform: "none", perspective: "none" }}
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="pageSize-select" className="text-xs md:text-sm text-gray-700 whitespace-nowrap">Afficher</label>
          <select
            id="pageSize-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
            aria-label="Nombre d'entrées à afficher par page"
          >
            {[5, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">entrées</span>
          <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">({total})</span>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="search-stats" className="sr-only">Rechercher</label>
          <input
            id="search-stats"
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border-2 border-green-300 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full sm:w-48"
            aria-label="Rechercher dans les statistiques"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-max divide-y divide-gray-200"
          role="table"
          aria-label="Tableau des statistiques"
          style={{ transform: "none" }}
        >
          <caption className="sr-only">Récapitulatif des connexions avec détails (date, heure, code, forfait, utilisateur)</caption>
          <thead className="bg-[#ff7a00] text-white sticky top-0 z-10">
            <tr style={{ transform: "none" }}>
              <th className="px-2 md:px-4 py-2.5 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Date</th>
              <th className="px-2 md:px-4 py-2.5 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Heure</th>
              <th className="px-2 md:px-4 py-2.5 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Code</th>
              <th className="px-2 md:px-4 py-2.5 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Forfait</th>
              <th className="px-2 md:px-4 py-2.5 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Utilisateur</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.length > 0 ? (
              paginated.map((item, idx) => (
                <tr
                  key={start + idx}
                  className="hover:bg-orange-50/50 transition-colors duration-200 text-xs md:text-sm animate-fadeIn"
                  style={{ transform: "none", animationDelay: `${idx * 50}ms` }}
                >
                  <td className="px-2 md:px-4 py-2.5 align-middle text-gray-700 font-medium whitespace-nowrap">
                    {new Date(item.datetime).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-2 md:px-4 py-2.5 align-middle text-gray-700 font-medium whitespace-nowrap">
                    {new Date(item.datetime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-2 md:px-4 py-2.5 align-middle">
                    <code className="text-xs font-bold text-[var(--vc-purple)] bg-purple-50 px-1.5 py-0.5 rounded inline-block whitespace-nowrap">
                      {item.code || "-"}
                    </code>
                  </td>
                  <td className="px-2 md:px-4 py-2.5 align-middle whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                        item.forfaitType === "Premium"
                          ? "bg-amber-50 text-amber-700"
                          : item.forfaitType === "Standard"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {item.forfaitType || "-"}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-2.5 align-middle text-gray-700 whitespace-nowrap truncate">
                    {item.user || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-xs text-gray-500 font-medium">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 md:p-4 border-t border-gray-100">
        <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
          Affichage {total === 0 ? 0 : start + 1}–{Math.min(start + paginated.length, total)} sur {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white shadow-md hover:shadow-lg hover:scale-105"
            }`}
            aria-label="Page précédente"
          >
            ← Préc
          </button>

          <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
              page === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white shadow-md hover:shadow-lg hover:scale-105"
            }`}
            aria-label="Page suivante"
          >
            Suiv →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsCards({ totalConnections, peakHour, averageUsers }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6" style={{ transform: "none" }}>
      {/* Total connexions */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 md:p-5 border-2 border-indigo-300 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn overflow-hidden" style={{ transform: "none" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1.5 truncate">Total connexions</h3>
            <p className="text-lg md:text-2xl font-bold text-indigo-600">{totalConnections}</p>
          </div>
          <div className="text-indigo-200 opacity-40 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S8.33 8 7.5 8 6 8.67 6 9.5 6.67 11 7.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Heure de pic */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 md:p-5 border-2 border-orange-300 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn overflow-hidden" style={{ transform: "none", animationDelay: "100ms" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-1.5 truncate">Heure de pic</h3>
            <p className="text-lg md:text-2xl font-bold text-orange-600">{peakHour}</p>
          </div>
          <div className="text-orange-200 opacity-40 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S8.33 8 7.5 8 6 8.67 6 9.5 6.67 11 7.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Moyenne utilisateurs */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 md:p-5 border-2 border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn overflow-hidden sm:col-span-2 lg:col-span-1" style={{ transform: "none", animationDelay: "200ms" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1.5 truncate">Moyenne utilisateurs</h3>
            <p className="text-lg md:text-2xl font-bold text-emerald-600">{averageUsers}</p>
          </div>
          <div className="text-emerald-200 opacity-40 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Statistiques() {
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [allStatistiques, setAllStatistiques] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Données d'exemple
  const sampleStatistiques = [
    { datetime: new Date(selectedDate + "T06:15:00"), code: "F001", forfaitType: "Basic", user: "user_001" },
    { datetime: new Date(selectedDate + "T08:30:00"), code: "F002", forfaitType: "Standard", user: "user_002" },
    { datetime: new Date(selectedDate + "T10:45:00"), code: "F001", forfaitType: "Basic", user: "user_003" },
    { datetime: new Date(selectedDate + "T12:00:00"), code: "F003", forfaitType: "Premium", user: "user_004" },
    { datetime: new Date(selectedDate + "T14:20:00"), code: "F002", forfaitType: "Standard", user: "user_005" },
    { datetime: new Date(selectedDate + "T16:50:00"), code: "F001", forfaitType: "Basic", user: "user_001" },
    { datetime: new Date(selectedDate + "T18:30:00"), code: "F003", forfaitType: "Premium", user: "user_006" },
    { datetime: new Date(selectedDate + "T20:15:00"), code: "F002", forfaitType: "Standard", user: "user_002" },
  ];

  // Charger et définir le token, puis charger les statistiques depuis l'API
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // Récupérer le token depuis localStorage
        const token = localStorage.getItem("village_token");
        
        if (!token) {
          console.warn("⚠️ Token non trouvé dans localStorage");
          setAllStatistiques(sampleStatistiques);
          setIsLoading(false);
          return;
        }

        // Définir le token dans l'en-tête Authorization
        setAuthToken(token);
        console.log("✓ Token défini avec succès");

        // Charger les statistiques depuis l'API
        if (statistiquesAPI?.list) {
          try {
            const stats = await statistiquesAPI.list();
            if (mounted) {
              const statsData = Array.isArray(stats) ? stats : stats?.data || sampleStatistiques;
              setAllStatistiques(statsData);
              console.log("✓ Statistiques chargées depuis l'API :", statsData);
            }
          } catch (err) {
            console.error("Erreur chargement statistiques API :", err);
            if (mounted) {
              setAllStatistiques(sampleStatistiques);
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        if (mounted) {
          setAllStatistiques(sampleStatistiques);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => (mounted = false);
  }, []);

  // Filtrer les statistiques par date sélectionnée
  const filteredStatistiques = useMemo(() => {
    return allStatistiques.filter((stat) => {
      const statDate = new Date(stat.datetime).toISOString().split("T")[0];
      return statDate === selectedDate;
    });
  }, [allStatistiques, selectedDate]);

  // Données pour les graphiques (groupées par heure)
  const connectionData = useMemo(() => {
    const hours = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    return hours.map((hourLabel) => {
      const hourNum = Number(hourLabel.split(":")[0]);
      return filteredStatistiques.filter((stat) => {
        const d = new Date(stat.datetime);
        // comparer seulement l'heure (0-23) pour éviter les erreurs de formatage
        return d.getHours() === hourNum;
      }).length;
    });
  }, [filteredStatistiques]);

  // Données pour la distribution des forfaits
  const forfaitDistribution = useMemo(() => {
    const types = { Premium: 0, Standard: 0, Basic: 0 };
    filteredStatistiques.forEach((stat) => {
      if (types.hasOwnProperty(stat.forfaitType)) {
        types[stat.forfaitType]++;
      }
    });
    return types;
  }, [filteredStatistiques]);

  // Calculer les statistiques globales
  const totalConnections = filteredStatistiques.length;
  const peakHour = connectionData.length > 0 
    ? ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"][connectionData.indexOf(Math.max(...connectionData))]
    : "—";
  const averageUsers = connectionData.length > 0 ? Math.round(connectionData.reduce((a, b) => a + b, 0) / connectionData.length) : 0;

  // Export CSV mieux formaté (tri, BOM, séparateur ;)
  const handleExportCSV = () => {
    if (!filteredStatistiques || filteredStatistiques.length === 0) return;

    const sorted = [...filteredStatistiques].sort(
      (a, b) => new Date(a.datetime) - new Date(b.datetime)
    );

    const rows = sorted.map((item) => ({
      Date: new Date(item.datetime).toLocaleDateString("fr-FR"),
      Heure: new Date(item.datetime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      Code: item.code || "",
      Forfait: item.forfaitType || "",
      Utilisateur: item.user || "",
    }));

    const csv = Papa.unparse(rows, {
      header: true,
      delimiter: ";",
      quotes: true,
    });
    const csvWithBOM = "\uFEFF" + csv;

    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `statistiques_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildCrosstab = (rows) => {
    // Croisé ForfaitType x Utilisateur
    const users = Array.from(new Set(rows.map(r => r.user || "-"))).sort();
    const types = Array.from(new Set(rows.map(r => r.forfaitType || "-"))).sort();
    const matrix = types.map(t => {
      const row = { forfaitType: t };
      users.forEach(u => {
        row[u] = rows.filter(r => (r.forfaitType || "-") === t && (r.user || "-") === u).length;
      });
      row.Total = rows.filter(r => (r.forfaitType || "-") === t).length;
      return row;
    });
    const totals = { forfaitType: "Total" };
    users.forEach(u => {
      totals[u] = rows.filter(r => (r.user || "-") === u).length;
    });
    totals.Total = rows.length;
    return { users, types, matrix: [...matrix, totals] };
  };

  const handleExportExcel = async () => {
    if (!filteredStatistiques.length) return;

    const wb = new ExcelJS.Workbook();
    const orange = "FF7A00";

    // ===== Feuille Données =====
    const ws = wb.addWorksheet("Données");
    const headers = ["Date", "Heure", "Code", "Forfait", "Utilisateur"];
    ws.addRow(headers);
    filteredStatistiques.forEach(item => {
      ws.addRow([
        new Date(item.datetime).toLocaleDateString("fr-FR"),
        new Date(item.datetime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        item.code || "",
        item.forfaitType || "",
        item.user || "",
      ]);
    });
    ws.columns.forEach(col => { col.width = 18; });
    ws.getRow(1).eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: orange } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });
    ws.eachRow((row, idx) => {
      if (idx > 1) row.eachCell(c => c.border = { bottom: { style: "thin", color: { argb: "FFE5E5E5" } } });
    });

    // ===== Feuille Croisé existante =====
    const { users, matrix } = buildCrosstab(filteredStatistiques);
    const wsc = wb.addWorksheet("Croisé");
    wsc.addRow(["Forfait", ...users, "Total"]);
    matrix.forEach(r => {
      wsc.addRow([r.forfaitType, ...users.map(u => r[u] || 0), r.Total || 0]);
    });
    wsc.columns.forEach(col => { col.width = 16; });
    wsc.getRow(1).eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: orange } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    // ===== Nouvelle feuille Pivot dynamique =====
    const wsp = wb.addWorksheet("Pivot dynamique");
    // 1) Pivot Forfait x Utilisateur (déjà calculé)
    wsp.addRow(["PIVOT Forfait x Utilisateur"]);
    wsp.getRow(1).getCell(1).font = { bold: true, color: { argb: orange }, size: 12 };
    wsp.addRow(["Forfait", ...users, "Total"]);
    matrix.forEach(r => {
      const row = wsp.addRow([r.forfaitType, ...users.map(u => r[u] || 0), r.Total || 0]);
      row.eachCell((cell) => {
        if (cell.value === "Total" || typeof cell.value === "number") {
          cell.font = { bold: true };
        }
      });
    });

    // 2) Pivot Forfait x Date (agrégé par jour)
    const dates = Array.from(
      new Set(filteredStatistiques.map(s => new Date(s.datetime).toLocaleDateString("fr-FR")))
    ).sort((a, b) => {
      const da = a.split("/").reverse().join("-");
      const db = b.split("/").reverse().join("-");
      return da.localeCompare(db);
    });
    const forfaits = Array.from(new Set(filteredStatistiques.map(s => s.forfaitType || "-"))).sort();

    const pivotStartRow = matrix.length + 4;
    wsp.getRow(pivotStartRow - 1).getCell(1).value = "PIVOT Forfait x Date";
    wsp.getRow(pivotStartRow - 1).getCell(1).font = { bold: true, color: { argb: orange }, size: 12 };
    // En-têtes
    const headerRow = wsp.getRow(pivotStartRow);
    headerRow.values = ["Forfait", ...dates, "Total"];
    headerRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: orange } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    // Corps
    forfaits.forEach(f => {
      const countsByDate = dates.map(d =>
        filteredStatistiques.filter(s =>
          (s.forfaitType || "-") === f &&
          new Date(s.datetime).toLocaleDateString("fr-FR") === d
        ).length
      );
      const total = countsByDate.reduce((a, b) => a + b, 0);
      const row = wsp.addRow([f, ...countsByDate, total]);
      row.eachCell((cell, colNumber) => {
        if (colNumber === dates.length + 2) {
          cell.font = { bold: true };
        }
      });
    });

    // Largeurs auto
    wsp.columns.forEach(col => { col.width = 16; });

    // ===== Feuille Graphiques (images des charts React) =====
    const wsg = wb.addWorksheet("Graphiques");
    const charts = [
      { ref: lineChartRef, title: "Connexions", top: 1 },
      { ref: doughnutChartRef, title: "Distribution forfaits", top: 20 },
    ];

    for (const { ref, title, top } of charts) {
      const chart = ref.current;
      if (!chart?.toBase64Image) continue;
      const base64 = chart.toBase64Image("image/png", 1).replace(/^data:image\/png;base64,/, "");
      const imgId = wb.addImage({ base64, extension: "png" });
      wsg.addRow([title]);
      wsg.getRow(top).getCell(1).font = { bold: true, color: { argb: orange } };
      wsg.addImage(imgId, {
        tl: { col: 0, row: top },
        ext: { width: 720, height: 360 },
        editAs: "oneCell",
      });
    }

    // Export fichier
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `statistiques_${selectedDate}.xlsx`
    );
  };

  const handleExportCharts = () => {
    const charts = [
      { ref: lineChartRef, name: `connexions_${selectedDate}.png` },
      { ref: doughnutChartRef, name: `forfaits_${selectedDate}.png` },
    ];
    charts.forEach(({ ref, name }) => {
      const chart = ref.current;
      if (chart?.toBase64Image) {
        const url = chart.toBase64Image("image/png", 1);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
      }
    });
  };

  if (isLoading) {
    return (
      <Navbar>
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 font-sans antialiased text-gray-800">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-[#ff7a00]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="ml-3 text-gray-600">Chargement des statistiques...</p>
          </div>
        </main>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 font-sans antialiased text-gray-800" style={{ transform: "none" }}>
        <section style={{ transform: "none" }}>
          {/* Sélecteur de date + export */}
          <DateSelector
            onDateChange={setSelectedDate}
            selectedDate={selectedDate}
            onExport={handleExportCSV}
            onExportExcel={handleExportExcel}
            exportDisabled={filteredStatistiques.length === 0}
          />

          {/* Cartes de statistiques */}
          <StatsCards totalConnections={totalConnections} peakHour={peakHour} averageUsers={averageUsers} />

          {/* Graphiques côte à côte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6" style={{ transform: "none" }}>
            <ConnectionChart data={connectionData} chartRef={lineChartRef} />
            <ForfaitDistributionChart forfaitData={forfaitDistribution} chartRef={doughnutChartRef} />
          </div>

          {/* Tableau récapitulatif */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1v-6a1 1 0 00-1-1h-1z" />
              </svg>
              Récapitulatif des connexions
            </h2>
            <StatisticsTable data={filteredStatistiques} />
          </div>
        </section>
      </main>

      {/* CSS pour animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        @media (max-width: 640px) {
          table {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </Navbar>
  );
}