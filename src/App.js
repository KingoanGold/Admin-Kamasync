/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  MessageSquare, BellRing, Navigation, Send, ShieldAlert, 
  Users, Activity, PlusCircle, Search, Lock, Unlock, 
  Gamepad2, Target, Clock, ArrowLeft, Trash2, Wifi, 
  Lightbulb, Check // NOUVELLES ICÔNES
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

const CATEGORIES = [
  'Face à face', 'Par derrière', 'Au-dessus', 'De côté', 
  'Debout & Acrobatique', 'Sur Mobilier', 'Oral & Préliminaires', 
  'Angles & Tweaks', 'Sensorielles'
];

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('global');
  const [status, setStatus] = useState('');
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [message, setMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  
  const [lockTime, setLockTime] = useState(5);
  const [lockReason, setLockReason] = useState("L'accès a été suspendu par le Game Master.");

  const [posForm, setPosForm] = useState({ name: '', cat: 'Face à face', customCat: '', desc: '', spice: 3, diff: 3 });
  const [posTarget, setPosTarget] = useState('ALL');

  // NOUVEAU : State pour les idées
  const [ideas, setIdeas] = useState([]);

  // --- ÉCOUTE DES UTILISATEURS ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'users'), (snap) => {
      const fetchedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

  // --- NOUVEAU : ÉCOUTE DES IDÉES SOUMISES ---
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

  // --- NOUVEAU : FONCTIONS GESTION DES IDÉES ---
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
          {/* NOUVEAU BOUTON : Boîte à Idées */}
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

      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative h-full">
        
        {status && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl font-bold border border-emerald-500/50 shadow-2xl z-50 animate-in slide-in-from-top-4">
            {status}
          </div>
        )}

        {/* ... (ONGLETS GLOBAL, USERS, ET POSITIONS RESTENT IDENTIQUES) ... */}
        {/* J'ai masqué le contenu répétitif pour aller directement au nouvel onglet. Tu peux garder les autres onglets tels qu'ils étaient dans le code précédent */}

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
