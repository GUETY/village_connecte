import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/tailwind.css'
import './index.css'
import ConsultationDesAlertes from './pages/consultation_des_alertes.jsx'
import GestionDesBornesWifi from './pages/gestion_des_bornes_wifi.jsx'
import GestionsDesTransactions from './pages/gestions_des_transactions.jsx'
import Statistiques from './pages/statistiques.jsx'
import GestionsDesAgents from './pages/gestions_des_agents.jsx'
import CreationDeForfaits from './pages/creation_de_forfaits.jsx'
import GenererCodeDeConnexions from './pages/generer_code_de_connexions.jsx'
import Login from './pages/Auth/login.jsx';
import Register from './pages/Auth/Register.jsx'; // ajout import
import ResetPassword from './pages/Auth/ResetPassword.jsx'; // ajout import
import Users from './pages/Dashboard/Users.jsx'; // ajout import pour la page Users

// nouvelles importations demandées
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Alertes from './pages/Dashboard/Alertes.jsx';
import GroupeLogin from './pages/Dashboard/GroupeLogin.jsx';

// --- Add AuthProvider import ---
import { AuthProvider } from './hooks/useAuth';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* route racine : afficher la page de connexion */} 
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* ajout route */}
          <Route path="/reset-password" element={<ResetPassword />} /> {/* ajout ResetPassword */}
          <Route path="/ResetPassword" element={<ResetPassword />} /> {/* alias si nécessaire */}
          {/* accès à l'application après connexion */}
          <Route path="/consultation-des-alertes" element={<ConsultationDesAlertes />} />

          {/* Gestion des bornes Wi-Fi */}
          <Route path="/gestion-des-bornes-wifi" element={<GestionDesBornesWifi />} />
          {/* Gestions des transactions */}
          <Route path="/gestions-des-transactions" element={<GestionsDesTransactions />} />
          <Route path="/gestions_des_transactions" element={<GestionsDesTransactions />} />
          
          {/* Statistiques */}
          <Route path="/statistiques" element={<Statistiques />} />
          
          {/* Gestions des agents */}
          <Route path="/gestions-des-agents" element={<GestionsDesAgents />} />
          <Route path="/gestions_des_agents" element={<GestionsDesAgents />} />
          
          {/* Creation de forfaits */}
          <Route path="/creation-de-forfaits" element={<CreationDeForfaits />} />
          <Route path="/creation_de_forfaits" element={<CreationDeForfaits />} />
          
          {/* Generer code de connexions */}
          <Route path="/generer-code-de-connexions" element={<GenererCodeDeConnexions />} />
          <Route path="/generer_code_de_connexions" element={<GenererCodeDeConnexions />} />
          {/* Liste des utilisateurs */}
          <Route path="/users" element={<Users />} />

          {/* nouvelles routes ajoutées */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alertes" element={<Alertes />} />
          <Route path="/groupe-login" element={<GroupeLogin />} />
          
          {/* route de secours */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
