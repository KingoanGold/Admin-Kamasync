/* eslint-disable */
import React, { useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { MessageSquare, BellRing, Navigation, Send, AlertTriangle, ShieldAlert } from 'lucide-react';

// --- CONFIGURATION FIREBASE (La même que ton app principale) ---
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

export default function AdminApp() {
  const [message, setMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [status, setStatus] = useState('');

  // Envoie une commande à Firestore
  const sendCommand = async (commandData) => {
    try {
      const commandRef = doc(db, 'artifacts', appId, 'admin', 'commands');
      await setDoc(commandRef, {
        ...commandData,
        timestamp: Date.now() // Important pour que l'app détecte un changement
      });
      setStatus("Commande envoyée avec succès ! ✅");
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setStatus("Erreur lors de l'envoi ❌");
    }
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 text-emerald-500">
          <ShieldAlert size={32} />
          <h1 className="text-3xl font-black tracking-tighter">KAMA<span className="text-white">ADMIN</span></h1>
        </div>
        {status && <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-bold border border-emerald-500/50">{status}</div>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* PANEL 1: MESSAGE POPUP DIRECT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-rose-500">
            <MessageSquare size={24} />
            <h2 className="text-xl font-black">Popup Plein Écran</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Affiche un message modal au milieu de l'écran des utilisateurs.</p>
          <textarea 
            value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4 h-32 outline-none focus:border-rose-500 resize-none"
            placeholder="Ex: Préparez-vous, une surprise arrive..."
          />
          <button onClick={handleSendMessage} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <Send size={18} /> Envoyer le Popup
          </button>
        </div>

        {/* PANEL 2: FORCE NAVIGATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-500">
            <Navigation size={24} />
            <h2 className="text-xl font-black">Forcer l'Écran</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">Change instantanément la page sur laquelle se trouvent les utilisateurs.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => handleForceNavigation('explorer')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller au Catalogue</button>
            <button onClick={() => handleForceNavigation('jeux')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller aux Jeux</button>
            <button onClick={() => handleForceNavigation('conseils')} className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 py-3 rounded-xl font-bold transition">Aller aux Conseils</button>
          </div>
        </div>

        {/* PANEL 3: NOTIFICATION SYSTÈME */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-amber-500">
            <BellRing size={24} />
            <h2 className="text-xl font-black">Notification Push</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Envoie une notification native sur le téléphone (s'ils ont accepté).</p>
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
            <Send size={18} /> Envoyer la Notification
          </button>
        </div>

      </div>
    </div>
  );
}
