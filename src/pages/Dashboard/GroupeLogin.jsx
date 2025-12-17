import React, { useState, useEffect } from "react";
import { groupsAPI, usersAPI } from "../../services/api";
import Navbar1 from "../../components/navbar1.jsx";

// === Error Boundary Component ===
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg m-4">
          <h2 className="font-bold mb-2">Une erreur s'est produite</h2>
          <p className="text-sm">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// === Fonction utilitaire pour extraire la clé d'un groupe ===
function getGroupKey(group, index) {
  if (!group) return `group-${index}`;
  if (typeof group === 'string') return group;
  return group._id || group.id || group.name || `group-${index}`;
}

// === Fonction utilitaire pour extraire la valeur d'un groupe ===
function getGroupValue(group) {
  if (!group) return "";
  if (typeof group === 'string') return group;
  return group._id || group.id || group.name || "";
}

// === Fonction utilitaire pour extraire le label d'un groupe ===
function getGroupLabel(group) {
  if (!group) return "Groupe sans nom";
  if (typeof group === 'string') return group;
  return group.name || group._id || group.id || "Groupe sans nom";
}

// === Fonction utilitaire pour nettoyer les groupes ===
function cleanGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.filter(g => g !== null && g !== undefined);
}

export default function CreationDeGroupeEtDeLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [autoGenPass, setAutoGenPass] = useState(false);
  const [group, setGroup] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const defaultGroups = [
    "Hopi-Docteur",
    "Hopi-Secrétariat",
    "Hopi-Direction",
    "Hopi-Urgence",
    "Hopi-Sage",
  ];
  const [groups, setGroups] = useState(defaultGroups);
  const [users, setUsers] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    step: 0,
    selectedItem: null,
    itemName: "",
    userInput: "",
    isLoading: false,
  });

  useEffect(() => {
    // charger initialement les données depuis l'API
    loadData();
  }, []);

  // Centralise le chargement des groupes et des users depuis l'API
  async function loadData() {
    try {
      console.debug("GroupeLogin: loading groups and users from API...");
      const [gData, uData] = await Promise.all([groupsAPI.list(), usersAPI.list()]);

      console.debug("GroupeLogin: raw groups response:", gData);
      console.debug("GroupeLogin: raw users response:", uData);

      // groups
      try {
        let groupsList = [];
        if (Array.isArray(gData)) groupsList = cleanGroups(gData);
        else if (gData?.value && Array.isArray(gData.value)) groupsList = cleanGroups(gData.value);
        if (groupsList.length > 0) setGroups(groupsList);
      } catch (e) {
        console.warn("GroupeLogin: error parsing groups list", e);
      }

      // users
      try {
        let usersList = [];
        if (Array.isArray(uData)) usersList = uData.filter(Boolean);
        else if (uData?.value && Array.isArray(uData.value)) usersList = uData.value.filter(Boolean);
        setUsers(usersList);
      } catch (e) {
        console.warn("GroupeLogin: error parsing users list", e);
      }
    } catch (err) {
      console.error("GroupeLogin: loadData error", err);
    }
  }

  // === Fonction pour trouver le nom du groupe par son ID ===
  function getGroupNameById(groupId) {
    if (!groupId) return "-";

    // normaliser l'identifiant recherché (peut être string ou objet contenant _id/id)
    let target = groupId;
    if (typeof groupId === 'object' && groupId !== null) {
      target = groupId._id || groupId.id || groupId;
    }

    const targetStr = String(target);

    const found = cleanGroups(groups).find((g) => {
      const gValue = String(getGroupValue(g) ?? "");
      return gValue === targetStr || gValue === target;
    });

    // retourner le label lisible si trouvé, sinon '-' par défaut
    return found ? getGroupLabel(found) : "-";
  }

  const [notif, setNotif] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState({ addGroup: false, saveUser: false, deleteUser: false, editUser: false, deleteGroup: false });
  
  useEffect(() => {
    if (notif.message !== "") {
      const timer = setTimeout(() => {
        setNotif({ type: "", message: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";
    let pass = "";
    for (let i = 0; i < 10; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }

  async function handleAddGroup() {
    if (!newGroup.trim()) {
      setNotif({ type: "error", message: "Échec : Le nom du groupe est vide." });
      return;
    }
    
    const groupExists = cleanGroups(groups).some(g => {
      const label = getGroupLabel(g);
      return label === newGroup.trim();
    });
    
    if (groupExists) {
      setNotif({ type: "error", message: "Échec : Ce groupe existe déjà." });
      return;
    }
    
    try {
      setLoading((l) => ({ ...l, addGroup: true }));
      const createdRes = await groupsAPI.create({ name: newGroup.trim(), description: "Créé depuis l'interface" });
      const created = createdRes && typeof createdRes === 'object' ? createdRes : { name: newGroup.trim() };
      setGroups((s) => [created, ...cleanGroups(s)]);
      setNotif({ type: "success", message: "Groupe ajouté avec succès." });
      setNewGroup("");
      try { await loadData(); } catch (e) { /* ignore reload error */ }
    } catch (err) {
      console.error("create group error:", err);
      setNotif({ type: "error", message: "Erreur serveur lors de la création du groupe." });
    } finally {
      setLoading((l) => ({ ...l, addGroup: false }));
    }
  }

  async function handleSaveUser() {
    let errors = [];
    if (!login.trim()) errors.push("Le champ login est vide");
    if (!autoGenPass && !password.trim()) errors.push("Le mot de passe est vide");
    if (!group) errors.push("Aucun groupe sélectionné");

    if (errors.length > 0) {
      setNotif({ type: "error", message: "Échec : " + errors.join(" | ") });
      return;
    }

    try {
      setLoading((l) => ({ ...l, saveUser: true }));
      
      // Récupérer le nom du groupe sélectionné
      const groupName = getGroupNameById(group);
      
      const payload = {
        login: login.trim(),
        password: autoGenPass ? generatePassword() : password,
        group: group || null,
        groupName: groupName, // Ajouter le nom du groupe
        autoGenPass,
      };
      const createdRes = await usersAPI.create(payload);
      const created = createdRes && typeof createdRes === 'object'
        ? createdRes
        : { id: Date.now().toString(), login: login.trim(), groupe: group, groupName: groupName };
      setUsers((u) => [created, ...u]);
      setNotif({ type: "success", message: "Information enregistrée avec succès !" });

      setLogin("");
      setPassword("");
      setAutoGenPass(false);
      setGroup("");
      try { await loadData(); } catch (e) { /* ignore reload error */ }
    } catch (err) {
      console.error("create user error:", err);
      setNotif({ type: "error", message: "Erreur serveur lors de l'enregistrement de l'utilisateur." });
    } finally {
      setLoading((l) => ({ ...l, saveUser: false }));
    }
  }

  function initiateDeleteUser() {
    if (!selectedUser?._id && !selectedUser?.id) {
      setNotif({ type: "error", message: "Sélectionnez un utilisateur à supprimer." });
      return;
    }
    
    const userName = selectedUser.login || selectedUser.name;
    setDeleteConfirmation({
      step: 1,
      selectedItem: selectedUser,
      itemName: userName,
      userInput: "",
      isLoading: false,
    });
  }

  function confirmDeleteStep1() {
    setDeleteConfirmation((prev) => ({
      ...prev,
      step: 2,
      userInput: "",
    }));
  }

  async function confirmDeleteStep2() {
    if (deleteConfirmation.userInput.trim() !== deleteConfirmation.itemName) {
      setNotif({ type: "error", message: "Le nom saisi ne correspond pas. Suppression annulée." });
      setDeleteConfirmation({ step: 0, selectedItem: null, itemName: "", userInput: "", isLoading: false });
      return;
    }

    try {
      setDeleteConfirmation((prev) => ({ ...prev, isLoading: true }));
      const id = deleteConfirmation.selectedItem._id || deleteConfirmation.selectedItem.id;
      await usersAPI.remove(id);
      try {
        await loadData();
      } catch (e) {
        // fallback local update if reload failed
        setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
      }
      
      setDeleteConfirmation({ step: 3, selectedItem: null, itemName: "", userInput: "", isLoading: false });
      
      setTimeout(() => {
        setNotif({ type: "success", message: `Utilisateur "${deleteConfirmation.itemName}" supprimé avec succès.` });
        setDeleteConfirmation({ step: 0, selectedItem: null, itemName: "", userInput: "", isLoading: false });
        setSelectedUser(null);
      }, 1500);
    } catch (err) {
      console.error("delete user error:", err);
      setNotif({ type: "error", message: "Erreur lors de la suppression de l'utilisateur." });
      setDeleteConfirmation({ step: 0, selectedItem: null, itemName: "", userInput: "", isLoading: false });
    }
  }

  function cancelDelete() {
    setDeleteConfirmation({ step: 0, selectedItem: null, itemName: "", userInput: "", isLoading: false });
  }

  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteFields, setDeleteFields] = useState({
    login: false,
    groupe: false,
    created: false,
    last: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingGroupName, setDeletingGroupName] = useState("");

  function openDeletePopup() {
    if (users.length === 0) {
      setNotif({ type: "error", message: "Échec : Aucun utilisateur à supprimer." });
      return;
    }
    setDeleteFields({ login: false, groupe: false, created: false, last: false });
    setDeletePopup(true);
  }

  function toggleDeleteField(field) {
    setDeleteFields((s) => ({ ...s, [field]: !s[field] }));
  }

  function confirmDelete() {
    const anyChecked = Object.values(deleteFields).some(Boolean);
    if (!anyChecked) {
      setNotif({ type: "error", message: "Échec : Choisissez au moins un champ à supprimer." });
      return;
    }
    if (!selectedUser) {
      setNotif({ type: "error", message: "Échec : Sélectionnez un utilisateur dans le tableau." });
      return;
    }

    const toDeleteList = Object.keys(deleteFields).filter((k) => deleteFields[k]).join(", ");

    const confirmAction = window.confirm(
      `Êtes-vous sûr de vouloir supprimer (${toDeleteList}) pour l'utilisateur "${selectedUser.login}" ?`
    );
    if (!confirmAction) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u._id === selectedUser._id || u.id === selectedUser.id) {
          let updated = { ...u };
          if (deleteFields.login) updated.login = "";
          if (deleteFields.groupe) updated.groupe = "";
          if (deleteFields.created) updated.created = "";
          if (deleteFields.last) updated.last = "";
          return updated;
        }
        return u;
      })
    );

    setNotif({ type: "success", message: "Suppression effectuée (local)." });
    setDeletePopup(false);
    setDeleteFields({ login: false, groupe: false, created: false, last: false });
    setSelectedUser(null);
  }

  const [editPopup, setEditPopup] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    login: "",
    password: "",
    groupe: "",
  });

  const [searchGroup, setSearchGroup] = useState(""); // État pour la recherche

  function openEditPopup() {
    if (!selectedUser) {
      setNotif({ type: "error", message: "Sélectionnez un utilisateur à modifier." });
      return;
    }

    setEditData({
      id: selectedUser._id || selectedUser.id,
      login: selectedUser.login || selectedUser.name || "",
      password: "",
      groupe:
        (selectedUser.group && getGroupValue(selectedUser.group)) ||
        selectedUser.groupe ||
        "",
    });
    setEditPopup(true);
  }

  function handleEditChange(field, value) {
    setEditData((d) => ({ ...d, [field]: value }));
  }

  function confirmEditSave() {
    if (!editData.login.trim()) {
      setNotif({ type: "error", message: "Le login ne peut pas être vide." });
      return;
    }
    if (!editData.groupe.trim()) {
      setNotif({ type: "error", message: "Le groupe ne peut pas être vide." });
      return;
    }

    (async () => {
      try {
        setLoading((l) => ({ ...l, editUser: true }));
        if (!editData.id) throw new Error("Identifiant utilisateur manquant");
        
        // Récupérer le nom du groupe modifié
        const groupName = getGroupNameById(editData.groupe);
        
        const payload = {
          login: editData.login.trim(),
          ...(editData.password ? { password: editData.password } : {}),
          group: editData.groupe || null,
          groupName: groupName, // Ajouter le nom du groupe
        };
        const updatedRes = await usersAPI.update(editData.id, payload);
        const updated = updatedRes && typeof updatedRes === 'object' ? updatedRes : null;

        // Défensive: construire un objet 'safeUpdated' et un 'updatedId' sans accéder
        // à des propriétés sur undefined pour éviter les TypeError.
        const safeUpdated = updated
          ? { ...updated, group: payload.group, groupe: payload.group, groupName: payload.groupName }
          : null;

        const updatedId = safeUpdated ? (safeUpdated._id || safeUpdated.id) : (editData.id || null);

        setUsers((prev) =>
          prev.map((u) => {
            const uid = u._id || u.id || null;
            if (uid && updatedId && (uid === updatedId)) return safeUpdated || { ...u, ...payload };
            // fallback: match on login if id not available
            if (!updatedId && safeUpdated && u.login === safeUpdated.login) return safeUpdated;
            return u;
          })
        );
        
        try { await loadData(); } catch (e) { /* ignore reload */ }

        setEditPopup(false);
        setEditData({ id: null, login: "", password: "", groupe: "" });
        setSelectedUser(null);
        setNotif({ type: "success", message: "Utilisateur modifié avec succès." });
        
      } catch (err) {
        console.error("update user error:", err);
        setNotif({ type: "error", message: "Erreur lors de la mise à jour de l'utilisateur." });
      } finally {
        setLoading((l) => ({ ...l, editUser: false }));
      }
    })();
  }

  async function handleDeleteGroup() {
    const gid = group;
    if (!gid) {
      setNotif({ type: "error", message: "Sélectionnez un groupe à supprimer." });
      return;
    }
    const confirmAction = window.confirm(`Supprimer le groupe sélectionné ?`);
    if (!confirmAction) return;
    try {
      setLoading((l) => ({ ...l, deleteGroup: true }));
      // trouver le label avant suppression pour l'animation
      const removed = cleanGroups(groups).find((g) => getGroupValue(g) === gid);
      const removedLabel = removed ? getGroupLabel(removed) : gid;

      // appel API réel (pas seulement local)
      await groupsAPI.remove(gid);

      // lancer animation de suppression
      setDeletingGroupName(removedLabel || gid);
      setDeleting(true);

      // attendre l'animation avant de mettre à jour la liste locale
      setTimeout(async () => {
        try {
          // mettre à jour la liste locale en récupérant depuis l'API
          try {
            const data = await groupsAPI.list();
            let groupsList = [];
            if (Array.isArray(data)) groupsList = cleanGroups(data);
            else if (data?.value && Array.isArray(data.value)) groupsList = cleanGroups(data.value);
            setGroups(groupsList.length > 0 ? groupsList : []);
          } catch (e) {
            // fallback local
            setGroups((prev) => cleanGroups(prev).filter((g) => getGroupValue(g) !== gid));
          }
        } finally {
          setDeleting(false);
          setDeletingGroupName("");
          setGroup("");
          try { await loadData(); } catch (e) { /* ignore */ }
          setNotif({ type: "success", message: "Groupe supprimé." });
        }
      }, 700);
    } catch (err) {
      console.error("delete group error:", err);
      setNotif({ type: "error", message: "Erreur lors de la suppression du groupe." });
    } finally {
      setLoading((l) => ({ ...l, deleteGroup: false }));
    }
  }

  // Nettoyer les groupes avant le rendu
  const cleanedGroups = cleanGroups(groups);

  return (
    <ErrorBoundary>
      <Navbar1 onSidebarToggle={(isOpen) => setSidebarOpen(isOpen)}>
        {/* Notification */}
        {notif.message !== "" && (
          <div
            className={`fixed top-20 right-4 px-4 py-2 rounded-lg text-white shadow-lg transition-all duration-300 z-[9999]
            ${notif.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          >
            {notif.message}
          </div>
        )}

        {/* Animation suppression groupe */}
        {deleting && (
          <div className="fixed inset-0 flex items-center justify-center z-[10000]">
            <div className="bg-black bg-opacity-40 absolute inset-0" />
            <div className="relative bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3 w-[320px]">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600 animate-bounce">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm font-semibold">Groupe supprimé</div>
              <div className="text-xs text-gray-600">{deletingGroupName}</div>
            </div>
          </div>
        )}

        <div
          className="min-h-screen px-4 sm:px-6 lg:px-10 pb-10 bg-white transition-all duration-300 overflow-x-hidden"
          style={{ paddingTop: "var(--vc-header-height, 64px)" }}
        >
          <div className="w-full max-w-[1200px] mx-auto pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-8 mb-6">
              {/* Création login */}
              <div className="pt-1">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Création de login</h2>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className="w-full sm:w-[140px] text-sm text-gray-700">Login</label>
                    <input
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      className="w-full sm:w-[260px] border-2 border-orange-500 rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className="w-full sm:w-[140px] text-sm text-gray-700">Mot de passe</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={autoGenPass}
                      className="w-full sm:w-[260px] border-2 border-orange-500 rounded-lg px-3 py-1.5 disabled:bg-gray-100"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer sm:pl-[142px]">
                    <input
                      type="checkbox"
                      checked={autoGenPass}
                      onChange={() => {
                        setAutoGenPass((v) => {
                          const newValue = !v;
                          if (newValue) {
                            const generated = generatePassword();
                            setPassword(generated);
                          } else {
                            setPassword("");
                          }
                          return newValue;
                        });
                      }}
                      className="w-4 h-4 border-gray-300 rounded"
                    />
                    Générer le mot de passe à la première connexion
                  </label>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className="w-full sm:w-[140px] text-sm text-gray-700">Appartient au groupe</label>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full sm:w-[170px] border-2 border-orange-500 rounded-lg px-3 py-1.5 bg-white"
                    >
                      <option value="">Aucun</option>
                      {cleanedGroups.map((g, idx) => (
                        <option key={getGroupKey(g, idx)} value={getGroupValue(g)}>
                          {getGroupLabel(g)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pl-[110px]">
                    <button
                      onClick={initiateDeleteUser}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold w-full sm:w-auto transition-all duration-200 hover:shadow-lg active:scale-95"
                    >
                      Supprimer
                    </button>

                    <button
                      onClick={openEditPopup}
                      className="px-3 py-1.5 bg-purple-700 text-white rounded-lg text-sm font-semibold w-full sm:w-auto"
                    >
                      Modifier
                    </button>
                    
                    <button
                      onClick={handleSaveUser}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg w-full sm:w-auto"
                    >
                      {loading.saveUser ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Création groupe */}
              <div className="pt-1">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Création de groupe</h2>

                <div className="flex flex-col sm:flex-row gap-2 mb-3 items-start sm:items-center">
                  <input
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="Nouveau groupe"
                    className="w-full sm:w-[300px] border-2 border-orange-500 rounded-lg px-3 py-1.5"
                  />
                  <button
                    onClick={handleAddGroup}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg w-full sm:w-auto"
                  >
                    Valider
                  </button>
                </div>

                <div className="w-full sm:w-[300px]">
                  <label className="block text-sm font-bold mb-2">Groupes (défaut)</label>
                  
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                    placeholder="Rechercher un groupe..."
                    className="w-full border-2 border-orange-300 focus:border-orange-500 rounded-lg px-3 py-2 mb-2 text-sm outline-none transition-colors"
                  />

                  {/* Select avec groupes filtrés */}
                  <select
                    size={6}
                    value={group}
                    onChange={(e) => {
                      setGroup(e.target.value);
                      setSearchGroup(""); // Réinitialiser la recherche après sélection
                    }}
                    className="w-full sm:w-[300px] border-2 border-orange-500 rounded-lg px-2 py-1 bg-white overflow-y-auto text-sm"
                  >
                    <option value="">Aucun</option>
                    {cleanedGroups
                      .filter((g) => 
                        getGroupLabel(g).toLowerCase().includes(searchGroup.toLowerCase())
                      )
                      .map((g, idx) => (
                        <option key={getGroupKey(g, idx)} value={getGroupValue(g)}>
                          {getGroupLabel(g)}
                        </option>
                      ))}
                  </select>

                  {/* Message si aucun résultat */}
                  {searchGroup && cleanedGroups.filter((g) => 
                    getGroupLabel(g).toLowerCase().includes(searchGroup.toLowerCase())
                  ).length === 0 && (
                    <div className="text-xs text-gray-500 mt-2 italic">
                      Aucun groupe correspondant à "{searchGroup}"
                    </div>
                  )}

                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleDeleteGroup}
                      className={`px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm w-full sm:w-auto transition-all ${loading.deleteGroup ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-700'}`}
                      disabled={loading.deleteGroup}
                    >
                      {loading.deleteGroup ? 'Suppression...' : 'Supprimer le groupe sélectionné'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau */}
            <div className="mt-4 border-2 border-orange-500 rounded-lg overflow-hidden w-full">
              <div className="font-semibold text-xs sm:text-sm px-2 sm:px-3 py-2 grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 bg-orange-500 text-white">
                <div>Login</div>
                <div className="hidden sm:block">Groupe</div>
                <div className="hidden sm:block">Création</div>
                <div className="hidden sm:block">Dernière connexion</div>
              </div>

              <div className="overflow-x-auto">
                {users.length === 0 ? (
                  <div className="px-3 py-3 text-gray-500 text-center italic text-sm">
                    Aucun utilisateur enregistré
                  </div>
                ) : (
                  users.map((u) => {
                    const userId = u._id || u.id;
                    const selectedUserId = selectedUser?._id || selectedUser?.id;
                    const isSelected = userId && selectedUserId && userId === selectedUserId;

                    return (
                      <div
                        key={userId}
                        onClick={() => {
                          // Désélection au deuxième clic sur la même ligne
                          if (isSelected) {
                            setSelectedUser(null);
                          } else {
                            setSelectedUser(u);
                          }
                        }}
                        className={`grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 px-2 sm:px-3 py-2 text-xs sm:text-sm cursor-pointer border-b transition-all duration-150
                          ${isSelected ? "bg-orange-200 font-medium" : "hover:bg-gray-50"}`}
                      >
                        <div className="truncate">{u.login || u.name || "-"}</div>
                        <div className="hidden sm:block truncate">
                          {u.groupName || getGroupNameById(u.group || u.groupe) || "-"}
                        </div>
                        <div className="hidden sm:block truncate">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-CA") : u.created || "-"}
                        </div>
                        <div className="hidden sm:block truncate">
                          {u.updatedAt ? new Date(u.updatedAt).toLocaleString("fr-FR") : u.last || "-"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* POPUP MODIFICATION */}
        {editPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-5 rounded-lg shadow-xl w-full sm:w-[420px]">
              <h3 className="text-lg font-bold mb-3">Modifier l'utilisateur</h3>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[90px] text-sm text-gray-700">Login</label>
                  <input
                    value={editData.login}
                    onChange={(e) => handleEditChange("login", e.target.value)}
                    className="w-full sm:w-[260px] border-2 border-orange-500 rounded-lg px-3 py-1.5"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[90px] text-sm text-gray-700">Groupe</label>
                  <select
                    value={editData.groupe}
                    onChange={(e) => handleEditChange("groupe", e.target.value)}
                    className="w-full sm:w-[260px] border-2 border-orange-500 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="">Aucun</option>
                    {cleanedGroups.map((g, idx) => (
                      <option key={getGroupKey(g, idx)} value={getGroupValue(g)}>
                        {getGroupLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setEditPopup(false)}
                  className="px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm w-full sm:w-auto transition-all hover:bg-gray-500"
                >
                  Annuler
                </button>

                <button
                  onClick={confirmEditSave}
                  disabled={loading.editUser}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white rounded-lg text-sm w-full sm:w-auto transition-all"
                >
                  {loading.editUser ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === POPUP SUPPRESSION D'UTILISATEUR === */}
        {deleteConfirmation.step === 1 && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-5 rounded-lg shadow-xl w-full sm:w-[420px] animate-in fade-in scale-in duration-300">
              <h3 className="text-lg font-bold mb-3 text-red-600">⚠️ Confirmation de suppression</h3>
              <p className="text-sm text-gray-700 mb-4">
                Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur <span className="font-bold">"{deleteConfirmation.itemName}"</span> ?
              </p>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm w-full sm:w-auto transition-all"
                >
                  Annuler
                </button>

                <button
                  onClick={confirmDeleteStep1}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm w-full sm:w-auto transition-all active:scale-95"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === POPUP VERIFICATION DU NOM === */}
        {deleteConfirmation.step === 2 && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-5 rounded-lg shadow-xl w-full sm:w-[420px] animate-in fade-in scale-in duration-300">
              <h3 className="text-lg font-bold mb-3 text-orange-600">📝 Vérification</h3>
              <p className="text-sm text-gray-700 mb-4">
                Pour confirmer la suppression de l'utilisateur, veuillez saisir le nom exactement :
              </p>
              <p className="text-center font-bold text-lg text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
                {deleteConfirmation.itemName}
              </p>

              <input
                type="text"
                value={deleteConfirmation.userInput}
                onChange={(e) => setDeleteConfirmation((prev) => ({ ...prev, userInput: e.target.value }))}
                placeholder="Saisir le nom ici..."
                className="w-full border-2 border-orange-500 rounded-lg px-3 py-2 mb-4"
                autoFocus
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm w-full sm:w-auto transition-all"
                >
                  Annuler
                </button>

                <button
                  onClick={confirmDeleteStep2}
                  disabled={deleteConfirmation.isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm w-full sm:w-auto transition-all active:scale-95"
                >
                  {deleteConfirmation.isLoading ? "Suppression..." : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === ANIMATION SUCCESS === */}
        {deleteConfirmation.step === 3 && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full sm:w-[420px] text-center animate-in fade-in scale-in duration-500">
              <div className="text-6xl mb-4 animate-pulse">✅</div>
              <h3 className="text-xl font-bold mb-2 text-green-600">Suppression réussie !</h3>
              <p className="text-sm text-gray-700">
                L'utilisateur <span className="font-bold">"{deleteConfirmation.itemName}"</span> a été supprimé avec succès.
              </p>
            </div>
          </div>
        )}

        {/* POPUP SUPPRESSION (multi-champs) */}
        {deletePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-5 rounded-lg shadow-xl w-full sm:w-[420px]">
              <h3 className="text-lg font-bold mb-3">Supprimer les données</h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteFields.login}
                    onChange={() => toggleDeleteField("login")}
                    className="w-4 h-4 border-gray-300 rounded"
                  />
                  Login
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteFields.groupe}
                    onChange={() => toggleDeleteField("groupe")}
                    className="w-4 h-4 border-gray-300 rounded"
                  />
                  Groupe
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteFields.created}
                    onChange={() => toggleDeleteField("created")}
                    className="w-4 h-4 border-gray-300 rounded"
                  />
                  Date de création
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteFields.last}
                    onChange={() => toggleDeleteField("last")}
                    className="w-4 h-4 border-gray-300 rounded"
                  />
                  Dernière connexion
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setDeletePopup(false)}
                  className="px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm w-full sm:w-auto"
                >
                  Annuler
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm w-full sm:w-auto"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </Navbar1>
    </ErrorBoundary>
  );
}