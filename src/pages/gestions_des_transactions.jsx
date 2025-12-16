import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../components/navbar";
// Import de l'API transactions et agents
import { transactionsAPI, agentsAPI, setAuthToken } from "../services/api.js";

/**
 * Page : Gestions des transactions
 * - Filtrage par période, agent et région
 * - Tableau des transactions avec détails (conforme schéma Mongoose)
 * - Affichage du montant total
 * - Design professionnel, animations fluides et responsive
 * 
 * Champs BD : date, codeAgent, agent, userLogin, duration, forfait, amount
 */

function TransactionFilters({ onFilterChange, agents, regions }) {
  const [filters, setFilters] = useState({
    dateDebut: "",
    dateFin: "",
    agent: "",
    region: "",
  });

  const handleChange = (field, value) => {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const resetFilters = {
      dateDebut: "",
      dateFin: "",
      agent: "",
      region: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 mb-6 border border-gray-200 shadow-sm overflow-hidden" style={{ transform: "none", perspective: "none" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-base md:text-lg font-bold text-gray-900">Filtres de recherche</h2>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all hover:shadow-sm w-full sm:w-auto"
        >
          ↻ Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3" style={{ transform: "none" }}>
        {/* Période de début */}
        <div className="flex flex-col">
          <label htmlFor="filter-dateDebut" className="text-xs md:text-sm font-semibold text-gray-700 mb-1.5 block">
            Période du
          </label>
          <input
            id="filter-dateDebut"
            type="date"
            value={filters.dateDebut}
            onChange={(e) => handleChange("dateDebut", e.target.value)}
            className="px-3 py-1.5 border-2 border-[#ff7a00] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent bg-white transition-all"
            aria-label="Date de début"
          />
        </div>

        {/* Période de fin */}
        <div className="flex flex-col">
          <label htmlFor="filter-dateFin" className="text-xs md:text-sm font-semibold text-gray-700 mb-1.5 block">
            au
          </label>
          <input
            id="filter-dateFin"
            type="date"
            value={filters.dateFin}
            onChange={(e) => handleChange("dateFin", e.target.value)}
            className="px-3 py-1.5 border-2 border-[#ff7a00] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent bg-white transition-all"
            aria-label="Date de fin"
          />
        </div>

        {/* Agent */}
        <div className="flex flex-col">
          <label htmlFor="filter-agent" className="text-xs md:text-sm font-semibold text-gray-700 mb-1.5 block">
            Agent
          </label>
          <select
            id="filter-agent"
            value={filters.agent}
            onChange={(e) => handleChange("agent", e.target.value)}
            className="px-3 py-1.5 border-2 border-[#ff7a00] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent bg-white cursor-pointer transition-all"
            aria-label="Filtrer par agent"
          >
            <option value="">Tous</option>
            {agents.map((agent) => (
              <option key={agent._id || agent.id} value={agent._id || agent.id}>
                {agent.firstName || agent.prenom || agent.nom || "Agent"}
              </option>
            ))}
          </select>
        </div>

        {/* Région */}
        <div className="flex flex-col">
          <label htmlFor="filter-region" className="text-xs md:text-sm font-semibold text-gray-700 mb-1.5 block">
            Région
          </label>
          <select
            id="filter-region"
            value={filters.region}
            onChange={(e) => handleChange("region", e.target.value)}
            className="px-3 py-1.5 border-2 border-[#ff7a00] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent bg-white cursor-pointer transition-all"
            aria-label="Filtrer par région"
          >
            <option value="">Toutes</option>
            {regions.map((region) => (
              <option key={region._id || region.id} value={region._id || region.id}>
                {region.nom}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// helper pour afficher proprement un forfait (évite de rendre un objet directement)
function renderForfaitLabel(forfait) {
  if (!forfait) return "-";
  if (typeof forfait === "string") return forfait;
  if (typeof forfait === "object") {
    return forfait.forfaitName || forfait.name || forfait.nom || forfait.label || (forfait._id ? `Forfait ${String(forfait._id).slice(0,6)}` : "-");
  }
  return String(forfait);
}

function TransactionTable({ transactions }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6" style={{ transform: "none", perspective: "none" }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max divide-y divide-gray-200" role="table" aria-label="Tableau des transactions" style={{ transform: "none" }}>
          <caption className="sr-only">Liste des transactions financières avec détails</caption>
          <thead className="bg-[#ff7a00] text-white sticky top-0 z-10">
            <tr style={{ transform: "none" }}>
              <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Date</th>
              <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Code agent</th>
              <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Utilisateur</th>
              <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Durée (min)</th>
              <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Forfait</th>
              <th className="px-2 md:px-3 py-2 text-right text-xs font-semibold whitespace-nowrap">Montant</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.map((transaction, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-orange-50/50 transition-colors duration-200 animate-fadeIn text-xs md:text-sm"
                  style={{ animationDelay: `${idx * 50}ms`, transform: "none" }}
                >
                  <td className="px-2 md:px-3 py-2 align-middle text-gray-700 font-medium whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-2 md:px-3 py-2 align-middle whitespace-nowrap">
                    <code className="text-xs font-bold text-[var(--vc-purple)] bg-purple-50 px-1.5 py-0.5 rounded">
                      {transaction.codeAgent || "-"}
                    </code>
                  </td>
                  <td className="px-2 md:px-3 py-2 align-middle text-gray-700 whitespace-nowrap truncate">
                    {transaction.userLogin || transaction.agentName || "-"}
                  </td>
                  <td className="px-2 md:px-3 py-2 align-middle text-gray-700 font-medium whitespace-nowrap">
                    {transaction.duration || "-"} min
                  </td>
                  <td className="px-2 md:px-3 py-2 align-middle whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">
                      {transaction.forfaitName || renderForfaitLabel(transaction.forfait)}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-2 align-middle text-gray-700 font-bold text-green-600 whitespace-nowrap text-right">
                    {Number(transaction.amount || 0).toLocaleString("fr-FR")} FCFA
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-xs text-gray-500 font-medium">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Aucune transaction trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MontantTotalCard({ montantTotal, nombreTransactions, montantMax, montantMin }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" style={{ transform: "none" }}>
      {/* Montant Total */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 md:p-5 border-2 border-green-300 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1.5 truncate">Montant Total</h3>
            <p className="text-lg md:text-xl font-bold text-green-600 truncate">
              {Number(montantTotal).toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          <div className="text-green-200 opacity-30 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S8.33 8 7.5 8 6 8.67 6 9.5 6.67 11 7.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Nombre de transactions */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 md:p-5 border-2 border-blue-300 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1.5 whitespace-normal">Nombre de transactions</h3>
            <p className="text-lg md:text-xl font-bold text-blue-600">{nombreTransactions}</p>
          </div>
          <div className="text-blue-200 opacity-30 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Montant minimum */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 md:p-5 border-2 border-yellow-300 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-700 mb-1.5 truncate">Montant min</h3>
            <p className="text-lg md:text-xl font-bold text-yellow-600">
              {montantMin !== null ? Number(montantMin).toLocaleString("fr-FR") + " FCFA" : "—"}
            </p>
          </div>
          <div className="text-yellow-200 opacity-30 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Montant maximum */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 md:p-5 border-2 border-purple-300 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-1.5 truncate">Montant max</h3>
            <p className="text-lg md:text-xl font-bold text-purple-600">
              {montantMax !== null ? Number(montantMax).toLocaleString("fr-FR") + " FCFA" : "—"}
            </p>
          </div>
          <div className="text-purple-200 opacity-30 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GestionsDesTransactions() {
  // Données d'exemple
  const sampleAgents = [
    { _id: "1", firstName: "Agent 1", nom: "Agent 1" },
    { _id: "2", firstName: "Agent 2", nom: "Agent 2" },
    { _id: "3", firstName: "Agent 3", nom: "Agent 3" },
  ];

  const sampleRegions = [
    { _id: "1", nom: "Région Nord" },
    { _id: "2", nom: "Région Sud" },
    { _id: "3", nom: "Région Est" },
    { _id: "4", nom: "Région Ouest" },
  ];

  // Transactions conformes au schéma Mongoose
  const sampleTransactions = [
    { date: "2025-11-01", codeAgent: "AG001", userLogin: "user_123", duration: 480, forfait: "Standard", amount: 250, agentName: "Agent 1" },
    { date: "2025-11-02", codeAgent: "AG002", userLogin: "user_456", duration: 360, forfait: "Premium", amount: 400.0, agentName: "Agent 2" },
    { date: "2025-11-03", codeAgent: "AG001", userLogin: "user_123", duration: 600, forfait: "Standard", amount: 300.0, agentName: "Agent 1" },
    { date: "2025-11-04", codeAgent: "AG003", userLogin: "user_789", duration: 300, forfait: "Basic", amount: 150.0, agentName: "Agent 3" },
    { date: "2025-11-05", codeAgent: "AG002", userLogin: "user_456", duration: 480, forfait: "Premium", amount: 420.0, agentName: "Agent 2" },
    { date: "2025-11-06", codeAgent: "AG001", userLogin: "user_123", duration: 420, forfait: "Standard", amount: 280.0, agentName: "Agent 1" },
  ];

  const [agents, setAgents] = useState(sampleAgents);
  const [regions, setRegions] = useState(sampleRegions);
  const [allTransactions, setAllTransactions] = useState(sampleTransactions);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({
    dateDebut: "",
    dateFin: "",
    agent: "",
    region: "",
  });

  // Charger et définir le token au montage, puis charger les données depuis l'API
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // Récupérer le token depuis localStorage
        const token = localStorage.getItem("village_token");
        
        if (!token) {
          console.warn("⚠️ Token non trouvé dans localStorage");
          setIsLoading(false);
          return;
        }

        // Définir le token dans l'en-tête Authorization de toutes les requêtes API
        setAuthToken(token);
        console.log("✓ Token défini avec succès");

        // Charger les agents depuis l'API
        try {
          const agentsData = await agentsAPI.list();
          if (mounted) {
            const agents = Array.isArray(agentsData) ? agentsData : agentsData?.data || sampleAgents;
            setAgents(agents);
            console.log("✓ Agents chargés depuis l'API :", agents);
          }
        } catch (err) {
          console.error("Erreur chargement agents API :", err);
          // Garder les exemples en fallback
        }

        // Charger les transactions depuis l'API
        if (transactionsAPI?.list) {
          try {
            const txns = await transactionsAPI.list();
            if (mounted) {
              const transactionsData = Array.isArray(txns) ? txns : txns?.data || sampleTransactions;
              setAllTransactions(transactionsData);
              console.log("✓ Transactions chargées depuis l'API :", transactionsData);

              // Extraire les régions uniques des transactions
              const uniqueRegions = Array.from(
                new Map(
                  transactionsData
                    .filter((t) => t.region)
                    .map((t) => [t.region, { _id: t.region, nom: t.region }])
                ).values()
              );
              if (uniqueRegions.length > 0) {
                setRegions(uniqueRegions);
              }
            }
          } catch (err) {
            console.error("Erreur chargement transactions API :", err);
            if (mounted) {
              setAllTransactions(sampleTransactions);
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        if (mounted) {
          setAllTransactions(sampleTransactions);
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

  // Filtrer les transactions en fonction des filtres
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const txnDate = new Date(transaction.date);
      const matchDate = !filters.dateDebut || txnDate >= new Date(filters.dateDebut);
      const matchDateFin = !filters.dateFin || txnDate <= new Date(filters.dateFin);
      const matchAgent = !filters.agent || String(transaction.agent || transaction.codeAgent || "") === String(filters.agent);
      const matchRegion = !filters.region || String(transaction.region || "") === String(filters.region);

      return matchDate && matchDateFin && matchAgent && matchRegion;
    });
  }, [allTransactions, filters]);

  // Calculer le montant total, max et min
  const montantTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const { montantMax, montantMin } = useMemo(() => {
    if (filteredTransactions.length === 0) return { montantMax: null, montantMin: null };
    const montants = filteredTransactions.map((t) => Number(t.amount || 0));
    return {
      montantMax: Math.max(...montants),
      montantMin: Math.min(...montants),
    };
  }, [filteredTransactions]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
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
            <p className="ml-3 text-gray-600">Chargement des transactions...</p>
          </div>
        </main>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 font-sans antialiased text-gray-800" style={{ transform: "none" }}>
        {/* Header avec logo de voisinage */}
        <header className="flex items-center gap-4 mb-4">
           <h1 className="text-2xl font-bold text-[var(--vc-purple)]">Transactions</h1>
        </header>

        <section style={{ transform: "none" }}>
          {/* Filtres dynamiques */}
          <TransactionFilters onFilterChange={handleFilterChange} agents={agents} regions={regions} />

          {/* Tableau des transactions */}
          <TransactionTable transactions={filteredTransactions} />

          {/* Montant total et statistiques */}
          <MontantTotalCard
            montantTotal={montantTotal}
            nombreTransactions={filteredTransactions.length}
            montantMax={montantMax}
            montantMin={montantMin}
          />
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
          animation: fadeIn 0.5s ease-out forwards;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          table {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </Navbar>
  );
}