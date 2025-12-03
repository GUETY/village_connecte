import React, { useState, useEffect } from "react";
import { getGroupsRequest, createGroupRequest, deleteGroupRequest } from "../../services/groups.api";
import { getUsersRequest, createUserRequest, updateUserRequest, deleteUserRequest } from "../../services/users.api";
import Navbar1 from "../../components/navbar1.jsx";

export default function CreationDeGroupeEtDeLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [autoGenPass, setAutoGenPass] = useState(false);
  const [group, setGroup] = useState(""); // will store group id
  const [newGroup, setNewGroup] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const defaultGroups = [
    "Hopi-Docteur",
    "Hopi-Sécrétariat",
    "Hopi-Direction",
    "Hopi-Urgence",
    "Hopi-Sage",
  ];
  const [groups, setGroups] = useState(defaultGroups);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    // fetch groups and users from API if available
    (async () => {
      try {
        const [gRes, uRes] = await Promise.allSettled([getGroupsRequest(), getUsersRequest()]);
        if (gRes.status === "fulfilled" && gRes.value) {
          const data = gRes.value.data ?? gRes.value;
          // if API returns groups array use it; if empty keep defaults
          if (data?.value && data.value.length > 0) setGroups(data.value);
          else if (Array.isArray(data) && data.length > 0) setGroups(data);
          // otherwise keep defaultGroups already set
        }
        if (uRes.status === "fulfilled" && uRes.value) {
          const data = uRes.value.data ?? uRes.value;
          if (data?.value) setUsers(data.value);
          else if (Array.isArray(data)) setUsers(data);
          else setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching groups/users:", err);
      }
    })();
  }, []);

  // Notifications
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
    if (groups.includes(newGroup.trim())) {
      setNotif({ type: "error", message: "Échec : Ce groupe existe déjà." });
      return;
    }
    try {
      setLoading((l) => ({ ...l, addGroup: true }));
      const res = await createGroupRequest({ name: newGroup.trim(), description: "Créé depuis l'interface" });
      const created = res?.data || { name: newGroup.trim() };
      setGroups((s) => [created, ...s]);
      setNotif({ type: "success", message: "Groupe ajouté avec succès." });
      setNewGroup("");
    } catch (err) {
      console.error("create group error:", err);
      setNotif({ type: "error", message: "Erreur serveur lors de la création du groupe." });
    } finally {
      setLoading((l) => ({ ...l, addGroup: false }));
    }
  }

  // Enregistrer utilisateur
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
      const payload = {
        login: login.trim(),
        password: password,
        group: group || null, // backend expects `group` as ObjectId
        autoGenPass,
      };
      const res = await createUserRequest(payload);
      const created = res?.data || { id: Date.now().toString(), login: login.trim(), groupe: group };
      setUsers((u) => [created, ...u]);
      setNotif({ type: "success", message: "Information enregistrée avec succès !" });

      setLogin("");
      setPassword("");
      setAutoGenPass(false);
      setGroup("");
    } catch (err) {
      console.error("create user error:", err);
      setNotif({ type: "error", message: "Erreur serveur lors de l'enregistrement de l'utilisateur." });
    } finally {
      setLoading((l) => ({ ...l, saveUser: false }));
    }
  }

  // POPUP SUPPRESSION (multi-champs)
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteFields, setDeleteFields] = useState({
    login: false,
    groupe: false,
    created: false,
    last: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);

  function openDeletePopup() {
    if (users.length === 0) {
      setNotif({ type: "error", message: "Échec : Aucun utilisateur à supprimer." });
      return;
    }
    // reset choices when opening
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

    // This action is client-side field clearing. If user wants full deletion, use dedicated delete.
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

  // POPUP MODIFICATION (Option A)
  const [editPopup, setEditPopup] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    login: "",
    password: "",
    groupe: "",
  });

  // Ouvrir modification : utilise selectedUser si défini, sinon erreur
  function openEditPopup() {
    if (!selectedUser) {
      setNotif({ type: "error", message: "Sélectionnez un utilisateur à modifier." });
      return;
    }

    // Pré-remplir le formulaire d'édition
    setEditData({
      id: selectedUser._id || selectedUser.id,
      login: selectedUser.login || selectedUser.name || "",
      password: "",
      groupe:
        (selectedUser.group && (selectedUser.group._id || selectedUser.group.id || selectedUser.group)) ||
        selectedUser.groupe ||
        "",
    });
    setEditPopup(true);
  }

  function handleEditChange(field, value) {
    setEditData((d) => ({ ...d, [field]: value }));
  }

  function confirmEditSave() {
    // validation minimale
    if (!editData.login.trim()) {
      setNotif({ type: "error", message: "Le login ne peut pas être vide." });
      return;
    }
    if (!editData.groupe.trim()) {
      setNotif({ type: "error", message: "Le groupe ne peut pas être vide." });
      return;
    }

    // Try to persist changes to backend if possible
    (async () => {
      try {
        setLoading((l) => ({ ...l, editUser: true }));
        if (!editData.id) throw new Error("Identifiant utilisateur manquant");
        const payload = {
          login: editData.login.trim(),
          ...(editData.password ? { password: editData.password } : {}),
          group: editData.groupe || null,
        };
        const res = await updateUserRequest(editData.id, payload);
        const updated = res?.data;
          setUsers((prev) =>
            prev.map((u) =>
              u._id === (updated._id || updated.id) || u.id === (updated._id || updated.id) ? updated : u
            )
          );
        setNotif({ type: "success", message: "Utilisateur modifié avec succès." });
      } catch (err) {
        console.error("update user error:", err);
        setNotif({ type: "error", message: "Erreur lors de la mise à jour de l'utilisateur." });
      } finally {
        setEditPopup(false);
        setEditData({ id: null, login: "", password: "", groupe: "" });
        setSelectedUser(null);
        setLoading((l) => ({ ...l, editUser: false }));
      }
    })();
  }

// Delete user permanently
async function handleDeleteUser() {
  if (!selectedUser?._id && !selectedUser?.id) {
    setNotif({ type: "error", message: "Sélectionnez un utilisateur à supprimer." });
    return;
  }
  const id = selectedUser._id || selectedUser.id;
  const confirmAction = window.confirm(`Supprimer définitivement l'utilisateur ${selectedUser.login || selectedUser.name} ?`);
  if (!confirmAction) return;
  try {
    setLoading((l) => ({ ...l, deleteUser: true }));
    await deleteUserRequest(id);
    setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
    setNotif({ type: "success", message: "Utilisateur supprimé." });
    setSelectedUser(null);
  } catch (err) {
    console.error("delete user error:", err);
    setNotif({ type: "error", message: "Erreur lors de la suppression de l'utilisateur." });
  } finally {
    setLoading((l) => ({ ...l, deleteUser: false }));
  }
}

// Delete selected group
async function handleDeleteGroup() {
  // group state stores group id when selected
  const gid = group;
  if (!gid) {
    setNotif({ type: "error", message: "Sélectionnez un groupe à supprimer." });
    return;
  }
  const confirmAction = window.confirm(`Supprimer le groupe sélectionné ?`);
  if (!confirmAction) return;
  try {
    setLoading((l) => ({ ...l, deleteGroup: true }));
    await deleteGroupRequest(gid);
    setGroups((prev) => prev.filter((g) => (g._id || g.id || g.name) !== gid));
    setGroup("");
    setNotif({ type: "success", message: "Groupe supprimé." });
  } catch (err) {
    console.error("delete group error:", err);
    setNotif({ type: "error", message: "Erreur lors de la suppression du groupe." });
  } finally {
    setLoading((l) => ({ ...l, deleteGroup: false }));
  }
}

  return (
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

      {/* Main content wrapper: paddingTop pour ne pas être caché par le header fixe */}
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
                {/* Login */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[140px] text-sm text-gray-700">Login</label>
                  <input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full sm:w-[260px] border-2 border-orange-500 rounded-lg px-3 py-1.5"
                  />
                </div>

                {/* Mot de passe */}
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

                {/* Génération auto */}
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

                {/* Groupe */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[140px] text-sm text-gray-700">Appartient au groupe</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full sm:w-[170px] border-2 border-orange-500 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="">Aucun</option>
                    {groups.map((g) => (
                      <option key={g._id || g.id || g.name} value={g._id || g.id || g.name}>
                        {g.name || g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pl-[110px]">
                  <button
                    onClick={handleDeleteUser}
                    className="px-3 py-1.5 bg-purple-700 text-white rounded-lg text-sm font-semibold w-full sm:w-auto"
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
                <label className="block text-sm font-medium mb-1">Groupes (défaut)</label>
                <select
                  size={6}
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full sm:w-[300px] border-2 border-orange-500 rounded-lg px-2 py-1 bg-white overflow-y-auto text-sm"
                >
                  <option value="">Aucun</option>
                  {groups.map((g) => (
                    <option key={g._id || g.id || g.name || g} value={g._id || g.id || g.name || g}>
                      {g.name || g}
                    </option>
                  ))}
                </select>

                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDeleteGroup}
                    className={`px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm w-full sm:w-auto ${loading.deleteGroup ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                users.map((u) => (
                  <div
                    key={u._id || u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 px-2 sm:px-3 py-2 text-xs sm:text-sm cursor-pointer border-b 
                      ${selectedUser && (selectedUser._id === u._id || selectedUser.id === u.id) ? "bg-orange-200" : "hover:bg-gray-50"}`}
                  >
                    <div className="truncate">{u.login || u.name || "-"}</div>
                    <div className="hidden sm:block truncate">
                      {(u.group && (u.group.name || u.group)) || u.groupe || "-"}
                    </div>
                    <div className="hidden sm:block truncate">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-CA") : u.created || "-"}
                    </div>
                    <div className="hidden sm:block truncate">
                      {u.updatedAt ? new Date(u.updatedAt).toLocaleString("fr-FR") : u.last || "-"}
                    </div>
                  </div>
                ))
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
                  {groups.map((g) => (
                    <option key={g._id || g.id || g.name || g} value={g._id || g.id || g.name || g}>
                      {g.name || g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button
                onClick={() => setEditPopup(false)}
                className="px-3 py-1.5 bg-gray-400 text-white rounded-lg text-sm w-full sm:w-auto"
              >
                Annuler
              </button>

              <button
                onClick={confirmEditSave}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-sm w-full sm:w-auto"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </Navbar1>
  );
}