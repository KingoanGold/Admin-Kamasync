/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  MessageSquare, BellRing, Navigation, Send, ShieldAlert, 
  Users, Activity, PlusCircle, Search, Lock, Unlock, 
  Gamepad2, Target, Clock, ArrowLeft, Trash2, Wifi,
  Lightbulb, Check, User
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCY-gRv2rOrLy8LgxHn5cyd5937jXmrypw",
  authDomain: "kamasync-52671.firebaseapp.com",
  projectId: "kamasync-52671",
  storageBucket: "kamasync-52671.firebasestorage.app",
  messagingSenderId: "211532217086",
  appId: "1:211532217086:web:7a6ed699c878c6995303af",
  measurementId: "G-Q7M6LE859T"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const appId = 'kamasync-ultra-v4';

// --- LISTE DES CATÉGORIES OFFICIELLES ---
const CATEGORIES = [
  'Face à face', 'Par derrière', 'Au-dessus', 'De côté', 
  'Debout & Acrobatique', 'Sur Mobilier', 'Oral & Préliminaires', 
  'Angles & Tweaks', 'Sensorielles'
];

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('global');
  const [status, setStatus] = useState('');
  
  // States Utilisateurs
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // States Formulaires
  const [message, setMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  
  // States Verrouillage
  const [lockTime, setLockTime] = useState(5);
  const [lockReason, setLockReason] = useState("L'accès a été suspendu par le Game Master.");

  // States Position
  const [posForm, setPosForm] = useState({ name: '', cat: 'Face à face', customCat: '', desc: '', spice: 3, diff: 3 });
  const [posTarget, setPosTarget] = useState('ALL');

  // NOUVEAU : State pour les idées
  const [ideas, setIdeas] = useState([]);

  // --- 1. ÉCOUTE DES UTILISATEURS EN TEMPS RÉEL ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'users'), (snap) => {
      const fetchedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Tri par défaut : les plus récemment actifs en premier
      fetchedUsers.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
      setUsers(fetchedUsers);
      
      if (selectedUser) {
        const updated = fetchedUsers.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
        else setSelectedUser(null);
      }
    });
    return () => unsub();
  }, [selectedUser]);

  // --- 2. ÉCOUTE DES IDÉES SOUMISES ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'ideas'), (snap) => {
      const fetchedIdeas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Trier de la plus récente à la plus ancienne
      fetchedIdeas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setIdeas(fetchedIdeas);
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.pseudo || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.pairCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- UTILS ---
  const isUserOnline = (lastActive) => {
    if (!lastActive) return false;
    return (Date.now() - lastActive) < 5 * 60 * 1000;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Jamais connecté";
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FONCTION CENTRALE D'ENVOI ---
  const sendCommand = async (commandData, targetUid = null) => {
    try {
      const commandRef = doc(db, 'artifacts', appId, 'admin', 'commands');
      await setDoc(commandRef, {
        ...commandData,
        targetUid: targetUid,
        timestamp: Date.now()
      });
      showStatus("Commande envoyée avec succès ! ✅");
    } catch (error) {
      console.error(error);
      showStatus("Erreur lors de l'envoi ❌");
    }
  };

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  // --- ACTIONS GLOBALES ---
  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendCommand({ type: 'POPUP_MESSAGE', text: message });
    setMessage('');
  };

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    sendCommand({ type: 'SYSTEM_NOTIF', title: notifTitle, body: notifBody });
    setNotifTitle('');
    setNotifBody('');
  };

  const handleForceNavigation = (tabId) => {
    sendCommand({ type: 'FORCE_NAV', tab: tabId });
  };

  // --- ACTIONS CIBLÉES ---
  const handleLockApp = async (uid, isUnlock = false) => {
    const userRef = doc(db, 'artifacts', appId, 'users', uid);
    if (isUnlock) {
      await updateDoc(userRef, { lockUntil: 0, lockReason: '' });
      showStatus("Application déverrouillée 🔓");
    } else {
      await updateDoc(userRef, { 
        lockUntil: Date.now() + (lockTime * 60 * 1000), 
        lockReason: lockReason 
      });
      showStatus(`App verrouillée pour ${lockTime} minutes 🔒`);
    }
  };

  const handleDeleteUser = async (uid) => {
    if(window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce profil définitivement ? Toute sa progression sera perdue.")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', uid));
        setSelectedUser(null);
        showStatus("Profil supprimé avec succès 🗑️");
      } catch (error) {
        console.error(error);
        showStatus("Erreur lors de la suppression ❌");
      }
    }
  };

  // --- INJECTION DE POSITIONS ---
  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!posForm.name || !posForm.desc) return showStatus("Remplissez le nom et la description ⚠️");

    const finalCat = posForm.cat === 'Autre' ? (posForm.customCat || 'Personnalisé') : posForm.cat;

    const newPos = { 
      name: posForm.name, 
      cat: finalCat, 
      desc: posForm.desc, 
      spice: posForm.spice, 
      diff: posForm.diff, 
      shared: true, 
      isCustom: true, 
      createdAt: Date.now() 
    };

    try {
      if (posTarget === 'ALL') {
        for (const u of users) {
          await addDoc(collection(db, 'artifacts', appId, 'users', u.id, 'customPositions'), newPos);
        }
        showStatus("Position envoyée à tout le monde ! 🌟");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', posTarget, 'customPositions'), newPos);
        showStatus("Position injectée dans le profil cible ! 🎯");
      }
      setPosForm({ name: '', cat: 'Face à face', customCat: '', desc: '', spice: 3, diff: 3 });
    } catch (e) {
      showStatus("Erreur lors de l'ajout ❌");
    }
  };

  // --- GESTION DES IDÉES ---
  const handleApproveIdea = async (id) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'ideas', id), { status: 'approved' });
      showStatus("Idée approuvée ! ✅");
    } catch (e) {
      showStatus("Erreur", "❌");
    }
  };

  const handleDeleteIdea = async (id) => {
    if (window.confirm("Supprimer cette idée ?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'ideas', id));
        showStatus("Idée supprimée 🗑️");
      } catch (e) {
        showStatus("Erreur", "❌");
      }
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center gap-3 text-emerald-500 mb-8 md:mb-10">
          <ShieldAlert size={32} />
          <h1 className="text-2xl font-black tracking-tighter">KAMA<span className="text-white">ADMIN</span></h1>
        </div>
        
        <div className="space-y-3 flex-1">
          <button onClick={() => {setActiveTab('global'); setSelectedUser(null);}} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeTab === 'global' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={18}/> Actions Globales
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users size={18}/> Profils Joueurs
          </button>
          <button onClick={() => {setActiveTab('positions'); setSelectedUser(null);}} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeTab === 'positions' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <PlusCircle size={18}/> Injecter Position
          </button>
          
          {/* BOUTON BOÎTE À IDÉES */}
          <button onClick={() => {setActiveTab('ideas'); setSelectedUser(null);}} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center justify-between transition ${activeTab === 'ideas' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <div className="flex items-center gap-3">
              <Lightbulb size={18}/> Boîte à Idées
            </div>
            {ideas.filter(i => i.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                {ideas.filter(i => i.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative h-full">
        
        {/* TOAST NOTIFICATION */}
        {status && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl font-bold border border-emerald-500/50 shadow-2xl z-50 animate-in slide-in-from-top-4">
            {status}
          </div>
        )}

        {/* =========================================
            ONGLET 1 : ACTIONS GLOBALES
        ========================================= */}
        {activeTab === 'global' && (
          <div className="animate-in fade-in pb-10">
            <h2 className="text-3xl font-black mb-8 text-white">Contrôle Global</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-rose-500">
                  <MessageSquare size={24} />
                  <h2 className="text-xl font-black">Popup Plein Écran</h2>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1">Affiche un message modal au milieu de l'écran de tous les utilisateurs.</p>
                <textarea 
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4 h-32 outline-none focus:border-rose-500 resize-none"
                  placeholder="Ex: Préparez-vous, une surprise arrive..."
                />
                <button onClick={handleSendMessage} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition mt-auto">
                  <Send size={18} /> Envoyer à tous
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-indigo-500">
                  <Navigation size={24} />
                  <h2 className="text-xl font-black">Forcer l'Écran</h2>
                </div>
                <p className="text-sm text-slate-400 mb-6 flex-1">Change instantanément la page sur laquelle se trouvent les utilisateurs.</p>
                <div className="flex flex-col gap-3 mt-auto">
                  <button onClick={() => handleForceNavigation('explorer')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller au Catalogue</button>
                  <button onClick={() => handleForceNavigation('jeux')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller aux Jeux</button>
                  <button onClick={() => handleForceNavigation('conseils')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller aux Conseils</button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-amber-500">
                  <BellRing size={24} />
                  <h2 className="text-xl font-black">Notification Push</h2>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-1">Envoie une notification native sur les téléphones.</p>
                <div className="mt-auto">
                  <input 
                    type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-3 outline-none focus:border-amber-500"
                    placeholder="Titre (Ex: Nouveau défi !)"
                  />
                  <textarea 
                    value={notifBody} onChange={(e) => setNotifBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4 h-20 outline-none focus:border-amber-500 resize-none"
                    placeholder="Message de la notification..."
                  />
                  <button onClick={handleSendNotification} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 rounded-xl flex items-center justify-center gap-2 transition">
                    <Send size={18} /> Déclencher
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================
            ONGLET 2 : UTILISATEURS (LISTE)
        ========================================= */}
        {activeTab === 'users' && !selectedUser && (
          <div className="max-w-5xl mx-auto animate-in fade-in pb-10">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white">Profils des Joueurs ({users.length})</h2>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" placeholder="Chercher un pseudo ou code..." 
                  value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-800 rounded-full py-3 pl-12 pr-4 outline-none text-sm text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(u => {
                const isLocked = u.lockUntil && u.lockUntil > Date.now();
                const online = isUserOnline(u.lastActive);
                
                return (
                  <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 transition relative group shadow-lg">
                    <div className="absolute top-4 right-4">
                      {online ? (
                        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En ligne
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-950 border border-slate-800">
                          Hors ligne
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <img src={u.avatarUrl} alt="avatar" className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 text-lg truncate">
                          <span className="truncate">{u.pseudo}</span>
                          {isLocked && <Lock size={14} className="text-rose-500 shrink-0"/>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Code: <span className="text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded">{u.pairCode}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            ONGLET 2 : UTILISATEURS (PROFIL CIBLE)
        ========================================= */}
        {activeTab === 'users' && selectedUser && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-right-8 pb-10">
            <button onClick={() => setSelectedUser(null)} className="text-slate-400 mb-6 flex items-center gap-2 hover:text-white font-bold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 transition w-fit">
              <ArrowLeft size={18}/> Retour
            </button>
            
            <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 mb-8 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <button 
                onClick={() => handleDeleteUser(selectedUser.id)} 
                className="absolute top-4 right-4 md:top-6 md:right-6 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white p-3 rounded-xl transition-all border border-rose-500/20"
                title="Supprimer ce joueur"
              >
                <Trash2 size={20} />
              </button>

              <img src={selectedUser.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 z-10 shrink-0" />
              
              <div className="z-10 flex-1 w-full mt-4 md:mt-0">
                <h2 className="text-2xl md:text-3xl font-black text-white">{selectedUser.pseudo}</h2>
                <p className="text-slate-400 text-sm mb-4">{selectedUser.bio}</p>
                
                <div className="mb-4 flex justify-center md:justify-start">
                  {isUserOnline(selectedUser.lastActive) ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5"><Wifi size={14} className="animate-pulse" /> Connecté en ce moment</span>
                  ) : (
                    <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5"><Clock size={14} /> Dernier passage : {formatLastSeen(selectedUser.lastActive)}</span>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs font-bold">
                  <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-indigo-400">Favoris : {selectedUser.likes?.length || 0}</span>
                  <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-emerald-400">Statut : {selectedUser.partnerUid ? 'En Duo' : 'Solo'}</span>
                  {selectedUser.lockUntil > Date.now() && <span className="bg-rose-900/30 text-rose-500 border border-rose-500/30 px-3 py-1.5 rounded-full flex items-center gap-1"><Lock size={12}/> Verrouillé</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg"><Target className="text-rose-500"/> Message Privé (Popup)</h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    value={message} onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Ce message apparaîtra uniquement sur son écran..." 
                    className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none text-white focus:border-rose-500 transition" 
                  />
                  <button onClick={() => {sendCommand({ type: 'POPUP_MESSAGE', text: message }, selectedUser.id); setMessage('');}} className="bg-rose-600 hover:bg-rose-500 transition text-white px-6 py-4 md:py-0 rounded-xl font-black">Envoyer</button>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <h3 className="font-black text-white mb-4 flex items-center gap-2 text-lg"><Gamepad2 className="text-purple-500"/> Imposer un Mini-Jeu</h3>
                <p className="text-sm text-slate-400 mb-4">Force l'application du joueur à ouvrir un jeu spécifique et le lance automatiquement.</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['truth', 'dare', 'dice', 'roulette', 'scenario'].map(game => (
                    <button key={game} onClick={() => sendCommand({ type: 'FORCE_EVENT', gameType: game }, selectedUser.id)} className="bg-purple-600/20 text-purple-400 border border-purple-500/30 py-3 rounded-xl text-xs font-black uppercase hover:bg-purple-600 hover:text-white transition">
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 relative overflow-hidden shadow-xl">
                <div className="absolute -top-10 -right-10 p-6 opacity-5 pointer-events-none"><Lock size={200}/></div>
                <h3 className="font-black text-white mb-6 flex items-center gap-2 text-lg"><Clock className="text-amber-500"/> Gestion du Verrouillage</h3>
                
                {selectedUser.lockUntil > Date.now() ? (
                  <div className="relative z-10">
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-4">
                      <p className="text-amber-500 font-bold mb-1">L'application est actuellement bloquée.</p>
                      <p className="text-xs text-amber-500/70">Raison : {selectedUser.lockReason}</p>
                    </div>
                    <button onClick={() => handleLockApp(selectedUser.id, true)} className="bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2 w-full hover:bg-slate-800 transition"><Unlock size={18}/> Déverrouiller immédiatement</button>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-2">Durée (minutes)</label>
                        <input type="number" min="1" value={lockTime} onChange={e=>setLockTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition" />
                      </div>
                      <div className="flex-[3]">
                        <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-2">Message de blocage</label>
                        <input type="text" value={lockReason} onChange={e=>setLockReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                    <button onClick={() => handleLockApp(selectedUser.id, false)} className="bg-amber-600 hover:bg-amber-500 transition text-white w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Lock size={18} /> Verrouiller l'accès
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            ONGLET 3 : INJECTER UNE POSITION
        ========================================= */}
        {activeTab === 'positions' && (
          <div className="max-w-2xl mx-auto animate-in fade-in pb-10">
            <h2 className="text-3xl font-black text-white mb-2">Créateur de Position</h2>
            <p className="text-slate-400 text-sm mb-8">Ajoutez des pratiques directement dans le catalogue des joueurs.</p>
            
            <form onSubmit={handleAddPosition} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-[10px] uppercase text-emerald-500 font-black tracking-widest block mb-3 flex items-center gap-2"><Target size={14}/> Cible de l'injection</label>
                <select value={posTarget} onChange={e=>setPosTarget(e.target.value)} className="w-full bg-transparent text-white outline-none text-base md:text-lg font-bold">
                  <option value="ALL">🌐 Envoyer à TOUT LE MONDE (Global)</option>
                  <optgroup label="Utilisateurs spécifiques" className="bg-slate-900 text-base font-normal">
                    {users.map(u => <option key={u.id} value={u.id}>👤 {u.pseudo} ({u.pairCode})</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-2">Nom de la position</label>
                  <input required value={posForm.name} onChange={e=>setPosForm({...posForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 p-4 rounded-xl text-white outline-none transition" placeholder="Ex: La Danse Secrète" />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-2">Catégorie</label>
                  <select 
                    required 
                    value={posForm.cat} 
                    onChange={e => setPosForm({...posForm, cat: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 p-4 rounded-xl text-white outline-none transition appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Autre">+ Autre (Personnalisée)...</option>
                  </select>
                  
                  {posForm.cat === 'Autre' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <input 
                        required 
                        value={posForm.customCat} 
                        onChange={e => setPosForm({...posForm, customCat: e.target.value})} 
                        className="w-full bg-slate-900 border border-emerald-500/50 focus:border-emerald-500 p-4 rounded-xl text-white outline-none transition placeholder:text-slate-600" 
                        placeholder="Nom de votre nouvelle catégorie" 
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                  <label className="text-[10px] uppercase text-rose-500 font-black tracking-widest block mb-4">Intensité ({posForm.spice}/5)</label>
                  <input type="range" min="1" max="5" value={posForm.spice} onChange={e=>setPosForm({...posForm, spice: parseInt(e.target.value)})} className="w-full accent-rose-500" />
                </div>
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                  <label className="text-[10px] uppercase text-indigo-500 font-black tracking-widest block mb-4">Physique ({posForm.diff}/5)</label>
                  <input type="range" min="1" max="5" value={posForm.diff} onChange={e=>setPosForm({...posForm, diff: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-2">Description / Instructions</label>
                <textarea required value={posForm.desc} onChange={e=>setPosForm({...posForm, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 p-4 rounded-xl text-white outline-none h-32 resize-none transition" placeholder="Décrivez la position..." />
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                <PlusCircle size={18} /> Injecter la position
              </button>
            </form>
          </div>
        )}

        {/* =========================================
            NOUVEL ONGLET : BOÎTE À IDÉES
        ========================================= */}
        {activeTab === 'ideas' && (
          <div className="max-w-4xl mx-auto animate-in fade-in pb-10">
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <Lightbulb className="text-amber-500" /> Boîte à Idées
            </h2>
            <p className="text-slate-400 text-sm mb-8">Gérez les suggestions envoyées par les joueurs depuis l'application.</p>

            <div className="space-y-8">
              {/* SECTION EN ATTENTE */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Nouvelles suggestions ({ideas.filter(i => i.status === 'pending').length})
                </h3>
                
                {ideas.filter(i => i.status === 'pending').length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-8 text-center text-slate-500">
                    Aucune nouvelle idée pour le moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {ideas.filter(i => i.status === 'pending').map(idea => (
                      <div key={idea.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 mb-2 font-bold flex items-center gap-2">
                            <User size={12}/> {idea.pseudo} 
                            <span className="text-slate-700">•</span> 
                            {formatLastSeen(idea.createdAt)}
                          </div>
                          <p className="text-white text-base leading-relaxed">{idea.text}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleApproveIdea(idea.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition rounded-xl font-bold text-sm">
                            <Check size={16}/> Valider
                          </button>
                          <button onClick={() => handleDeleteIdea(idea.id)} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition rounded-xl font-bold text-sm">
                            <Trash2 size={16}/> Rejeter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION APPROUVÉES */}
              {ideas.filter(i => i.status === 'approved').length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Idées Validées (À développer)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 opacity-70">
                    {ideas.filter(i => i.status === 'approved').map(idea => (
                      <div key={idea.id} className="bg-slate-900/50 border border-emerald-500/20 p-5 rounded-2xl flex justify-between items-center gap-4">
                        <div>
                          <p className="text-emerald-100 text-sm mb-1 line-through decoration-emerald-500/30">{idea.text}</p>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suggéré par {idea.pseudo}</div>
                        </div>
                        <button onClick={() => handleDeleteIdea(idea.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition rounded-xl">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
