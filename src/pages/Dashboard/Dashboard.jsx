// src/pages/Dashboard/Accueil.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Users, BarChart3, Wifi, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Navbar1 from "../../components/navbar1.jsx";
import { usersAPI, alertesAPI, bornesAPI, transactionsAPI } from "../../services/api";

function Card({ color = "purple", icon, children, onClick }) {
  const bgMap = {
    purple: "text-purple-700",
    blue: "text-blue-700",
    green: "text-green-700",
    orange: "text-orange-600",
  };

  const topBarMap = {
    purple: "bg-gradient-to-r from-[#8029dd] to-[#b458fa]",
    blue: "bg-gradient-to-r from-blue-600 to-blue-400",
    green: "bg-gradient-to-r from-green-600 to-green-400",
    orange: "bg-gradient-to-r from-orange-600 to-orange-400",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-0 border border-gray-200 overflow-hidden max-w-[300px] w-full mx-auto cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className={`h-4 ${topBarMap[color]} w-full rounded-t-lg shadow-sm`} />
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex flex-col">{children}</div>
        <div className={`rounded-full p-2 bg-white/80 ${bgMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function MiniLineChart({ data = [] }) {
  const [hover, setHover] = useState(null);
  const w = 620;
  const h = 240;
  const padding = 35;

  const values = data.map((d) => d.v);
  const max = Math.max(...values, 10);

  // Points de la courbe
  const points = data.map((d, i) => {
    const x = padding + (i * (w - padding * 2)) / (data.length - 1);
    const y = h - padding - (d.v / max) * (h - padding * 2);
    return { x, y, ...d };
  });

  // Graduation Y
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps }, (_, i) => {
    const value = Math.round((max / (ySteps - 1)) * i);
    const y = h - padding - (value / max) * (h - padding * 2);
    return { y, value };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {/* AXES */}
      <g stroke="#cccccc" strokeWidth="1">
        {/* Axe Y (vertical) */}
        <line x1={padding} y1={padding} x2={padding} y2={h - padding} />

        {/* Axe X (horizontal) */}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} />
      </g>

      {/* Graduation Y */}
      {yLabels.map((l, i) => (
        <g key={i}>
          <line
            x1={padding - 5}
            x2={w - padding}
            y1={l.y}
            y2={l.y}
            stroke="#e5e5e5"
            strokeWidth="1"
          />
          <text
            x={padding - 10}
            y={l.y + 4}
            fontSize="10"
            textAnchor="end"
            fill="#555"
          >
            {l.value}
          </text>
        </g>
      ))}

      {/* Graduation X */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={h - padding + 18}
          fontSize="10"
          textAnchor="middle"
          fill="#555"
        >
          {p.t}
        </text>
      ))}

      {/* Courbe */}
      <polyline
        fill="none"
        stroke="#9b4dff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      />

      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5}
          fill="#fff"
          stroke="#9b4dff"
          strokeWidth="3"
          onMouseEnter={() => setHover(p)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: "pointer" }}
        />
      ))}

      {/* Tooltip */}
      {hover && (
        <g>
          <rect
            x={hover.x - 32}
            y={hover.y - 45}
            width="64"
            height="34"
            rx="6"
            fill="white"
            stroke="#c6b4ff"
          />
          <text
            x={hover.x}
            y={hover.y - 28}
            fontSize="11"
            textAnchor="middle"
            fill="#000"
            fontWeight="bold"
          >
            {hover.t}
          </text>
          <text
            x={hover.x}
            y={hover.y - 14}
            fontSize="11"
            textAnchor="middle"
            fill="#7e22ce"
            fontWeight="bold"
          >
            users: {hover.v}
          </text>
        </g>
      )}
    </svg>
  );
}


export default function Accueil() {
  // debug: log mounting
  console.debug("Dashboard Accueil render");
  const navigate = useNavigate();
  // protection si le provider n'encapsule pas l'app (évite le crash)
  const auth = useAuth() || {};
  const { users, user } = auth;
  // support both keys: token may be stored as 'village_token' (api helper) or 'token'
  const token = auth?.token || localStorage.getItem("village_token") || localStorage.getItem("token") || null;

  // decode JWT payload safely (return object or null)
  const decodeJwtPayload = (t) => {
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1];
      // base64url -> base64
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      // pad
      while (payload.length % 4 !== 0) payload += '=';
      const decoded = atob(payload);
      try {
        return JSON.parse(decoded);
      } catch (e) {
        try {
          // try decode utf8
          return JSON.parse(decodeURIComponent(escape(decoded)));
        } catch (e2) {
          return null;
        }
      }
    } catch (err) {
      console.warn('decodeJwtPayload error', err);
      return null;
    }
  };

  const tokenPayload = decodeJwtPayload(token);

  // Extraire le nom à afficher depuis plusieurs emplacements possibles du token
  const extractedName = tokenPayload && (
    tokenPayload.login || tokenPayload.name || tokenPayload.sub || tokenPayload.email || (tokenPayload.user && (tokenPayload.user.login || tokenPayload.user.name))
  );

  const displayName = (user && (user.login || user.name)) || extractedName || localStorage.getItem('userLogin') || 'Utilisateur';

  // Si on a extrait un nom depuis le token, le sauvegarder en localStorage pour persistance
  useEffect(() => {
    if (extractedName) {
      try { localStorage.setItem('userLogin', String(extractedName)); } catch (e) { /* ignore */ }
    }
  }, [extractedName]);

  // si besoin d'accès direct au token: const token = auth?.token || localStorage.getItem('token');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // helper to convert possible object fields to readable text
  const toText = (v) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "string" || typeof v === "number") return v;
    if (typeof v === "object") return v.name || v.login || v._id || JSON.stringify(v);
    return String(v);
  };

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const series = useMemo(
    () => [],
    []
  );
  const [seriesData, setSeriesData] = React.useState(series);
  const [loadingSeries, setLoadingSeries] = React.useState(false);

  const sampleUsers = [
    { name: "Oulaï", ip: "192.168.1.45", traffic: "2.3 MB", group: "Utilisateur" },
    { name: "Ecole_Bat01", ip: "192.168.1.52", traffic: "15.7 MB", group: "Education" },
    { name: "Sante_PC", ip: "192.168.1.38", traffic: "8.7 MB", group: "Docteur" },
    { name: "Secretariat_5", ip: "192.168.1.68", traffic: "4.1 MB", group: "Secrétariat" },
  ];

  const [tableUsers, setTableUsers] = React.useState(sampleUsers);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [usersDeltaLabel, setUsersDeltaLabel] = React.useState("+0% vs hier");
  const [usersDeltaColor, setUsersDeltaColor] = React.useState("text-green-600");
  const [totalTrafficStr, setTotalTrafficStr] = React.useState("-");
  const [bornesTotal, setBornesTotal] = React.useState(0);
  const [bornesActive, setBornesActive] = React.useState(0);
  const [bornesOffline, setBornesOffline] = React.useState(0);
  const [bornesAlert, setBornesAlert] = React.useState("");
  const [activeAlertsCount, setActiveAlertsCount] = React.useState(0);
  const [toTreatCount, setToTreatCount] = React.useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUsers(true);
        const res = await usersAPI.list();
        const list = Array.isArray(res) ? res : res?.data || [];
        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((u, i) => ({
            id: u._id || u.id || `u-${i}`,
            name: toText(u.login || u.name || u._id),
            ip: toText(u.ip || u.lastIp || "-"),
            traffic: toText(u.traffic || "-"),
            group: toText(u.group || u.groupName || "-"),
          }));
          setTableUsers(mapped);
        }

        // load bornes to compute status counts
        try {
          const bRes = await bornesAPI.list();
          const bornes = Array.isArray(bRes) ? bRes : bRes?.data || [];
          if (Array.isArray(bornes)) {
            const total = bornes.length;
            const active = bornes.filter((b) => String(b.status) === "EN_SERVICE").length;
            const offline = bornes.filter((b) => String(b.status) === "HORS_LIGNE").length;
            if (mounted) {
              setBornesTotal(total);
              setBornesActive(active);
              setBornesOffline(offline);
              setBornesAlert(offline > 0 ? `${offline} borne${offline > 1 ? 's' : ''} hors ligne` : "Tous en service");
            }
          }
        } catch (err) {
          console.warn('Could not load bornes:', err);
        }

        // load alertes to compute counts
        try {
          const aRes = await alertesAPI.list();
          const alertes = Array.isArray(aRes) ? aRes : aRes?.data || [];
          if (Array.isArray(alertes)) {
            const active = alertes.filter((a) => String(a.status) !== "RESOLUE").length;
            const toTreat = alertes.filter((a) => String(a.status) === "NOUVELLE").length;
            if (mounted) {
              setActiveAlertsCount(active);
              setToTreatCount(toTreat);
            }
          }
        } catch (err) {
          console.warn('Could not load alertes:', err);
        }
      } catch (err) {
        console.warn("Could not load users for dashboard table:", err);
      } finally {
        setLoadingUsers(false);
      }
    })();

    // fetch transactions for today and build per-hour series
    (async () => {
      try {
        setLoadingSeries(true);
        const now = new Date();
        const from = new Date(now);
        from.setHours(0,0,0,0);
        const to = new Date(now);
        to.setHours(23,59,59,999);

        const res = await transactionsAPI.list({ from: from.toISOString(), to: to.toISOString() });
        const items = Array.isArray(res) ? res : res?.data || [];

        // aggregate distinct users per hour
        const hours = Array.from({ length: 24 }, (_, i) => ({ t: `${String(i).padStart(2,'0')}:00`, v: 0 }));
        const sets = Array.from({ length: 24 }, () => new Set());
        items.forEach((it) => {
          const d = new Date(it.date || it.createdAt || it._id?.getTimestamp?.() || it.date);
          if (isNaN(d)) return;
          const h = d.getHours();
          const user = it.userLogin || it.user || it.login || it._id || JSON.stringify(it);
          if (user) sets[h].add(String(user));
        });
        const result = hours.map((h, i) => ({ t: h.t, v: sets[i].size }));
        if (mounted) setSeriesData(result);
      } catch (err) {
        console.warn('Could not load transaction series:', err);
      } finally {
        setLoadingSeries(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // parse traffic like "2.3 MB", "1500 KB", "1.2 GB" or numbers (assumed bytes)
  const parseTrafficToBytes = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return Number(v);
    if (typeof v !== "string") return 0;

    const s = v.trim();
    // if purely numeric
    if (/^[0-9.]+$/.test(s)) return Number(s);

    const m = s.match(/^([0-9.,]+)\s*(kb|kib|mb|mib|gb|gib|b)?$/i);
    if (!m) return 0;
    const num = Number(m[1].replace(',', '.'));
    const unit = (m[2] || '').toLowerCase();
    switch (unit) {
      case 'kb':
      case 'kib':
        return Math.round(num * 1024);
      case 'mb':
      case 'mib':
        return Math.round(num * 1024 * 1024);
      case 'gb':
      case 'gib':
        return Math.round(num * 1024 * 1024 * 1024);
      case 'b':
        return Math.round(num);
      default:
        // if no unit assume bytes
        return Math.round(num);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const abs = Math.abs(bytes);
    if (abs >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (abs >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (abs >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  // compute total traffic shown in the 'Historique journalier' card
  useEffect(() => {
    try {
      const totalBytes = (Array.isArray(tableUsers) ? tableUsers : []).reduce((acc, u) => {
        return acc + parseTrafficToBytes(u.traffic || 0);
      }, 0);
      setTotalTrafficStr(formatBytes(totalBytes));
    } catch (e) {
      console.warn('Could not compute total traffic:', e);
      setTotalTrafficStr('-');
    }
  }, [tableUsers]);

  // compute day-over-day delta using localStorage as a simple historical store
  useEffect(() => {
    if (loadingUsers) return; // wait until loaded

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayKey = `vc_users_count_${y}-${m}-${d}`;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yy = yesterday.getFullYear();
    const ym = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yd = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayKey = `vc_users_count_${yy}-${ym}-${yd}`;

    const currentCount = Array.isArray(tableUsers) ? tableUsers.length : 0;
    const yesterdayCount = parseInt(localStorage.getItem(yesterdayKey) || "0", 10) || 0;

    // store today's count for future comparisons
    try {
      localStorage.setItem(todayKey, String(currentCount));
    } catch (e) {
      // ignore localStorage errors
    }

    // compute percent change
    let label = "N/A";
    let color = "text-gray-600";
    if (yesterdayCount === 0) {
      if (currentCount === 0) {
        label = "0%";
        color = "text-gray-600";
      } else {
        label = "+100%";
        color = "text-green-600";
      }
    } else {
      const delta = Math.round(((currentCount - yesterdayCount) / yesterdayCount) * 100);
      label = `${delta > 0 ? "+" : ""}${delta}%`;
      color = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600";
    }

    setUsersDeltaLabel(`${label} vs hier`);
    setUsersDeltaColor(color);
  }, [tableUsers, loadingUsers]);

  return (
    <ErrorBoundary>
      <Navbar1 onSidebarToggle={(isOpen) => setSidebarOpen(isOpen)}>
        <div
          className="min-h-screen px-4 sm:px-6 lg:px-10 pb-10 bg-[var(--vc-bg,#f6f5fb)] transition-all duration-300 overflow-x-hidden"
          style={{ paddingTop: "var(--vc-header-height, 64px)" }}
        >
          <div className="max-w-[1200px] mx-auto pt-6">
            {/* --- Bloc Bienvenue --- */}
            <div className="rounded-xl shadow-md p-4 sm:p-6 mb-6 w-full bg-gradient-to-r from-[#7B1FFF] to-[#A84BFF] border border-white/10 transition-all duration-300">
              <div className="flex flex-col items-start gap-2 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {`Bienvenue, ${displayName}`}
                </h2>
                <p className="text-lg sm:text-2xl font-semibold text-white/85">
                  Connexion stable — Système opérationnel
                </p>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-green-400 shadow-md"></span>
                  <span className="text-lg sm:text-2xl font-semibold text-white">Réseau actif</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-white font-medium">
                  <span className="text-sm sm:text-lg">Dernière synchronisation</span>
                  <span className="text-lg sm:text-2xl font-bold">{formattedTime}</span>
                </div>
              </div>
            </div>

            {/* --- LES 4 CARDS --- */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-300">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
                <Card color="purple" icon={<Users size={24} />}>
                  <div className="text-base sm:text-lg font-medium text-gray-700">Utilisateurs Connectés</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{loadingUsers ? "..." : tableUsers.length}</div>
                  <div className={`text-sm sm:text-lg font-medium ${usersDeltaColor}`}>{usersDeltaLabel}</div>
                </Card>

                <Card color="blue" icon={<BarChart3 size={24} />}>
                  <div className="text-base sm:text-lg font-medium text-gray-700">Historique journalier</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-700">{totalTrafficStr}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Volume total de données consommées aujourd'hui</div>
                </Card>

                <Card color="green" icon={<Wifi size={24} />}>
                  <div className="text-base sm:text-lg font-medium text-gray-700">Bornes Actives</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-700">{bornesActive}/{bornesTotal}</div>
                  <div className="text-xs sm:text-sm text-orange-500">{bornesAlert}</div>
                </Card>

                <Card color="orange" icon={<AlertCircle size={24} />}>
                  <div className="text-base sm:text-lg font-medium text-gray-700">Alertes Actives</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{activeAlertsCount}</div>
                  <div className="text-xs sm:text-sm text-orange-600">{toTreatCount} à traiter</div>
                </Card>
              </section>
              {/* --- GRAPH + TABLEAU --- */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="rounded-lg shadow-md p-4 sm:p-6 border border-purple-100 bg-purple-50 hover:shadow-lg transition-shadow duration-200 overflow-x-auto">
                  <h3 className="text-purple-700 font-semibold mb-4 text-base sm:text-lg">
                    Historique Journalier des Connexions
                  </h3>

                  <div className="w-full h-64 sm:h-72 flex items-center justify-center min-w-full">
                    <MiniLineChart data={seriesData.length ? seriesData : series} />
                  </div>
                </div>

                {/* Tableau Users*/}
                <div className="rounded-lg shadow-md p-4 sm:p-6 border border-purple-100 bg-white transition-shadow duration-200">
                  <h3 className="text-purple-700 font-semibold mb-4 text-base sm:text-lg">
                    Gestion des Accès - Utilisateurs Connectés
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-purple-100 text-purple-700 border border-purple-200">
                          <th className="text-left px-2 sm:px-3 py-2">UTILISATEUR</th>
                          <th className="text-left px-2 sm:px-3 py-2">ADRESSE IP</th>
                          <th className="text-left px-2 sm:px-3 py-2">TRAFIC</th>
                          <th className="text-left px-2 sm:px-3 py-2">GROUPE</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tableUsers.map((u, idx) => (
                          <tr key={u.id || u.name || `user-${idx}`} className="border-b border-purple-200 last:border-b-0 hover:bg-purple-50">
                            <td className="px-2 sm:px-3 py-2 truncate">{u.name}</td>
                            <td className="px-2 sm:px-3 py-2 truncate">{u.ip}</td>
                            <td className="px-2 sm:px-3 py-2 truncate">{u.traffic}</td>
                            <td className="px-2 sm:px-3 py-2">
                              <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                                {u.group}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Navbar1>
    </ErrorBoundary>
  );
}

// Simple error boundary to display render errors and help debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Dashboard render error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-700 font-semibold">Erreur d'affichage du Dashboard</h2>
          <pre className="text-xs text-red-600 mt-2">{String(this.state.error)}</pre>
          <details className="mt-2 text-xs text-gray-700">
            <summary>Voir la stack</summary>
            <pre className="whitespace-pre-wrap">{this.state.info?.componentStack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
