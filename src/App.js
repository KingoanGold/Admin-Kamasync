/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, collection, 
  onSnapshot, updateDoc, arrayUnion, addDoc, deleteDoc,
  query, where, getDocs, orderBy, limit
} from 'firebase/firestore';
import { 
  Heart, Flame, Plus, Sparkles, ChevronRight, 
  Search, Info, Users, ArrowLeft, Gamepad2, 
  Star, Dices, Lock, Activity, Wind, BookOpen, 
  Compass, User, Shield, EyeOff, Eye, Calendar, 
  MessageCircle, Filter, Music, CheckCircle2, 
  Shuffle, RefreshCw, Edit2, Timer, Gift, Zap, 
  Trash2, Edit3, FolderPlus, BellRing, HeartHandshake,
  CalendarHeart, Send, LogIn, MessageSquare, Smartphone,
  AlertTriangle // <-- Ajouté pour le modal Admin
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ULTRA-SÉCURISÉE (ANTI-CRASH) ---
let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  } else {
    throw new Error("Config absente");
  }
} catch (error) {
  firebaseConfig = {
    apiKey: "AIzaSyCY-gRv2rOrLy8LgxHn5cyd5937jXmrypw",
    authDomain: "kamasync-52671.firebaseapp.com",
    projectId: "kamasync-52671",
    storageBucket: "kamasync-52671.firebasestorage.app",
    messagingSenderId: "211532217086",
    appId: "1:211532217086:web:7a6ed699c878c6995303af",
    measurementId: "G-Q7M6LE859T"
  };
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kamasync-ultra-v4';

// --- CATÉGORIES DE BASE ---
const CATEGORIES = [
  { id: 'Face à face', icon: <Users size={14}/>, color: 'from-blue-500/20 to-blue-900/20', text: 'text-blue-400' },
  { id: 'Par derrière', icon: <Flame size={14}/>, color: 'from-orange-500/20 to-orange-900/20', text: 'text-orange-400' },
  { id: 'Au-dessus', icon: <Activity size={14}/>, color: 'from-rose-500/20 to-rose-900/20', text: 'text-rose-400' },
  { id: 'De côté', icon: <Heart size={14}/>, color: 'from-pink-500/20 to-pink-900/20', text: 'text-pink-400' },
  { id: 'Debout & Acrobatique', icon: <Wind size={14}/>, color: 'from-emerald-500/20 to-emerald-900/20', text: 'text-emerald-400' },
  { id: 'Sur Mobilier', icon: <Gamepad2 size={14}/>, color: 'from-purple-500/20 to-purple-900/20', text: 'text-purple-400' },
  { id: 'Oral & Préliminaires', icon: <Sparkles size={14}/>, color: 'from-amber-500/20 to-amber-900/20', text: 'text-amber-400' },
  { id: 'Angles & Tweaks', icon: <Lock size={14}/>, color: 'from-cyan-500/20 to-cyan-900/20', text: 'text-cyan-400' },
  { id: 'Sensorielles', icon: <Star size={14}/>, color: 'from-indigo-500/20 to-indigo-900/20', text: 'text-indigo-400' }
];

// --- HUMEURS INTIMES ---
const MOODS = [
  { id: 'romantic', label: 'Câlin & Doux', icon: '☁️', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'playful', label: 'Humeur Joueuse', icon: '🎲', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'wild', label: 'Très Sauvage', icon: '🔥', color: 'bg-rose-500/20 text-rose-500 border-rose-500/30' },
  { id: 'tired', label: 'Pas ce soir', icon: '💤', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
];

// --- DONNÉES MASSIVES DES JEUX COQUINS ---
const GAMES_DATA = {
  truths: [
    "Quel est ton fantasme le plus inavoué ?", "Quelle partie de mon corps préfères-tu ?", "Raconte-moi le rêve le plus érotique que tu aies fait.",
    "Quel est le lieu le plus risqué où tu aimerais faire l'amour ?", "As-tu déjà pensé à moi dans une situation inappropriée ?",
    "Quelle est la chose la plus folle que tu aimerais que je te fasse ?", "Si tu devais choisir un seul jouet sexuel pour le reste de ta vie, ce serait quoi ?",
    "Préfères-tu dominer ou être dominé(e) ?", "Quelle est ta position préférée et pourquoi ?", "As-tu un fétichisme secret ?"
  ],
  dares: [
    "Masse-moi le dos pendant 3 minutes avec de l'huile ou de la crème.", "Embrasse-moi dans le cou avec un glaçon.",
    "Bande-moi les yeux et fais-moi deviner ce que tu manges ou bois.", "Fais-moi un strip-tease sensuel sur une musique de mon choix.",
    "Embrasse passionnément chaque centimètre de mon ventre.", "Enlève un de mes vêtements en utilisant uniquement tes dents.",
    "Masse l'intérieur de mes cuisses sans toucher mon sexe pendant 2 minutes.", "Attache mes mains et fais ce que tu veux pendant 3 minutes."
  ],
  diceActions: ["Lécher", "Masser", "Caresser", "Embrasser", "Mordiller", "Souffler sur", "Sucer", "Titiller avec la langue", "Effleurer"],
  diceZones: ["le Cou", "le Ventre", "l'Intérieur des Cuisses", "le Dos", "les Lèvres", "la Nuque", "les Seins / Pectoraux", "le Sexe", "le Creux des reins"],
  diceDurations: ["pendant 30 secondes.", "pendant 1 minute.", "pendant 2 minutes.", "jusqu'à ce que je te supplie d'arrêter.", "les yeux fermés."],
  scenPlaces: ["Dans la douche", "Sur la table du salon", "Enfermés dans la chambre", "Dans la cuisine", "Contre un mur"],
  scenRoles: ["Des inconnus dans un bar", "Un massage qui dérape", "Professeur et élève", "Cambrioleur et propriétaire", "Médecin et patient"],
  scenTwists: ["Avec un bandeau sur les yeux", "Sans utiliser les mains", "Dans le silence total", "La lumière doit rester allumée", "En écoutant une musique classique très fort"],
  rouletteTasks: [
    "Dégustation à l'aveugle : Fais-moi goûter 3 choses.",
    "Exploration tactile : Caresses avec une plume ou un tissu doux.",
    "Contraste thermique : Souffle chaud et glaçon sur le torse.",
    "Le jeu du miroir : Place-nous devant un miroir.",
    "Baisers interdits : Embrasse tout mon corps SAUF mes lèvres."
  ],
  secretChallenges: [
    "Porte des sous-vêtements sexy dehors sans me le dire.",
    "Envoie-moi un message explicite quand je ne m'y attends pas.",
    "Ce soir, prends totalement les commandes au lit.",
    "Glisse un mot coquin dans ma poche aujourd'hui."
  ]
};

// --- DONNÉES : CONSEILS ET ARTICLES ---
const TIPS_DATA = [
  {
    id: 't1', title: "Le consentement, moteur du désir", cat: "Communication", icon: <Shield/>, time: "2 min",
    content: "Le consentement n'est pas juste un 'oui' au début, c'est un dialogue continu. Vérifier si l'autre apprécie, demander 'tu aimes ça ?' ou 'je peux aller plus vite ?' n'est pas un tue-l'amour, au contraire ! C'est ce qui permet de s'abandonner totalement en sachant qu'on est en sécurité. N'hésitez pas à instaurer un 'Safe Word' (mot de sécurité) pour vos jeux les plus intenses."
  },
  {
    id: 't2', title: "La Musique idéale pour le lit", cat: "Sensorielles", icon: <Music/>, time: "4 min",
    content: "La musique peut transformer une expérience banale en un moment magique. Voici nos conseils :\n\n1. Le Tempo magique (BPM) : Cherchez des musiques entre 60 et 80 BPM. Cela s'aligne sur le rythme cardiaque au repos, aidant vos corps à se synchroniser.\n2. Pas de paroles : Préférez l'instrumental (Lo-Fi, Trip-Hop, Jazz lent). Les paroles sollicitent la partie analytique du cerveau.\n3. Évitez le mode 'Aléatoire' : Créez une playlist qui évolue. Douce au début, avec un rythme qui s'intensifie, avant de redescendre pour l'aftercare."
  },
  {
    id: 't3', title: "Réussir les positions debout", cat: "Pratique", icon: <Wind/>, time: "3 min",
    content: "Les positions debout ou acrobatiques nécessitent quelques précautions pour éviter les accidents.\n\n1. L'adhérence : Ne le faites pas en chaussettes sur du parquet ou dans une douche sans tapis antidérapant.\n2. La hauteur : Si vous devez porter votre partenaire, utilisez un meuble (lit, table) comme appui de départ pour soulager votre dos.\n3. La communication : Si les muscles tremblent, dites-le immédiatement. Il n'y a pas de honte à faire une pause."
  },
  {
    id: 't4', title: "L'art délicat de l'Aftercare", cat: "Émotionnel", icon: <Heart/>, time: "3 min",
    content: "L'aftercare (les soins post-coïtaux) est crucial, surtout après un rapport intense. Lors de l'orgasme, le cerveau libère un cocktail d'hormones (ocytocine, dopamine) qui retombe brutalement ensuite. Pour éviter le 'blues post-sexe' :\n\n- Restez enlacés quelques minutes en silence.\n- Apportez un verre d'eau ou une petite collation.\n- Échangez des mots doux ou valorisants sur ce que vous venez de vivre.\n- Préparez une serviette tiède pour vous nettoyer mutuellement avec tendresse."
  },
  {
    id: 't5', title: "Dirty Talk : Comment oser se lancer", cat: "Communication", icon: <MessageCircle/>, time: "4 min",
    content: "Le 'Dirty Talk' (parler cru) intimide souvent. Le secret est d'y aller par étapes :\n\n1. Le constat : Décrivez simplement ce que vous ressentez. 'J'adore quand tu fais ça', 'Ta peau est si chaude'.\n2. L'instruction : Donnez des directives douces. 'Plus vite', 'Regarde-moi quand tu le fais'.\n3. L'anticipation : Décrivez ce que vous allez faire. 'Je vais t'embrasser partout jusqu'à ce que tu n'en puisses plus'.\nL'important est d'utiliser un vocabulaire avec lequel vous êtes tous les deux à l'aise."
  },
  {
    id: 't6', title: "Les zones érogènes méconnues", cat: "Sensorielles", icon: <Sparkles/>, time: "5 min",
    content: "Ne foncez pas directement vers les zones génitales ! Prenez le temps d'explorer ces zones souvent oubliées :\n\n- Le cuir chevelu : Un massage appuyé libère énormément de tensions.\n- Le creux des genoux et l'intérieur des poignets : La peau y est très fine et sensible.\n- La nuque et le cou : Un souffle chaud ou de légers mordillements y font des merveilles.\n- Le bas du ventre : Tracer des lignes imaginaires juste au-dessus du pubis rend l'attente insoutenable."
  },
  {
    id: 't7', title: "Introduire des jouets dans le couple", cat: "Pratique", icon: <Zap/>, time: "4 min",
    content: "Un sex-toy ne remplace pas un partenaire, c'est un outil pour explorer de nouvelles sensations ensemble.\n\n- Dédiabolisez l'objet : Faites du shopping en ligne à deux pour choisir votre premier jouet.\n- Commencez petit : Un anneau vibrant ou un petit stimulateur clitoridien (bullet) est parfait pour débuter sans intimider.\n- Guidez l'autre : C'est encore plus excitant quand c'est le partenaire qui contrôle le jouet sur vous."
  },
  {
    id: 't8', title: "L'art du Teasing (Faire monter le désir)", cat: "Préliminaires", icon: <Timer/>, time: "3 min",
    content: "Le sexe commence bien avant d'être dans la chambre. L'anticipation est le plus grand des aphrodisiaques :\n\n- Le matin : Laissez un post-it suggestif sur le miroir de la salle de bain.\n- La journée : Envoyez un message décrivant ce que vous portez ou ce que vous comptez lui faire le soir.\n- Le soir : Frôlez-vous dans la cuisine, embrassez-vous dans le cou, mais refusez d'aller plus loin... pour l'instant. Faites durer la frustration exquise."
  },
  {
    id: 't9', title: "Jeux de température : Le Feu et la Glace", cat: "Sensorielles", icon: <Flame/>, time: "3 min",
    content: "Jouer avec le chaud et le froid réveille les terminaisons nerveuses :\n\n- Le froid : Passez un glaçon sur les lèvres de votre partenaire, le long de sa colonne vertébrale, ou gardez-le en bouche pendant le sexe oral (frissons garantis).\n- Le chaud : Utilisez de l'huile de massage chauffante ou buvez une gorgée de thé/café chaud avant d'embrasser le cou ou le ventre de votre partenaire.\n- Le contraste : Alternez immédiatement le souffle chaud de votre bouche après le passage du glaçon."
  },
  {
    id: 't10', title: "Initiation au Bondage Léger", cat: "Découverte", icon: <Lock/>, time: "4 min",
    content: "Attacher son partenaire (ou l'être) crée un abandon total très excitant. Pour débuter sereinement :\n\n- N'utilisez jamais de menottes en métal (risque de blessure sans clé). Préférez des foulards en soie, des cravates souples ou des menottes en velcro.\n- Gardez toujours des ciseaux à bouts ronds à portée de main en cas de panique.\n- Ne laissez jamais la personne attachée seule dans la pièce.\n- Fixez un 'Safe Word' (ex: 'Rouge') qui stoppe instantanément le jeu si l'un de vous est mal à l'aise."
  },
  {
    id: 't11', title: "Créer l'ambiance parfaite", cat: "Général", icon: <Star/>, time: "2 min",
    content: "L'environnement joue un rôle clé dans la capacité à lâcher prise :\n\n- L'éclairage : Fuyez les plafonniers ! Préférez une lumière tamisée, chaude (lampes de chevet, guirlandes) ou la lueur vacillante de quelques bougies.\n- L'ordre : Un lit défait avec des draps propres, c'est sexy. Des vêtements sales qui traînent au sol, ça l'est moins. Dégagez l'espace.\n- L'odeur : Aérez la pièce, utilisez un léger parfum d'ambiance ou de l'encens, mais sans excès."
  },
  {
    id: 't12', title: "Le pouvoir du regard", cat: "Connexion", icon: <Eye/>, time: "3 min",
    content: "Le contact visuel est souvent sous-estimé car il rend très vulnérable. Pourtant, c'est l'outil de connexion ultime :\n\n- Pendant l'acte : Essayez de garder les yeux ouverts et de fixer ceux de votre partenaire pendant plusieurs minutes consécutives. La sensation de fusion est vertigineuse.\n- Le miroir : Placez-vous devant un miroir pour vous regarder faire l'amour. Le côté voyeuriste de votre propre couple est un puissant déclencheur."
  },
  {
    id: 't13', title: "La liste Oui / Non / Peut-être", cat: "Communication", icon: <CheckCircle2/>, time: "3 min",
    content: "C'est un exercice génial pour les couples ! Imprimez chacun une liste détaillée de pratiques sexuelles. \n- Cochez 'Oui' (J'ai envie), 'Non' (C'est hors limite) ou 'Peut-être' (J'y réfléchis si on m'accompagne bien).\n- Comparez ensuite vos listes avec bienveillance. Vous découvrirez souvent que vous avez des fantasmes communs inavoués dans la colonne 'Peut-être' ou 'Oui' !"
  },
  {
    id: 't14', title: "Massage sensuel : Les règles d'or", cat: "Préliminaires", icon: <Activity/>, time: "4 min",
    content: "Un massage sensuel n'est pas un massage thérapeutique. L'objectif est l'effleurement :\n\n- Utilisez de l'huile (préalablement réchauffée dans vos mains).\n- Ne soyez pas pressé : commencez par les épaules, descendez lentement vers les lombaires, massez les mollets et les pieds.\n- La règle d'or : Interdiction stricte de toucher les zones érogènes primaires (sexe, poitrine) pendant les 10 premières minutes. Le désir va grimper en flèche."
  },
  {
    id: 't15', title: "Gérer les pannes et les moments gênants", cat: "Général", icon: <Info/>, time: "3 min",
    content: "Le sexe, ce n'est pas comme dans les films. Il y a des bruits bizarres, des crampes, des pannes d'érection ou des pertes de lubrification. C'est NORMAL.\n\n- Le rire est votre meilleur allié. Une crampe au mollet ? Riez-en ensemble, massez-la, et reprenez.\n- Une baisse de régime ? Ne focalisez pas dessus. Redescendez d'un cran : retournez aux caresses, aux baisers, sans obligation de résultat.\n- La pression de la performance est le pire ennemi de l'érection et du désir."
  }
];

// --- DONNÉES : POSITIONS (Base complète) ---
const POSITIONS_DATA = [
  { n: "Le Missionnaire (L'indémodable)", c: "Face à face", d: 1, s: 1, desc: "Le partenaire A s'allonge sur le dos, les jambes légèrement écartées. Le partenaire B se place au-dessus en appui sur les mains ou les avant-bras. Leurs bassins s'emboîtent parfaitement, favorisant l'intimité et les baisers.", v: "Variante : Le partenaire A referme complètement ses jambes autour de celles du partenaire B pour augmenter les frictions." },
  { n: "Le Missionnaire surélevé", c: "Face à face", d: 2, s: 2, desc: "Position classique du missionnaire, mais les jambes du partenaire allongé reposent sur les épaules de celui qui est au-dessus. Cela ouvre grand le bassin et permet une pénétration bien plus profonde.", v: "Variante : Glissez un gros coussin sous les fesses du partenaire allongé pour basculer le bassin et cibler la paroi antérieure." },
  { n: "L'Enclume", c: "Face à face", d: 3, s: 4, desc: "Le partenaire allongé sur le dos bascule son bassin vers le haut et replie ses genoux près de ses propres oreilles. L'autre partenaire se place à genoux face à lui pour un angle d'entrée très plongeant.", v: "Variante : Le partenaire du dessus peut attraper les chevilles du receveur pour guider le rythme." },
  { n: "Le Coquillage", c: "Face à face", d: 3, s: 3, desc: "Le partenaire allongé replie ses cuisses serrées contre son propre buste. Le partenaire actif se penche en avant en l'enveloppant de tout son corps, créant une bulle intime et étroite.", v: "Variante : Maintenez un contact visuel ininterrompu à quelques centimètres du visage." },
  { n: "La Fleur de Lotus", c: "Face à face", d: 3, s: 3, desc: "Les deux partenaires sont assis face à face, le partenaire B s'asseyant sur les genoux du partenaire A en enroulant ses jambes derrière son dos. Idéal pour des mouvements lents de balancier.", v: "Variante : Synchronisez votre respiration en collant vos fronts l'un contre l'autre." },
  { n: "Le Papillon", c: "Face à face", d: 3, s: 4, desc: "Le partenaire A s'allonge au bord du lit, les fesses au bord du vide, jambes écartées. Le partenaire B se tient debout devant, profitant d'un effet de levier idéal.", v: "Variante : Le partenaire debout peut glisser ses mains sous les hanches du partenaire allongé pour le surélever à chaque mouvement." },
  { n: "L'Araignée", c: "Face à face", d: 4, s: 4, desc: "Les deux partenaires sont assis face à face, en appui arrière sur leurs mains et leurs pieds. Leurs bassins se rejoignent au centre en lévitation.", v: "Variante : Alternez les mouvements d'avant en arrière comme une danse asymétrique." },
  { n: "Le Missionnaire inversé", c: "Face à face", d: 2, s: 3, desc: "Similaire au missionnaire, mais c'est le partenaire du dessus qui garde les jambes serrées à l'intérieur de celles du partenaire allongé. Modifie complètement les points de pression.", v: "Variante : Le partenaire du dessus allonge tout son poids pour un contact peau à peau intégral." },
  { n: "Le Wrap", c: "Face à face", d: 2, s: 3, desc: "Pendant un missionnaire classique, le partenaire allongé croise fermement ses chevilles dans le bas du dos du partenaire actif, le verrouillant contre lui.", v: "Variante : Serrez ou desserrez l'étreinte des jambes pour contrôler vous-même la profondeur." },
  { n: "La Montagne Magique", c: "Face à face", d: 2, s: 2, desc: "Missionnaire où le partenaire allongé plie les genoux et pose ses pieds à plat sur le matelas, formant un pont. L'angle d'entrée devient légèrement ascendant.", v: "Variante : Le partenaire allongé pousse sur ses talons pour faire décoller son bassin à chaque va-et-vient." },
  { n: "L'Étreinte du Panda", c: "Face à face", d: 2, s: 2, desc: "Assis confortablement face à face sur un grand canapé, le partenaire B blotti dans les bras du partenaire A, jambes de chaque côté des hanches.", v: "Variante : Mouvements circulaires du bassin très lents, axés sur la tendresse." },
  { n: "L'Araignée Inversée", c: "Face à face", d: 4, s: 4, desc: "Assis face à face, les jambes de l'un passent sous les aisselles de l'autre. Une géométrie complexe qui stimule de nouvelles zones.", v: "Variante : L'un des partenaires s'allonge doucement en arrière tout en gardant l'emboîtement." },
  { n: "La Levrette classique", c: "Par derrière", d: 2, s: 4, desc: "Le receveur se place à quatre pattes, dos cambré. Le partenaire se positionne derrière lui à genoux. Offre une pénétration très profonde et stimule l'instinct primal.", v: "Variante : Le partenaire arrière attrape les hanches pour guider l'impact." },
  { n: "La Levrette plate", c: "Par derrière", d: 1, s: 3, desc: "Le partenaire A s'allonge complètement sur le ventre, jambes légèrement écartées. Le partenaire B s'allonge de tout son long par-dessus lui. Fortes frictions clitoridiennes/pubiennes.", v: "Variante : Glissez un petit coussin plat sous le bassin du partenaire allongé sur le ventre." },
  { n: "Le Chien de chasse", c: "Par derrière", d: 3, s: 4, desc: "En position de levrette, le receveur tend l'une de ses jambes vers l'arrière, entre les jambes du partenaire actif. L'angle devient asymétrique et très stimulant.", v: "Variante : Tendez la jambe vers le plafond plutôt que vers l'arrière." },
  { n: "Le Sphinx", c: "Par derrière", d: 2, s: 3, desc: "Une levrette où le receveur descend son torse pour s'appuyer sur ses avant-bras, les fesses bien en l'air, réduisant la fatigue des poignets.", v: "Variante : Le receveur peut coller sa poitrine au matelas pour cambrer encore plus le dos." },
  { n: "La Grenouille", c: "Par derrière", d: 2, s: 4, desc: "Positionnée à plat ventre, la personne réceptrice écarte les genoux au maximum vers l'extérieur (façon grenouille). Le partenaire s'installe au milieu.", v: "Variante : Pressez légèrement l'intérieur cuisses du receveur pour augmenter les sensations." },
  { n: "Le Toboggan", c: "Par derrière", d: 3, s: 4, desc: "Le receveur est à genoux mais redresse complètement son buste à la verticale, cambrant le bas du dos en arrière vers le partenaire.", v: "Variante : Le partenaire arrière entoure le buste du receveur de ses bras pour caresser son torse." },
  { n: "La Levrette debout", c: "Par derrière", d: 4, s: 5, desc: "Le partenaire A se tient debout, penché en avant en appui sur un mur ou une table. Le partenaire B se place debout derrière lui.", v: "Variante : Le receveur garde les jambes bien droites pour étirer les ischio-jambiers et resserrer l'entrée." },
  { n: "La Levrette au bord du lit", c: "Par derrière", d: 2, s: 4, desc: "Le receveur est à quatre pattes sur le matelas, face au mur. Le partenaire se tient debout sur le sol, derrière lui, à hauteur idéale.", v: "Variante : Le partenaire debout maintient les cuisses du receveur pour contrôler l'intensité." },
  { n: "Le Lazy Dog", c: "Par derrière", d: 1, s: 2, desc: "Une levrette sans effort : le partenaire arrière s'affale littéralement sur le dos du receveur, lui faisant supporter une douce pression de son poids.", v: "Variante : Le partenaire arrière glisse ses mains sous le ventre du receveur pour le soutenir." },
  { n: "La Levrette croisée", c: "Par derrière", d: 3, s: 4, desc: "À quatre pattes, le receveur croise fortement ses cuisses/chevilles l'une sur l'autre, créant un canal extrêmement étroit et intense pour l'actif.", v: "Variante : Alternez croisement des jambes gauche/droite toutes les minutes." },
  { n: "La Luge", c: "Par derrière", d: 3, s: 3, desc: "Le receveur est allongé sur le ventre. Le partenaire actif s'assoit à califourchon au-dessus de ses cuisses, entrant par un angle plongeant.", v: "Variante : Le partenaire assis se penche en avant pour masser les épaules du receveur." },
  { n: "L'Andromaque", c: "Au-dessus", d: 2, s: 3, desc: "Le partenaire A est allongé sur le dos. Le partenaire B s'assoit à califourchon face à lui, genoux posés sur le matelas. B contrôle totalement l'intensité et la profondeur.", v: "Variante : Le partenaire du dessus peut se pencher en avant et s'appuyer sur le torse de l'autre." },
  { n: "L'Andromaque inversée", c: "Au-dessus", d: 3, s: 4, desc: "Le partenaire du dessus s'assoit à califourchon, mais tourne le dos au partenaire allongé. Le visuel sur le dos et les fesses est très stimulant pour le partenaire allongé.", v: "Variante : Le partenaire allongé caresse le ventre et les cuisses du partenaire qui le chevauche." },
  { n: "La Cow-girl rodéo", c: "Au-dessus", d: 3, s: 4, desc: "En position d'Andromaque, le partenaire du dessus effectue des mouvements de rotation circulaire du bassin au lieu de simples va-et-vient.", v: "Variante : Alternez entre rotations lentes et mouvements de haut en bas très rapides." },
  { n: "L'Amazone accroupie", c: "Au-dessus", d: 4, s: 5, desc: "Le partenaire du dessus ne pose pas les genoux, mais s'accroupit en appui sur ses plantes de pieds, bondissant grâce à la force de ses cuisses.", v: "Variante : Le partenaire allongé saisit les hanches de l'Amazone pour l'aider à rebondir." },
  { n: "La Cavalière de l'espace", c: "Au-dessus", d: 3, s: 3, desc: "En Andromaque, le partenaire du dessus se penche complètement en arrière jusqu'à poser ses mains (ou sa tête) sur les genoux du partenaire allongé.", v: "Variante : Le partenaire allongé soulève son propre bassin pour rencontrer le mouvement descendant." },
  { n: "Le Bridge", c: "Au-dessus", d: 4, s: 4, desc: "Le partenaire du dessus se positionne en forme de pont (mains et pieds au sol) au-dessus du partenaire allongé, nécessitant une grande force musculaire.", v: "Variante : Rapprochez vos mains de vos pieds pour accentuer la courbure du dos." },
  { n: "La Chaise à bascule", c: "Au-dessus", d: 2, s: 2, desc: "En position d'Andromaque, les mouvements ne sont pas de haut en bas, mais d'avant en arrière, dans un glissement continu très doux.", v: "Variante : Maintenez les épaules de votre partenaire pour stabiliser le mouvement de balancier." },
  { n: "Le Rodéo inversé", c: "Au-dessus", d: 4, s: 5, desc: "Andromaque inversée, mais le partenaire du dessus se penche en avant jusqu'à attraper les mollets du partenaire allongé, offrant un angle très plongeant.", v: "Variante : Le partenaire allongé plie légèrement les genoux pour offrir de meilleures prises." },
  { n: "La Sirène", c: "Au-dessus", d: 2, s: 3, desc: "Le partenaire B chevauche le partenaire A, mais garde ses propres jambes serrées et allongées sur le côté (en amazone). Les frictions sont très localisées.", v: "Variante : Le partenaire A utilise ses cuisses pour frotter l'extérieur des jambes de la sirène." },
  { n: "La Monteuse", c: "Au-dessus", d: 3, s: 4, desc: "Le partenaire allongé garde les genoux repliés sur son propre torse. L'autre le chevauche, s'asseyant pratiquement en l'air, maintenu par les jambes du receveur.", v: "Variante : Le receveur croise ses chevilles derrière le dos du partenaire supérieur." },
  { n: "L'Arc de Triomphe", c: "Au-dessus", d: 4, s: 5, desc: "Le partenaire allongé fait un pont complet avec son corps. L'autre le chevauche en équilibre précaire. Une prouesse physique intense.", v: "Variante : Utilisez un gros traversin sous les lombaires pour soutenir le pont sans fatigue." },
  { n: "La Cuillère", c: "De côté", d: 1, s: 2, desc: "Les deux partenaires sont allongés sur le flanc, emboîtés l'un dans l'autre (en cuillère). Position très reposante, idéale pour de longs câlins sensuels.", v: "Variante : Le partenaire arrière glisse un bras sous la nuque du receveur pour caresser son torse." },
  { n: "La Cuillère inversée", c: "De côté", d: 1, s: 2, desc: "Les partenaires sont allongés sur le flanc mais se font face. La pénétration demande de décaler légèrement les bassins, parfait pour les baisers langoureux.", v: "Variante : Entremêlez une seule jambe pour stabiliser les bassins." },
  { n: "Les Ciseaux", c: "De côté", d: 2, s: 3, desc: "Allongés sur le flanc en se faisant face, les partenaires entrelacent leurs jambes en forme de X. Les frottements sont très intenses sur les zones érogènes externes.", v: "Variante : Gardez les torses éloignés et ne connectez que vos bassins." },
  { n: "Le 69 latéral", c: "De côté", d: 2, s: 4, desc: "Position tête-bêche pour le sexe oral, mais allongés sur le côté (en cuillère inversée). Moins fatigant que le 69 classique.", v: "Variante : Pliez les genoux pour vous rapprocher au maximum de votre partenaire." },
  { n: "Le Tire-bouchon", c: "De côté", d: 3, s: 4, desc: "Le partenaire A est allongé sur le dos, tandis que le partenaire B s'allonge perpendiculairement sur le côté, une jambe par-dessus le torse de A.", v: "Variante : Le partenaire A utilise ses mains pour tirer les hanches de B vers lui à chaque mouvement." },
  { n: "L'Étau", c: "De côté", d: 2, s: 3, desc: "En cuillère, le partenaire arrière verrouille fermement ses deux jambes autour de la jambe inférieure du partenaire avant.", v: "Variante : Le receveur pousse vers l'arrière à chaque mouvement pour contrer la poussée." },
  { n: "La Cuillère surélevée", c: "De côté", d: 2, s: 3, desc: "En cuillère classique, le partenaire receveur lève sa jambe supérieure (celle du dessus) vers le plafond pour ouvrir largement l'accès.", v: "Variante : Le partenaire arrière attrape cette jambe levée pour stabiliser la position." },
  { n: "Le V incliné", c: "De côté", d: 3, s: 3, desc: "Les deux partenaires sont sur le flanc, mais leurs bustes s'éloignent pour form un V, seuls leurs bassins restent connectés au centre.", v: "Variante : Le partenaire avant regarde par-dessus son épaule pour maintenir le contact visuel." },
  { n: "Le Croissant de lune", c: "De côté", d: 2, s: 2, desc: "Une cuillère où les deux partenaires courbent fortement leur dos et rentrent la tête pour former un cocon en arc de cercle.", v: "Variante : Le partenaire arrière masse la nuque du partenaire avant avec des mouvements lents." },
  { n: "Le Noeud amoureux", c: "De côté", d: 3, s: 3, desc: "Face à face sur le côté, chaque partenaire enlace ses jambes autour des cuisses de l'autre. Une véritable fusion des corps difficile à dénouer.", v: "Variante : Balancez doucement vos corps d'avant en arrière de façon synchronisée." },
  { n: "L'Étoile Filante", c: "De côté", d: 2, s: 3, desc: "Le partenaire A est sur le dos. Le partenaire B est allongé sur le côté, formant un T parfait avec le corps de A.", v: "Variante : B glisse une main sous le creux des reins de A pour créer une légère cambrure." },
  { n: "Le Poteau", c: "Debout & Acrobatique", d: 4, s: 4, desc: "Le receveur se tient debout, le dos fermement plaqué contre un mur. Le partenaire actif se tient debout face à lui pour la pénétration.", v: "Variante : Le receveur lève une jambe et l'enroule autour de la hanche du partenaire." },
  { n: "L'Ascenseur", c: "Debout & Acrobatique", d: 5, s: 5, desc: "Le partenaire debout porte entièrement l'autre partenaire. Le porté enroule ses jambes autour de la taille du porteur et s'agrippe à son cou.", v: "Variante : Le porteur peut s'adosser à un mur pour soulager le poids sur son dos." },
  { n: "Le Rocking-chair", c: "Debout & Acrobatique", d: 3, s: 3, desc: "Le partenaire actif est assis sur une chaise solide. Le receveur s'assoit à califourchon face à lui. Mouvements de va-et-vient horizontaux.", v: "Variante : Le receveur pose ses pieds à plat sur l'assise pour rebondir." },
  { n: "La Balançoire", c: "Debout & Acrobatique", d: 4, s: 4, desc: "Le receveur s'assoit sur un meuble haut (machine à laver, commode). Le partenaire se tient debout entre ses jambes écartées.", v: "Variante : Le receveur s'allonge en arrière sur le meuble, la tête dans le vide." },
  { n: "Le Stand and Deliver", c: "Debout & Acrobatique", d: 3, s: 4, desc: "Le receveur s'allonge sur une table solide, les fesses au ras du bord. Le partenaire actif est debout sur le sol.", v: "Variante : Le partenaire debout soulève les jambes du receveur et les pose sur ses épaules." },
  { n: "La Danse du ventre", c: "Debout & Acrobatique", d: 4, s: 3, desc: "Les deux partenaires sont debout face à face au milieu de la pièce, genoux légèrement fléchis pour s'aligner, et ondulent leur bassin.", v: "Variante : Agrippez-vous par les épaules et tournez lentement sur vous-mêmes." },
  { n: "Le T de la victoire", c: "Debout & Acrobatique", d: 5, s: 5, desc: "Le porteur tient le receveur par les hanches. Le receveur est à l'horizontale, formant un T avec le corps du porteur.", v: "Variante : Le receveur s'aide en prenant appui sur le mur avec ses bras." },
  { n: "Le X debout", c: "Debout & Acrobatique", d: 4, s: 4, desc: "Le receveur est de dos contre le mur, bras et jambes grands écartés (en X). L'actif vient s'emboîter au centre de l'étoile.", v: "Variante : L'actif maintient les poignets du receveur plaqués contre le mur." },
  { n: "Le Saut de l'ange", c: "Debout & Acrobatique", d: 5, s: 5, desc: "Une fois porté (comme dans l'Ascenseur), le receveur cambre violemment le dos en arrière, la tête vers le sol, s'abandonnant totally.", v: "Variante : Le porteur soutient fermement le bas du dos du receveur d'une main." },
  { n: "Le Porté en berceau", c: "Debout & Acrobatique", d: 5, s: 4, desc: "Le porteur soulève son partenaire en le portant dans ses bras (une main dans le dos, l'autre sous les genoux), à l'horizontale.", v: "Variante : Marchez très lentement dans la pièce pendant l'acte." },
  { n: "La Brouette", c: "Debout & Acrobatique", d: 5, s: 5, desc: "Le receveur est en appui sur ses mains au sol. Le partenaire debout derrière lui attrape ses chevilles et les soulève au niveau de ses hanches.", v: "Variante : Placez des coussins sous les poignets du receveur pour plus de confort." },
  { n: "Le Fauteuil de bureau", c: "Sur Mobilier", d: 2, s: 3, desc: "L'actif s'assoit sur un fauteuil à roulettes. Le receveur le chevauche. Profitez du rebond et de la rotation du siège.", v: "Variante : Le receveur pousse avec ses pieds sur le sol pour faire tourner le fauteuil." },
  { n: "L'Accoudoir", c: "Sur Mobilier", d: 3, s: 4, desc: "Le receveur s'allonge sur le dos en plaçant son bassin pile sur l'accoudoir du canapé pour être surélevé. L'actif est à genoux par terre.", v: "Variante : Le receveur laisse tomber sa tête en arrière vers les coussins de l'assise." },
  { n: "La Table de cuisine", c: "Sur Mobilier", d: 2, s: 4, desc: "Le grand classique cinématographique : l'un est assis au bord d'une table solide, l'autre debout face à lui pour un accès direct.", v: "Variante : Dégagez tout ce qu'il y a sur la table d'un grand revers de bras (pour le style)." },
  { n: "Le Tabouret de bar", c: "Sur Mobilier", d: 3, s: 3, desc: "L'un est perché sur un tabouret haut, l'autre se place debout face à lui. Le dénivelé naturel facilite l'alignement des bassins.", v: "Variante : Le partenaire debout se glisse entre les jambes écartées de la personne assise." },
  { n: "Le Bureau", c: "Sur Mobilier", d: 3, s: 4, desc: "Le receveur se penche en avant, le ventre et la poitrine reposant sur un bureau dégagé. Le partenaire entre par derrière en restant debout.", v: "Variante : Le receveur s'agrippe fermement aux rebords du bureau pour encaisser la poussée." },
  { n: "Le Canapé profond", c: "Sur Mobilier", d: 2, s: 2, desc: "Les partenaires s'allongent en angle droit, suivant la forme en L d'un canapé d'angle. L'un est sur le dossier, l'autre sur la méridienne.", v: "Variante : Utilisez les accoudoirs comme repose-pieds pour surélever les jambes." },
  { n: "Le Repose-pieds", c: "Sur Mobilier", d: 3, s: 3, desc: "Placez un pouf ou un repose-pieds sous le bassin du receveur allongé au sol. L'actif se place à genoux devant lui.", v: "Variante : Le receveur laisse ses épaules toucher le sol pour une cambrure inversée intense." },
  { n: "L'Escalier", c: "Sur Mobilier", d: 4, s: 5, desc: "Exploitez les marches ! Le receveur est à quatre pattes sur une marche supérieure, l'actif debout ou à genoux deux marches plus bas.", v: "Variante : Le receveur s'allonge sur le dos, la tête vers le bas de l'escalier." },
  { n: "La Chaise longue", c: "Sur Mobilier", d: 2, s: 3, desc: "Idéal en été, l'inclinaison de la chaise longue offre un angle parfait pour un missionnaire reposant où l'actif reste à genoux au sol.", v: "Variante : L'actif passe ses bras sous le transat pour étreindre fermement le receveur." },
  { n: "Le Lit à baldaquin", c: "Sur Mobilier", d: 3, s: 4, desc: "Le receveur s'agrippe aux montants verticaux du lit pour ouvrir son corps ou gagner en puissance de contre-poussée.", v: "Variante : Utilisez des attaches en soie sur les montants pour lier doucement les poignets." },
  { n: "La balade en forêt", c: "Sur Mobilier", d: 3, s: 4, desc: "Le receveur est perché sur un rebord de fenêtre large ou un long comptoir de cuisine, l'actif debout devant lui.", v: "Variante : Le receveur s'appuie contre la vitre froide pour un frisson supplémentaire." },
  { n: "Le Plongeoir", c: "Sur Mobilier", d: 4, s: 4, desc: "L'actif se tient debout au sol, au ras du lit. Le receveur est allongé à plat ventre sur le lit, les hanches juste au bord du matelas.", v: "Variante : L'actif soulève les jambes du receveur pour les coincer sous ses propres bras." },
  { n: "Le 69 Classique", c: "Oral & Préliminaires", d: 2, s: 5, desc: "Les partenaires sont allongés tête-bêche (la tête de l'un au niveau du bassin de l'autre), l'un sur le dos, l'autre par-dessus.", v: "Variante : Synchronisez vos mouvements de langue pour atteindre le sommet en même temps." },
  { n: "Le 69 Inversé", c: "Oral & Préliminaires", d: 3, s: 5, desc: "Tête-bêche, mais le partenaire du dessus tourne le dos à celui du dessous (regardant ses pieds). Moins d'intimité visuelle, plus de concentration sur la sensation.", v: "Variante : Le partenaire du dessus caresse ses propres cuisses pour stimuler visuellement l'autre." },
  { n: "Le 69 Debout", c: "Oral & Préliminaires", d: 5, s: 5, desc: "Le porteur est debout et maintient le receveur la tête en bas, le long de corps. Très physique et vertigineux.", v: "Variante : Faites-le contre un mur pour aider le porteur à stabiliser le poids." },
  { n: "Le Lotus Oral", c: "Oral & Préliminaires", d: 3, s: 4, desc: "Le partenaire A est assis en tailleur. Le partenaire B s'agenouille devant lui et se penche en avant pour prodiguer le soin.", v: "Variante : Le partenaire A caresse délicatement les cheveux et la nuque de B." },
  { n: "Le 69 sur le côté", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Position tête-bêche mais allongés sur le côté. Une version très reposante du 69 classique qui permet de faire durer le plaisir sans fatigue musculaire.", v: "Variante : Pliez la jambe du dessus pour faciliter l'accès à votre partenaire." },
  { n: "La Cascade Orale", c: "Oral & Préliminaires", d: 3, s: 5, desc: "Le receveur est allongé sur le lit, la tête pendante dans le vide au bord du matelas. L'actif se tient debout et se penche sur lui.", v: "Variante : L'afflux sanguin vers la tête augmente la sensibilité du receveur, allez-y doucement." },
  { n: "Le Trône (sur chaise)", c: "Oral & Préliminaires", d: 1, s: 4, desc: "Le receveur s'installe comme un roi/une reine sur un fauteuil. L'actif se met à genoux sur le sol devant lui, dans une position de dévotion.", v: "Variante : Le receveur guide la tête de l'actif avec ses mains posées sur ses oreilles." },
  { n: "Le Baiser Polaire", c: "Oral & Préliminaires", d: 1, s: 5, desc: "Le partenaire actif prend un glaçon dans sa bouche juste avant de commencer la stimulation orale. Contraste thermique explosif.", v: "Variante : Alternez entre le glaçon et des gorgées d'eau très chaude (thé) pour surprendre." },
  { n: "La Tête Bêche Assise", c: "Oral & Préliminaires", d: 3, s: 4, desc: "Les partenaires forment un 69 tout en étant assis en équilibre sur leurs fesses, les torses inclinés vers l'avant.", v: "Variante : Utilisez vos bras libres pour soutenir le dos de l'autre et garder l'équilibre." },
  { n: "Le Plongeon", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Le receveur est allongé à plat ventre sur le lit. L'actif se place entre ses jambes par l'arrière pour une stimulation orale audacieuse.", v: "Variante : Le receveur peut écarter une jambe vers l'extérieur pour dégager davantage l'accès." },
  { n: "L'Oral en V", c: "Oral & Préliminaires", d: 2, s: 3, desc: "Le receveur est sur le dos, épaules au sol, bassin en l'air avec les chevilles posées sur les épaules de l'actif agenouillé.", v: "Variante : L'actif peut masser l'intérieur des cuisses du receveur en même temps." },
  { n: "La Soumission Douce", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Le receveur est allongé sur le dos, les poignets attachés au-dessus de sa tête avec une écharpe douce. Il laisse le partenaire actif prendre le contrôle total.", v: "Variante : Bandez également les yeux du receveur pour décupler son sens du toucher." },
  { n: "Le Face à Face Oral", c: "Oral & Préliminaires", d: 4, s: 5, desc: "L'un est assis sur un meuble à hauteur de poitrine, l'autre se tient debout devant. Leurs visages sont presque à la même hauteur que le bassin.", v: "Variante : Maintenez un contact visuel brûlant sans cligner des yeux." },
  { n: "La Lèche-Vitrine", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Pratiquez le sexe oral en positionnant le receveur debout ou assis directement face à un grand miroir, pour qu'il puisse regarder la scène.", v: "Variante : L'actif jette des regards vers le miroir pour observer les réactions de son partenaire." },
  { n: "L'Oral Croisé", c: "Oral & Préliminaires", d: 2, s: 3, desc: "Le receveur est allongé sur le lit. L'actif s'allonge perpendiculairement à lui, le torse au niveau de son bassin.", v: "Variante : Le receveur utilise ses mains pour masser les épaules ou le dos de l'actif." },
  { n: "Le Souffle Chaud", c: "Oral & Préliminaires", d: 1, s: 3, desc: "Plutôt que d'utiliser la langue immédiatement, l'actif s'approche tout près et souffle de l'air chaud sur la zone érogène pour créer l'anticipation.", v: "Variante : Alternez de très légers effleurements des lèvres avec des souffles profonds." },
  { n: "Le 69 Cambré", c: "Oral & Préliminaires", d: 4, s: 5, desc: "Dans un 69, le partenaire du dessous prend appui sur sa nuque et ses talons pour lever très haut son bassin vers la bouche de l'autre.", v: "Variante : Le partenaire du dessus soutient le bassin soulevé pour éviter la fatigue lombaire." },
  { n: "Le Dégustateur", c: "Oral & Préliminaires", d: 1, s: 4, desc: "Le partenaire actif explore avec une lenteur extrême, refusant d'accélérer malgré les demandes, comme on déguste un grand cru.", v: "Variante : Utilisez uniquement le bout de la langue pendant les 5 premières minutes." },
  { n: "Le Coussin d'Amour", c: "Oral & Préliminaires", d: 1, s: 3, desc: "Le receveur est sur le dos, avec 2 ou 3 gros oreillers glissés sous son bassin. L'élévation offre un accès direct et confortable pour l'actif à genoux.", v: "Variante : Le receveur laisse ses jambes retomber lourdement sur les épaules de l'actif." },
  { n: "La Vue Plongeante", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Le receveur se tient debout. L'actif est à genoux sur le sol, regardant de bas en haut vers son partenaire.", v: "Variante : Le receveur caresse les cheveux de l'actif et dicte doucement le rythme." },
  { n: "L'Oral Suspendu", c: "Oral & Préliminaires", d: 3, s: 5, desc: "Le receveur s'allonge au bord du lit, la tête et les épaules dans le vide vers le sol. L'actif se place au-dessus pour un oral inversé vertigineux.", v: "Variante : L'actif peut masser doucement la gorge exposée du receveur." },
  { n: "Le 69 Diagonale", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Plutôt que d'être parfaitement alignés, les partenaires forment un X (tête-bêche en diagonale) sur un grand lit pour éviter de s'écraser.", v: "Variante : Calez vos têtes sur des traversins pour éviter les torsions du cou." },
  { n: "Le Papillon Oral", c: "Oral & Préliminaires", d: 2, s: 4, desc: "Le receveur est sur le dos, plie les genoux et laisse tomber ses cuisses de chaque côté (en losange). Grande ouverture et vulnérabilité.", v: "Variante : L'actif glisse ses mains sous les cuisses du receveur pour accentuer l'étirement." },
  { n: "La Dégustation aveugle", c: "Oral & Préliminaires", d: 1, s: 5, desc: "Le partenaire actif a les yeux bandés. Il doit se repérer uniquement au toucher et à l'odorat pour trouver sa cible.", v: "Variante : C'est le receveur qui guide doucement la tête de l'actif vers les bonnes zones." },
  { n: "Le Massage Préliminaire", c: "Oral & Préliminaires", d: 1, s: 3, desc: "Commencez par un massage complet du corps (dos, cuisses) avec de l'huile chauffante, en dérivant de plus en plus près de l'intimité sans y toucher, jusqu'à rendre l'autre fou.", v: "Variante : Utilisez la pulpe des doigts pour un toucher très léger, presque chatouilleux." },
  { n: "Le 69 Incliné", c: "Oral & Préliminaires", d: 3, s: 4, desc: "Réalisé sur une chaise longue ou un fauteuil incliné. Le partenaire du dessous est adossé, l'autre par-dessus lui.", v: "Variante : Le partenaire du dessus peut se stabiliser en agrippant le dossier du fauteuil." },
  { n: "La Montée en Puissance", c: "Oral & Préliminaires", d: 1, s: 4, desc: "Un oral basé sur le rythme : l'actif commence par des caresses imperceptibles pendant plusieurs minutes, avant d'augmenter brusquement la pression et la vitesse.", v: "Variante : Redescendez en intensité juste avant l'orgasme pour faire du 'edging'." },
  { n: "L'Étoile Orale", c: "Oral & Préliminaires", d: 2, s: 3, desc: "Le receveur s'étale de tout son long sur le lit, bras et jambes ouverts en étoile de mer, s'abandonnant totalement aux soins de son partenaire.", v: "Variante : L'actif parcourt chaque branche de l'étoile avec des baisers avant d'atteindre le centre." },
  { n: "Le Pont Oral", c: "Oral & Préliminaires", d: 4, s: 5, desc: "Le receveur se met en position de pont de gymnastique. L'actif se glisse sous lui pour une exploration par en dessous. Très physique.", v: "Variante : Le receveur peut prendre appui sur ses avant-bras plutôt que sur ses poignets." },
  { n: "L'Éveil des Sens", c: "Oral & Préliminaires", d: 1, s: 4, desc: "Avant tout contact buccal, l'actif utilise des objets (plume, foulard en soie, glaçon) pour effleurer les zones intimes.", v: "Variante : Demandez au receveur de deviner quel objet est en train d'être utilisé." },
  { n: "Le Missionnaire Jambes fermées", c: "Angles & Tweaks", d: 1, s: 3, desc: "Au lieu d'écarter les jambes, le receveur les serre fermement l'une contre l'autre. Le partenaire actif les enjambe. Crée une sensation de friction intense.", v: "Variante : Le receveur peut enrouler une cheville autour de l'autre pour verrouiller ses jambes." },
  { n: "Le Missionnaire Jambes au ciel", c: "Angles & Tweaks", d: 2, s: 4, desc: "Le receveur garde les jambes parfaitement droites et tendues vers le plafond, posées contre le torse de l'actif. Réduit la longueur du canal vaginal/anal.", v: "Variante : L'actif pousse doucement les chevilles du receveur vers sa tête pour cambrer le bas du dos." },
  { n: "La Levrette Genoux surélevés", c: "Angles & Tweaks", d: 3, s: 4, desc: "Le receveur est à quatre pattes mais place ses genoux sur une pile de coussins épais. Le dénivelé modifie radicalement l'angle d'impact.", v: "Variante : Écartez davantage les genoux sur les coussins pour laisser l'actif s'enfoncer plus loin." },
  { n: "L'Andromaque Mains liées", c: "Angles & Tweaks", d: 2, s: 5, desc: "Le partenaire du dessus place volontairement ses mains derrière son dos (ou au-dessus de sa tête) et laisse le partenaire allongé guider ses hanches.", v: "Variante : Le partenaire allongé utilise une écharpe pour maintenir doucement les poignets de l'Andromaque." },
  { n: "Le G-Whiz", c: "Angles & Tweaks", d: 3, s: 5, desc: "Un missionnaire très replié où le receveur ramène ses genoux presque contre ses épaules, bassin très incliné. Réputé pour cibler précisément la zone antérieure (Point G).", v: "Variante : L'actif place ses bras sous les genoux du receveur pour maintenir fermement la position." },
  { n: "La Catherine", c: "Angles & Tweaks", d: 2, s: 4, desc: "Le receveur est sur le dos. Une de ses jambes est allongée à plat, l'autre est levée et repose sur l'épaule de l'actif. Une asymétrie très agréable.", v: "Variante : Alternez la jambe levée toutes les quelques minutes pour varier les sensations." },
  { n: "Le Triangle", c: "Angles & Tweaks", d: 3, s: 3, desc: "Le receveur est sur le dos, le bassin surélevé par un coussin rigide, formant un triangle avec le lit. L'actif se place à genoux pour un angle d'entrée très droit.", v: "Variante : L'actif peut se redresser complètement sur ses genoux pour un effet 'piston'." },
  { n: "L'Angle droit", c: "Angles & Tweaks", d: 2, s: 3, desc: "Le receveur sur le dos replie ses genoux à 90 degrés et pose ses mollets sur les épaules de l'actif, formant un angle droit parfait.", v: "Variante : L'actif masse les mollets de son partenaire pendant l'action." },
  { n: "La Compression", c: "Angles & Tweaks", d: 3, s: 4, desc: "Quelle que soit la position, le receveur contracte fortement ses muscles pelviens et serre ses cuisses pour créer une sensation d'étreinte maximale.", v: "Variante : Rythmez les contractions pelviennes (Kegel) sur les mouvements de va-et-vient." },
  { n: "L'Expansion", c: "Angles & Tweaks", d: 2, s: 2, desc: "L'actif recule presque jusqu'à sortir complètement à chaque mouvement, avant de revenir profondément. Joue sur la frustration et l'anticipation.", v: "Variante : Marquez une pause d'une seconde lorsque vous êtes presque sorti, avant la pénétration." },
  { n: "La Méditation sexuelle", c: "Sensorielles", d: 1, s: 3, desc: "Une fois emboîtés, les deux partenairesered cessent tout mouvement pendant plusieurs minutes. Fermez les yeux et concentrez-vous uniquement sur les micro-pulsations de vos corps.", v: "Variante : Synchronisez votre respiration : l'un inspire quand l'autre expire." },
  { n: "Le Slow-motion", c: "Sensorielles", d: 2, s: 4, desc: "Effectuez l'acte avec une lenteur exagérée, comme au ralenti. Chaque va-et-vient doit prendre plusieurs secondes. Idéal pour faire monter la tension.", v: "Variante : Combinez le ralenti avec un bandeau sur les yeux du receveur." },
  { n: "La Respiration synchronisée", c: "Sensorielles", d: 1, s: 2, desc: "Inspirez et expirez exactement en même temps, ventre contre ventre. Cela crée une puissante résonance énergétique et émotionnelle.", v: "Variante : Accélérez progressivement le rythme de la respiration pour faire monter l'excitation." },
  { n: "Le Contact visuel total", c: "Sensorielles", d: 1, s: 4, desc: "Interdiction formelle de fermer les yeux ou de détourner le regard, de la première caresse jusqu'à l'orgasme. Très intense et vulnérable.", v: "Variante : Ne clignez des yeux que lorsque votre partenaire le fait." },
  { n: "Le Miroir", c: "Sensorielles", d: 2, s: 5, desc: "Pratiquez l'amour face à une grande glace lumineuse (ou un miroir au plafond) pour vous observer faire. Le voyeurisme de soi-même est un puissant aphrodisiaque.", v: "Variante : Regardez votre partenaire dans les yeux via le reflet du miroir." },
  { n: "La Douche", c: "Sensorielles", d: 3, s: 4, desc: "Faites l'amour debout sous l'eau chaude. L'eau coulant sur les corps modifie les sensations tactiles. Attention : l'eau n'est pas un lubrifiant !", v: "Variante : Alternez brutalement vers l'eau froide pendant quelques secondes pour un choc thermique." },
  { n: "Le Bain", c: "Sensorielles", d: 2, s: 3, desc: "L'un s'assoit au fond de la baignoire remplie, l'autre vient s'asseoir sur lui. L'apesanteur de l'eau facilite grandement les mouvements.", v: "Variante : Ajoutez des huiles essentielles ou des bulles pour masquer vos mouvements." },
  { n: "Le Tapis", c: "Sensorielles", d: 1, s: 3, desc: "Quittez le lit confortable pour la rudesse d'un tapis épais devant le salon, ou la chaleur de la moquette. Le changement de texture ravive les sens.", v: "Variante : Allumez un feu de cheminée (ou une vidéo de feu sur la TV) pour la lumière tamisée." },
  { n: "La Forêt", c: "Sensorielles", d: 4, s: 5, desc: "L'adrénaline du plein air (dans un lieu isolé et sûr). La brise sur la peau nue et la peur d'être surpris décuplent l'excitation sexuelle.", v: "Variante : Adossez-vous à un arbre large pour un missionnaire debout (le Poteau)." },
  { n: "L'Improvisation totale", c: "Sensorielles", d: 2, s: 5, desc: "Désactivez votre cerveau rationnel. Interdiction de planifier la prochaine position : laissez vos corps s'emmêler, rouler et décider eux-mêmes de la suite.", v: "Variante : Laissez la musique dicter le rythme et les changements de position." },
  { n: "Le Double Contact", c: "Sensorielles", d: 2, s: 4, desc: "Pendant le rapport (ex: en missionnaire ou en levrette), un petit vibromasseur est inséré entre les deux corps pour stimuler le clitoris en continu.", v: "Variante : Confiez la télécommande du jouet à votre partenaire pour qu'il gère les vibrations." },
  { n: "Le Papillon de Nuit", c: "Sensorielles", d: 1, s: 5, desc: "Plongez la chambre dans le noir le plus total. Bandez les yeux de l'un des partenaires (ou des deux). La suppression de la vue rendra l'ouïe et le toucher explosifs.", v: "Variante : Murmurez des instructions de plus en plus érotiques à l'oreille de votre partenaire." }
];

const FULL_CATALOG = POSITIONS_DATA.map((p, i) => ({
  id: `p${i}`, name: p.n, cat: p.c, diff: p.d, spice: p.s, desc: p.desc, v: p.v
}));

export default function App() {
  const [user, setUser] = useState(null);
  const [requireLogin, setRequireLogin] = useState(false); // GESTION DE LA CONNEXION OBLIGATOIRE
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  
  const [myCustomPositions, setMyCustomPositions] = useState([]);
  const [partnerCustomPositions, setPartnerCustomPositions] = useState([]);
  
  const [activeTab, setActiveTab] = useState('explorer'); 
  const [loading, setLoading] = useState(true);
  
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTip, setSelectedTip] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInstallTutorial, setShowInstallTutorial] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpice, setFilterSpice] = useState(0); 
  const [filterPhysique, setFilterPhysique] = useState(0); 
  const [filterCat, setFilterCat] = useState('Toutes');
  const [sortBy, setSortBy] = useState('az'); 
  
  const [notifications, setNotifications] = useState([]);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  
  const [editPosId, setEditPosId] = useState(null);
  const [newPos, setNewPos] = useState({ name: '', cat: 'Face à face', newCat: '', desc: '', v: '', diff: 3, spice: 3, shared: true });
  
  const [profileForm, setProfileForm] = useState({ pseudo: '', bio: '', avatarUrl: '' });
  const [discreetMode, setDiscreetMode] = useState(false);

  const [activeGame, setActiveGame] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const chatEndRef = useRef(null);
  
  // REFS POUR LES NOTIFICATIONS SYSTÈMES ET APP ADMIN
  const lastSeenPingRef = useRef(Date.now());
  const prevPartnerLikesRef = useRef([]);
  const myLikesRef = useRef([]);
  const lastAdminCommandRef = useRef(0); // <-- NOUVEAU REF ADMIN
  const [adminPopupMessage, setAdminPopupMessage] = useState(null); // <-- STATE ADMIN POPUP

  // --- SYSTÈME DE NOTIFICATION NATIVE (OS) ---
  const fireSystemNotification = (title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
             reg.showNotification(title, { body }).catch(e=>e);
          }).catch(e=>e);
        }
      } catch (e) {
        console.log("Erreur notification système:", e);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // --- INIT AUTHENTIFICATION FIXÉE ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setRequireLogin(false);
      } else {
        setUser(null);
        setRequireLogin(true); // OBLIGE LA CONNEXION GOOGLE AU DEMARRAGE
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // --- ÉCOUTE DES COMMANDES ADMIN ---
  useEffect(() => {
    if (!user) return;
    
    const commandRef = doc(db, 'artifacts', appId, 'admin', 'commands');
    const unsubAdmin = onSnapshot(commandRef, (snap) => {
      if (snap.exists()) {
        const cmd = snap.data();
        
        // On ignore les commandes plus vieilles que le lancement de l'app ou déjà traitées
        if (cmd.timestamp <= lastAdminCommandRef.current) return;
        lastAdminCommandRef.current = cmd.timestamp;

        // Traitement des différentes commandes du Game Master
        if (cmd.type === 'POPUP_MESSAGE') {
          setAdminPopupMessage(cmd.text);
        } 
        else if (cmd.type === 'FORCE_NAV') {
          setActiveTab(cmd.tab);
          setActiveGame(null); // Reset le jeu si on force la navigation
          notify("Le Maître du Jeu a changé votre page !", "⚡");
        } 
        else if (cmd.type === 'SYSTEM_NOTIF') {
          fireSystemNotification(cmd.title, cmd.body);
          notify(cmd.title, "🔔");
        }
      }
    });

    return () => unsubAdmin();
  }, [user]);

  // --- LOGIQUE PRINCIPALE DONNÉES ---
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
    let unsubPartner = () => {};
    let unsubPartnerCustom = () => {};
    let unsubGlobalChat = () => {};

    const unsubUser = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        const initial = { 
          uid: user.uid, 
          pseudo: user.displayName || 'Anonyme', 
          bio: 'Explorateur de sensations...',
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}&backgroundColor=1e293b`,
          likes: [], 
          pairCode: Math.random().toString(36).substring(2, 8).toUpperCase(), 
          partnerUid: null,
          mood: 'playful',
          lastIntimacy: 0,
          pingToPartner: 0
        };
        setDoc(userRef, initial);
        setUserData(initial);
        myLikesRef.current = [];
      } else {
        const data = snap.data();
        setUserData(data);
        myLikesRef.current = data.likes || [];

        if (data.partnerUid) {
          unsubPartner = onSnapshot(doc(db, 'artifacts', appId, 'users', data.partnerUid), (pSnap) => {
            if (pSnap.exists()) {
               const pData = pSnap.data();
               setPartnerData(pData);
               
               // NOTIFICATION SYSTÈME 1: SIGNAL DISCRET
               if (pData.pingToPartner && pData.pingToPartner > lastSeenPingRef.current) {
                  if (Date.now() - pData.pingToPartner < 60000) {
                     notify(`${pData.pseudo || 'Votre partenaire'} a très envie de vous... 🔥`, '🔔');
                     fireSystemNotification("Nouveau Signal 🔥", `${pData.pseudo || 'Votre partenaire'} a très envie de vous...`);
                  }
                  lastSeenPingRef.current = pData.pingToPartner;
               }

               // NOTIFICATION SYSTÈME 2: NOUVEAU MATCH
               const pLikes = pData.likes || [];
               const newlyLiked = pLikes.filter(id => !prevPartnerLikesRef.current.includes(id));
               newlyLiked.forEach(likedId => {
                 if (myLikesRef.current.includes(likedId)) {
                    notify("NOUVEAU MATCH PARFAIT !", "🔥");
                    fireSystemNotification("Nouveau Match ! 🔥", `${pData.pseudo || 'Votre partenaire'} a aimé la même position que vous !`);
                 }
               });
               prevPartnerLikesRef.current = pLikes;
            }
          });

          // NOTIFICATION SYSTÈME 3: CHAT GLOBAL
          const chatId = [user.uid, data.partnerUid].sort().join('_');
          const chatRef = collection(db, 'artifacts', appId, 'chats', chatId, 'messages');
          const qChat = query(chatRef, orderBy('createdAt', 'desc'), limit(1));
          unsubGlobalChat = onSnapshot(qChat, (cSnap) => {
             if (!cSnap.empty) {
                const msg = cSnap.docs[0].data();
                if (msg.uid === data.partnerUid && msg.createdAt > Date.now() - 5000) {
                   notify("Nouveau message secret 💌", "💬");
                   fireSystemNotification("Message Intime 💌", msg.text);
                }
             }
          });

          const partnerCustomCol = collection(db, 'artifacts', appId, 'users', data.partnerUid, 'customPositions');
          unsubPartnerCustom = onSnapshot(partnerCustomCol, (cSnap) => {
            const partnerPositions = cSnap.docs
              .map(d => ({ id: d.id, ...d.data(), isCustom: true, isPartner: true }))
              .filter(p => p.shared !== false); 
            setPartnerCustomPositions(partnerPositions);
          });
        } else {
          setPartnerCustomPositions([]);
          setPartnerData(null);
        }
      }
      setLoading(false);
    });

    const myCustomCol = collection(db, 'artifacts', appId, 'users', user.uid, 'customPositions');
    const unsubMyCustom = onSnapshot(myCustomCol, (snap) => {
      setMyCustomPositions(snap.docs.map(d => ({ id: d.id, ...d.data(), isCustom: true, isMine: true })));
    });

    return () => { unsubUser(); unsubPartner(); unsubPartnerCustom(); unsubGlobalChat(); };
  }, [user]);

  // --- LOGIQUE CATÉGORIES DYNAMIQUES ---
  const displayCategories = useMemo(() => {
    const baseCats = [...CATEGORIES];
    const baseIds = baseCats.map(c => c.id);
    const customIds = new Set();
    
    [...myCustomPositions, ...partnerCustomPositions].forEach(p => {
       if(p.cat && !baseIds.includes(p.cat)) customIds.add(p.cat);
    });

    const newCats = Array.from(customIds).map(id => ({
       id, icon: <FolderPlus size={14}/>, color: 'from-slate-700/40 to-slate-900/40', text: 'text-slate-300'
    }));

    return [...baseCats, ...newCats];
  }, [myCustomPositions, partnerCustomPositions]);

  // --- LOGIQUE FILTRAGE & TRI ---
  const allPositions = useMemo(() => [...FULL_CATALOG, ...myCustomPositions, ...partnerCustomPositions], [myCustomPositions, partnerCustomPositions]);

  const filteredPositions = useMemo(() => {
    let result = allPositions.filter(pos => {
      const matchSearch = pos.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpice = filterSpice === 0 || pos.spice === filterSpice;
      const matchPhysique = filterPhysique === 0 || pos.diff === filterPhysique;
      const matchCat = filterCat === 'Toutes' || pos.cat === filterCat;
      return matchSearch && matchSpice && matchPhysique && matchCat;
    });
    return result.sort((a, b) => {
      if (sortBy === 'spice') return b.spice - a.spice; 
      if (sortBy === 'diff') return a.diff - b.diff;    
      return a.name.localeCompare(b.name);              
    });
  }, [allPositions, searchQuery, filterSpice, filterPhysique, filterCat, sortBy]);

  const positionDuJour = useMemo(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return FULL_CATALOG[dayOfYear % FULL_CATALOG.length];
  }, []);

  const resetFilters = () => {
    setSearchQuery(''); setFilterSpice(0); setFilterPhysique(0); setFilterCat('Toutes'); setSortBy('az');
  };

  const notify = (msg, icon = '✨') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, icon }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // --- ACTIONS DUO ---
  const sendSignal = async () => {
    if (!user || !userData?.partnerUid) return;
    notify("Signal envoyé à votre partenaire !", "💌");
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { pingToPartner: Date.now() });
  };

  const updateMyMood = async (moodId) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { mood: moodId });
    notify("Humeur mise à jour", "🎭");
  };

  const logIntimacy = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { lastIntimacy: Date.now() });
    notify("Moment intime enregistré dans votre calendrier", "❤️");
  };

  const getDaysSinceIntimacy = () => {
    const myDate = userData?.lastIntimacy || 0;
    const partnerDate = partnerData?.lastIntimacy || 0;
    const maxDate = Math.max(myDate, partnerDate);
    if (maxDate === 0) return "Aucun moment enregistré";
    
    const days = Math.floor((Date.now() - maxDate) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui 🔥";
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
  };

  // --- LOGIN GOOGLE OBLIGATOIRE ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // L'utilisateur est connecté, le useEffect onAuthStateChanged se chargera du reste
    } catch (error) {
      console.error(error);
      notify("Erreur lors de la connexion", "❌");
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      notify("Votre navigateur ne supporte pas les notifications.", "❌");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        notify("Notifications activées avec succès !", "🔔");
      } else {
        notify("Permission refusée. Vérifiez vos paramètres.", "❌");
      }
    } catch (e) {
      notify("Erreur lors de l'activation.", "❌");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
    await updateDoc(userRef, { pseudo: profileForm.pseudo, bio: profileForm.bio, avatarUrl: profileForm.avatarUrl });
    setIsEditingProfile(false);
    notify("Profil mis à jour !", "👤");
  };

  const generateNewAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setProfileForm({ ...profileForm, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}&backgroundColor=1e293b` });
  };

  const handleLike = async (id) => {
    if (!user || !userData) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
    const isLiked = userData.likes?.includes(id);
    if (isLiked) {
      await updateDoc(userRef, { likes: userData.likes.filter(l => l !== id) });
    } else {
      await updateDoc(userRef, { likes: arrayUnion(id) });
      if (partnerData?.likes?.includes(id)) {
        notify("MATCH PARFAIT !", "🔥");
        fireSystemNotification("Match Parfait ! 🔥", "Vous avez la même envie...");
      }
    }
  };

  const handleOpenEdit = (pos) => {
    const isKnownCat = displayCategories.some(c => c.id === pos.cat);
    setNewPos({
      name: pos.name,
      cat: isKnownCat ? pos.cat : 'NEW',
      newCat: isKnownCat ? '' : pos.cat,
      desc: pos.desc,
      v: pos.v || '',
      diff: pos.diff,
      spice: pos.spice,
      shared: pos.shared !== false
    });
    setEditPosId(pos.id);
    setSelectedPosition(null);
    setShowDeleteConfirm(false);
    setIsCreating(true);
  };

  const handleSavePosition = async () => {
    if (!newPos.name || !newPos.desc) {
      notify("Veuillez remplir le nom et la description.", "⚠️");
      return;
    }
    
    let finalCat = newPos.cat;
    if (newPos.cat === 'NEW') {
      finalCat = newPos.newCat.trim() !== '' ? newPos.newCat.trim() : 'Personnalisé';
    }

    const posData = { 
      name: newPos.name, cat: finalCat, desc: newPos.desc, v: newPos.v, 
      diff: newPos.diff, spice: newPos.spice, shared: newPos.shared, authorId: user.uid 
    };

    if (editPosId) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customPositions', editPosId), posData);
      notify("Création modifiée !", "✏️");
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'customPositions'), { ...posData, createdAt: Date.now() });
      notify("Nouvelle position créée !", "🌟");
    }
    
    setIsCreating(false);
    setEditPosId(null);
    setNewPos({ name: '', cat: 'Face à face', newCat: '', desc: '', v: '', diff: 3, spice: 3, shared: true });
    
    setActiveTab('explorer');
  };

  const handleDeletePosition = async () => {
    if(!selectedPosition || !selectedPosition.isMine) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customPositions', selectedPosition.id));
    setSelectedPosition(null);
    setShowDeleteConfirm(false);
    notify("Création supprimée", "🗑️");
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput || partnerCodeInput.length !== 6) {
      notify("Code invalide", "❌");
      return;
    }

    if (partnerCodeInput === userData.pairCode) {
      notify("Vous ne pouvez pas vous lier à vous-même", "⚠️");
      return;
    }

    try {
      const q = query(collection(db, 'artifacts', appId, 'users'), where("pairCode", "==", partnerCodeInput));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        notify("Ce code n'appartient à personne. Vérifiez les lettres.", "❌");
        return;
      }

      const partnerDoc = querySnapshot.docs[0];
      const actualPartnerUid = partnerDoc.id;

      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      await updateDoc(userRef, { partnerUid: actualPartnerUid });
      notify("Liaison réussie !", "🔗");
      
    } catch (error) {
      notify("Une erreur est survenue lors de la recherche.", "❌");
    }
  };

  const handleUnlinkPartner = async () => {
    if (!user) return;
    if (window.confirm("⚠️ Attention : Voulez-vous vraiment vous séparer de ce partenaire ? Vous ne verrez plus vos données communes.")) {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      await updateDoc(userRef, { partnerUid: null });
      notify("Partenaire délié avec succès", "🔓");
    }
  };

  // --- LOGIQUE DU CHAT ---
  useEffect(() => {
    if (!isChatOpen || !user || !userData?.partnerUid) return;
    
    const chatId = [user.uid, userData.partnerUid].sort().join('_');
    const q = query(collection(db, 'artifacts', appId, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(50));
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsub();
  }, [isChatOpen, user, userData?.partnerUid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userData?.partnerUid) return;
    
    const chatId = [user.uid, userData.partnerUid].sort().join('_');
    const msgText = newMessage.trim();
    setNewMessage(''); 
    
    await addDoc(collection(db, 'artifacts', appId, 'chats', chatId, 'messages'), {
      text: msgText,
      uid: user.uid,
      createdAt: Date.now()
    });
  };

  const applyDiscreet = (text, type = 'desc') => discreetMode ? (type === 'title' ? "Masqué" : text.replace(/[a-zA-Z]/g, "x")) : text;

  const triggerGameResult = (type) => {
    let result = null;
    switch(type) {
      case 'truth': result = GAMES_DATA.truths[Math.floor(Math.random() * GAMES_DATA.truths.length)]; break;
      case 'dare': result = GAMES_DATA.dares[Math.floor(Math.random() * GAMES_DATA.dares.length)]; break;
      case 'dice':
        const action = GAMES_DATA.diceActions[Math.floor(Math.random() * GAMES_DATA.diceActions.length)];
        const zone = GAMES_DATA.diceZones[Math.floor(Math.random() * GAMES_DATA.diceZones.length)];
        const time = GAMES_DATA.diceDurations[Math.floor(Math.random() * GAMES_DATA.diceDurations.length)];
        result = `${action} ➔ ${zone} \n${time}`;
        break;
      case 'scenario':
        const place = GAMES_DATA.scenPlaces[Math.floor(Math.random() * GAMES_DATA.scenPlaces.length)];
        const role = GAMES_DATA.scenRoles[Math.floor(Math.random() * GAMES_DATA.scenRoles.length)];
        const twist = GAMES_DATA.scenTwists[Math.floor(Math.random() * GAMES_DATA.scenTwists.length)];
        result = `Lieu : ${place}\nRôle : ${role}\nTwist : ${twist}`;
        break;
      case 'roulette': result = GAMES_DATA.rouletteTasks[Math.floor(Math.random() * GAMES_DATA.rouletteTasks.length)]; break;
      case 'secret': result = GAMES_DATA.secretChallenges[Math.floor(Math.random() * GAMES_DATA.secretChallenges.length)]; break;
      default: break;
    }
    setGameResult(result);
  };

  // --- RENDU : CHARGEMENT ET LOGIN ---
  if (loading) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-rose-500"><Flame className="animate-pulse" size={48} /></div>;

  // NOUVEAU ECRAN DE LOGIN OBLIGATOIRE
  if (requireLogin) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-[999]">
        <Flame className="text-rose-500 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" size={64} />
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">KAMA<span className="text-rose-500">SYNC</span></h1>
        <p className="text-slate-400 mb-10 text-sm">Connectez-vous pour synchroniser vos données sur tous vos appareils sans rien perdre.</p>
        <button 
          onClick={handleGoogleLogin} 
          className="w-full max-w-xs bg-white text-slate-900 px-6 py-4 rounded-2xl font-black transition hover:bg-slate-200 shadow-xl shadow-white/10 flex items-center justify-center gap-3"
        >
          <LogIn size={20} /> Connexion avec Google
        </button>
      </div>
    );
  }

  const sharedLikes = allPositions.filter(p => userData?.likes?.includes(p.id) && partnerData?.likes?.includes(p.id));

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden" style={{ WebkitTapHighlightColor: 'transparent' }}>
      
      {/* HEADER GLOBAL AVEC SAFE AREA IOS */}
      <header 
        className="px-6 border-b border-white/5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl z-50 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}
      >
        <div className="flex items-center gap-2 text-rose-500 font-black text-2xl tracking-tighter">
          <Flame fill="currentColor" size={28} className="drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" /> 
          KAMA<span className="text-white">SYNC</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setDiscreetMode(!discreetMode)} className="text-slate-400 p-2">
            {discreetMode ? <EyeOff size={20} className="text-emerald-400" /> : <Eye size={20} />}
          </button>
        </div>
      </header>

      {/* TOASTS (Notifications) */}
      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none items-center w-full px-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 border border-white/10">
            <span className="text-lg">{n.icon}</span> {n.msg}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scroll relative" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
        
        {/* --- TAB 1: EXPLORER --- */}
        {activeTab === 'explorer' && (
          <div className="animate-in fade-in duration-500">
            <div className="px-6 py-8">
              <div 
                onClick={() => setSelectedPosition(positionDuJour)}
                className="bg-gradient-to-br from-rose-600 to-orange-500 rounded-3xl p-6 relative overflow-hidden cursor-pointer shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="flex items-center gap-2 text-white/80 text-xs font-black uppercase tracking-widest mb-3">
                  <Calendar size={14} /> Position du jour
                </div>
                <h2 className="text-2xl font-black text-white mb-1">
                  {discreetMode ? "Masqué" : positionDuJour.name}
                </h2>
                <p className={`text-white/80 text-sm line-clamp-2 ${discreetMode ? 'blur-sm select-none opacity-50' : ''}`}>
                  {applyDiscreet(positionDuJour.desc)}
                </p>
              </div>
            </div>

            <div className="px-6 mb-8 space-y-4">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" placeholder="Rechercher une position..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-4 pl-14 pr-4 outline-none focus:border-rose-500 text-base"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Filter size={12}/> Filtres & Tri
                  </span>
                  {(searchQuery || filterSpice > 0 || filterPhysique > 0 || filterCat !== 'Toutes' || sortBy !== 'az') && (
                    <button onClick={resetFilters} className="text-[10px] font-black text-rose-500 uppercase">Réinitialiser</button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-bold text-emerald-400 min-w-[120px] text-base">
                    <option value="az">Trier : A-Z</option>
                    <option value="spice">Trier : Plus épicé</option>
                    <option value="diff">Trier : Moins physique</option>
                  </select>
                  <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-300 min-w-[120px] text-base">
                    <option value="Toutes">Catégories</option>
                    {displayCategories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* RÉSULTATS */}
            {displayCategories.map(category => {
              if (filterCat !== 'Toutes' && category.id !== filterCat) return null;
              const categoryPositions = filteredPositions.filter(p => p.cat === category.id);
              if (categoryPositions.length === 0) return null;

              return (
                <section key={category.id} className="mb-10 px-6">
                  <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 mb-4 ${category.text}`}>
                    {category.icon} {category.id}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                    {categoryPositions.map(pos => {
                      const isMatch = userData?.likes?.includes(pos.id) && partnerData?.likes?.includes(pos.id);
                      return (
                        <div key={pos.id} onClick={() => setSelectedPosition(pos)} className={`relative snap-center shrink-0 w-48 bg-gradient-to-br ${category.color} border ${isMatch ? 'border-amber-500/50' : 'border-white/5'} rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] transition-all`}>
                          
                          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                            {pos.isPartner && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">De {partnerData?.pseudo || 'Partenaire'}</span>}
                            {pos.isMine && <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/30">Moi</span>}
                            {pos.isMine && pos.shared === false && <span className="bg-slate-800 text-slate-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-slate-700">Privé</span>}
                          </div>

                          <div className="flex justify-between items-start mb-4">
                             <div className="flex flex-col gap-1">
                               <div className="flex gap-0.5 mt-1">
                                 {[...Array(5)].map((_, i) => <div key={i} className={`w-1 h-1.5 rounded-full ${i < pos.spice ? 'bg-rose-500' : 'bg-white/10'}`}></div>)}
                               </div>
                             </div>
                             {isMatch ? <Star size={14} fill="#f59e0b" className="text-amber-500 mt-1" /> : userData?.likes?.includes(pos.id) && <Heart size={14} fill="#f43f5e" className="text-rose-500 mt-1" />}
                          </div>
                          <h3 className="font-bold text-base text-white mb-2 pr-6">{discreetMode ? "Masqué" : pos.name}</h3>
                          <p className={`text-[10px] text-white/50 line-clamp-3 ${discreetMode ? 'blur-[3px] opacity-40 select-none' : ''}`}>{applyDiscreet(pos.desc)}</p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* --- TAB 2: MINI JEUX COQUINS --- */}
        {activeTab === 'jeux' && !activeGame && (
          <div className="animate-in fade-in duration-500 p-6 mt-4">
             <div className="text-center mb-10">
               <Gamepad2 className="mx-auto text-purple-500 mb-4" size={48} />
               <h1 className="text-3xl font-black text-white mb-2">Zone de Jeux</h1>
               <p className="text-slate-400 text-sm">Choisissez votre expérience pour ce soir.</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
               <button onClick={() => setActiveGame('truthOrDare')} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex items-center justify-between group hover:bg-slate-800 transition">
                 <div>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-1"><Zap size={18} className="text-rose-500"/> Action ou Vérité</h3>
                  <p className="text-xs text-slate-400">Des confessions intimes et des défis charnels.</p>
                 </div>
                 <ChevronRight className="text-slate-700 group-hover:text-white" />
               </button>
               <button onClick={() => setActiveGame('loveDice')} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex items-center justify-between group hover:bg-slate-800 transition">
                 <div>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-1"><Dices size={18} className="text-amber-500"/> Dés de l'Amour</h3>
                  <p className="text-xs text-slate-400">Laissez le hasard dicter vos caresses.</p>
                 </div>
                 <ChevronRight className="text-slate-700 group-hover:text-white" />
               </button>
               <button onClick={() => setActiveGame('scenario')} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex items-center justify-between group hover:bg-slate-800 transition">
                 <div>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-1"><Shuffle size={18} className="text-purple-500"/> Scénario Aléatoire</h3>
                  <p className="text-xs text-slate-400">Lieu + Rôle + Twist inattendu.</p>
                 </div>
                 <ChevronRight className="text-slate-700 group-hover:text-white" />
               </button>
               <button onClick={() => setActiveGame('roulette')} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex items-center justify-between group hover:bg-slate-800 transition">
                 <div>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-1"><Timer size={18} className="text-pink-500"/> Roulette Préliminaires</h3>
                  <p className="text-xs text-slate-400">Des tâches sensorielles pour faire monter le désir.</p>
                 </div>
                 <ChevronRight className="text-slate-700 group-hover:text-white" />
               </button>
               <button onClick={() => setActiveGame('secretChallenge')} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left flex items-center justify-between group hover:bg-slate-800 transition">
                 <div>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-1"><Gift size={18} className="text-emerald-500"/> Défi Secret (24h)</h3>
                  <p className="text-xs text-slate-400">Un défi à accomplir en cachette.</p>
                 </div>
                 <ChevronRight className="text-slate-700 group-hover:text-white" />
               </button>
             </div>
          </div>
        )}

        {/* MODAL JEUX (FIX iOS Scroll) */}
        {activeTab === 'jeux' && activeGame && (
          <div className="absolute inset-0 bg-slate-950 z-10 animate-in slide-in-from-right duration-300 flex flex-col">
            <header className="px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
              <button onClick={() => { setActiveGame(null); setGameResult(null); }} className="text-slate-400 p-2 bg-slate-800 rounded-full hover:text-white"><ArrowLeft size={20}/></button>
              <div className="w-9"/>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col items-center justify-start pt-8 text-center custom-scroll">
              {activeGame === 'truthOrDare' && (
                <div className="w-full max-w-md">
                  <Zap size={64} className="text-rose-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-8">Action ou Vérité</h2>
                  {gameResult ? (
                    <div className="bg-rose-900/20 border border-rose-500/30 p-8 rounded-[2rem] animate-in zoom-in duration-300 mb-8">
                      <h3 className="text-xl font-bold text-white leading-relaxed">{gameResult}</h3>
                    </div>
                  ) : <p className="text-slate-400 mb-8">Osez révéler vos secrets ou passez à l'action.</p>}
                  <div className="flex gap-4">
                    <button onClick={() => triggerGameResult('truth')} className="flex-1 bg-slate-800 py-4 rounded-2xl font-black text-indigo-400 hover:bg-slate-700">VÉRITÉ</button>
                    <button onClick={() => triggerGameResult('dare')} className="flex-1 bg-rose-600 py-4 rounded-2xl font-black text-white shadow-lg shadow-rose-900/50 hover:bg-rose-500">ACTION</button>
                  </div>
                </div>
              )}
              {activeGame === 'loveDice' && (
                <div className="w-full max-w-md">
                  <Dices size={64} className="text-amber-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-8">Dés de l'Amour</h2>
                  {gameResult ? (
                    <div className="bg-amber-900/20 border border-amber-500/30 p-8 rounded-[2rem] animate-in zoom-in duration-300 mb-8">
                      <h3 className="text-xl font-bold text-white leading-relaxed whitespace-pre-line">{gameResult}</h3>
                    </div>
                  ) : <p className="text-slate-400 mb-8">Laissez les dés choisir votre prochaine étape.</p>}
                  <button onClick={() => triggerGameResult('dice')} className="w-full bg-amber-500 py-4 rounded-2xl font-black text-slate-900 shadow-lg shadow-amber-900/50 hover:bg-amber-400">LANCER LES DÉS</button>
                </div>
              )}
              {activeGame === 'scenario' && (
                <div className="w-full max-w-md">
                  <Shuffle size={64} className="text-purple-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-8">Scénario Aléatoire</h2>
                  {gameResult ? (
                    <div className="bg-purple-900/20 border border-purple-500/30 p-8 rounded-[2rem] animate-in zoom-in duration-300 mb-8">
                      <h3 className="text-lg font-bold text-white leading-relaxed whitespace-pre-line text-left">{gameResult}</h3>
                    </div>
                  ) : <p className="text-slate-400 mb-8">Prêts à jouer un rôle ce soir ?</p>}
                  <button onClick={() => triggerGameResult('scenario')} className="w-full bg-purple-600 py-4 rounded-2xl font-black text-white shadow-lg shadow-purple-900/50 hover:bg-purple-500">GÉNÉRER UN SCÉNARIO</button>
                </div>
              )}
              {activeGame === 'roulette' && (
                <div className="w-full max-w-md">
                  <Timer size={64} className="text-pink-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-8">Préliminaires</h2>
                  {gameResult ? (
                    <div className="bg-pink-900/20 border border-pink-500/30 p-8 rounded-[2rem] animate-in zoom-in duration-300 mb-8">
                      <h3 className="text-xl font-bold text-white leading-relaxed">{gameResult}</h3>
                    </div>
                  ) : <p className="text-slate-400 mb-8">Faites monter la température lentement.</p>}
                  <button onClick={() => triggerGameResult('roulette')} className="w-full bg-pink-600 py-4 rounded-2xl font-black text-white shadow-lg shadow-pink-900/50 hover:bg-pink-500">TOURNER LA ROULETTE</button>
                </div>
              )}
              {activeGame === 'secretChallenge' && (
                <div className="w-full max-w-md">
                  <Gift size={64} className="text-emerald-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-8">Défi Secret (24h)</h2>
                  {gameResult ? (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-8 rounded-[2rem] animate-in zoom-in duration-300 mb-8">
                      <h3 className="text-lg font-bold text-emerald-400 mb-4 uppercase text-[10px] tracking-widest">À réaliser d'ici demain</h3>
                      <p className="text-xl font-bold text-white leading-relaxed">{gameResult}</p>
                    </div>
                  ) : <p className="text-slate-400 mb-8">Tirez un défi personnel à accomplir en cachette de votre partenaire pour le/la surprendre plus tard.</p>}
                  <button onClick={() => triggerGameResult('secret')} className="w-full bg-emerald-600 py-4 rounded-2xl font-black text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-500">RÉVÉLER MON DÉFI</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: CONSEILS --- */}
        {activeTab === 'conseils' && (
          <div className="animate-in fade-in duration-500 p-6 mt-4">
            <h1 className="text-3xl font-black text-white mb-2">Le Guide Intime.</h1>
            <div className="grid grid-cols-1 gap-4 mt-8">
              {TIPS_DATA.map(tip => (
                <div key={tip.id} onClick={() => setSelectedTip(tip)} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-800/50">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">{tip.icon}</div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">{tip.title}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2">{tip.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 4: DUO AVANCÉ --- */}
        {activeTab === 'duo' && (
          <div className="animate-in fade-in duration-500 p-6 mt-4">
             <h1 className="text-3xl font-black text-white mb-8 text-center">Espace Duo</h1>
             
             {!userData?.partnerUid ? (
               <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-center mb-8">
                 <Users className="mx-auto mb-4 text-emerald-500" size={40} />
                 <p className="text-slate-400 text-sm mb-6">Associez vos comptes pour débloquer la communication intime et partager vos créations.</p>
                 <div className="bg-slate-950 p-4 rounded-xl mb-6">
                   <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Votre Code Unique</span>
                   <div className="text-2xl font-mono font-black text-white tracking-widest">{userData?.pairCode}</div>
                 </div>
                 <div className="flex gap-2">
                   {/* TEXT-BASE iOS ZOOM FIX */}
                   <input 
                     className="flex-1 bg-slate-800 border-none rounded-xl text-center font-mono uppercase text-white outline-none px-4 text-base"
                     placeholder="CODE PARTENAIRE"
                     value={partnerCodeInput}
                     onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                     maxLength={6}
                   />
                   <button onClick={handleLinkPartner} className="bg-emerald-600 px-6 py-3 rounded-xl font-bold text-white text-xs hover:bg-emerald-500 transition-all">LIER</button>
                 </div>
               </div>
             ) : (
               <div className="space-y-6">
                 
                 {/* NOUVEAU: RAPPEL DU CODE DUO */}
                 <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-[2rem] flex items-center justify-between shadow-lg">
                   <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Mon Code Unique</span>
                     <div className="text-lg font-mono font-black text-white tracking-widest">{userData?.pairCode}</div>
                   </div>
                   <div className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                     En Duo
                   </div>
                 </div>

                 {/* COMPTEUR INTIME & SIGNAL */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] text-center flex flex-col justify-center items-center">
                     <CalendarHeart className="text-rose-500 mb-2" size={24} />
                     <div className="text-xs text-slate-400 font-bold mb-1">Dernière fois</div>
                     <div className="text-lg font-black text-white mb-4">{getDaysSinceIntimacy()}</div>
                     <button onClick={logIntimacy} className="bg-slate-800 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-full transition w-full">On l'a fait !</button>
                   </div>
                   
                   <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 rounded-[2rem] text-center flex flex-col justify-center items-center cursor-pointer shadow-lg shadow-indigo-900/30 active:scale-95 transition" onClick={sendSignal}>
                     <BellRing className="text-white mb-2 animate-pulse" size={28} />
                     <div className="text-white font-black text-sm leading-tight">Envoyer un signal<br/>discret</div>
                     <div className="text-indigo-200 text-[9px] uppercase mt-2 font-bold tracking-widest">Je te veux</div>
                   </div>
                 </div>

                 {/* NOUVEAU: BOUTON CHAT PRIVÉ */}
                 <div 
                   onClick={() => setIsChatOpen(true)}
                   className="bg-slate-900 border border-slate-800 p-4 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all shadow-lg"
                 >
                   <div className="flex items-center gap-4">
                     <div className="bg-rose-500/20 p-3 rounded-full text-rose-500">
                       <MessageSquare size={24} />
                     </div>
                     <div>
                       <h3 className="font-bold text-white text-sm">Ouvrir le Chat Secret</h3>
                       <p className="text-slate-400 text-xs">Discutez en privé avec {partnerData?.pseudo || 'votre partenaire'}</p>
                     </div>
                   </div>
                   <ChevronRight className="text-slate-600" />
                 </div>

                 {/* HUMEUR DU JOUR */}
                 <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6">
                    <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest text-center flex items-center justify-center gap-2"><HeartHandshake size={16}/> Notre Humeur</h3>
                    
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center flex-1">
                        <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden mb-2">
                          <img src={userData?.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs font-bold text-slate-300">Moi</div>
                        {userData?.mood && MOODS.find(m => m.id === userData.mood) && (
                          <div className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 border ${MOODS.find(m => m.id === userData.mood).color}`}>
                            {MOODS.find(m => m.id === userData.mood).icon} {MOODS.find(m => m.id === userData.mood).label}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-slate-600 font-black px-4">VS</div>
                      
                      <div className="text-center flex-1">
                        <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden mb-2">
                          <img src={partnerData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=partner&backgroundColor=1e293b`} alt="Partner" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs font-bold text-slate-300">{partnerData?.pseudo || 'Partenaire'}</div>
                        {partnerData?.mood && MOODS.find(m => m.id === partnerData.mood) ? (
                          <div className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 border ${MOODS.find(m => m.id === partnerData.mood).color}`}>
                            {MOODS.find(m => m.id === partnerData.mood).icon} {MOODS.find(m => m.id === partnerData.mood).label}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold px-2 py-1 rounded-full mt-1 border border-slate-700 text-slate-500 bg-slate-800">
                            Mystère...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="text-[10px] font-bold text-slate-500 uppercase text-center mb-3 tracking-widest">Changer mon humeur</div>
                      <div className="grid grid-cols-2 gap-2">
                        {MOODS.map(mood => (
                          <button 
                            key={mood.id} 
                            onClick={() => updateMyMood(mood.id)}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all ${userData?.mood === mood.id ? mood.color : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                          >
                            {mood.icon} {mood.label}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>

                 <div className="text-center mb-2 mt-8">
                   <Star size={32} fill="currentColor" className="mx-auto text-amber-500 mb-2" />
                   <h2 className="text-xl font-black text-white">Vos Matchs Parfaits</h2>
                 </div>
                 
                 {sharedLikes.length === 0 ? (
                   <div className="text-center py-6 opacity-50 text-slate-400 text-sm border border-dashed border-slate-700 rounded-3xl p-6">
                     Aucun match pour le moment.
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-3">
                     {sharedLikes.map(pos => (
                       <div key={pos.id} onClick={() => setSelectedPosition(pos)} className="bg-slate-900 p-4 rounded-xl flex items-center justify-between cursor-pointer border border-amber-500/20">
                         <div className="flex items-center gap-3">
                           <Flame className="text-amber-500" size={18} />
                           <span className="font-bold text-sm text-white">{discreetMode ? "Masqué" : pos.name}</span>
                         </div>
                         <ChevronRight className="text-slate-600" size={16} />
                       </div>
                     ))}
                   </div>
                 )}

                 {/* BOUTON ÉVIDENT POUR DÉLIER LE PARTENAIRE */}
                 <div className="pt-8 pb-4">
                   <button 
                     onClick={handleUnlinkPartner} 
                     className="w-full bg-rose-600/20 border border-rose-500 text-rose-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2"
                   >
                     ⚠️ Délier mon partenaire
                   </button>
                 </div>

               </div>
             )}
          </div>
        )}

        {/* --- TAB 5: PROFIL --- */}
        {activeTab === 'profil' && (
          <div className="animate-in fade-in duration-500 p-6 mt-4">
            <h1 className="text-3xl font-black text-white mb-8">Mon Espace</h1>
            
            <div className="flex flex-col items-center mb-10 relative">
               <div className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-900 mb-4 overflow-hidden shadow-xl relative group cursor-pointer"
                    onClick={() => {
                      setProfileForm({ pseudo: userData?.pseudo || '', bio: userData?.bio || '', avatarUrl: userData?.avatarUrl || '' });
                      setIsEditingProfile(true);
                    }}>
                  <img src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}&backgroundColor=1e293b`} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 size={24} className="text-white" />
                  </div>
               </div>
               <h2 className="text-2xl font-black text-white mb-2">{userData?.pseudo || 'Anonyme'}</h2>
               <p className="text-slate-400 text-sm text-center max-w-xs">{userData?.bio || 'Explorateur de sensations...'}</p>
               
               <div className="flex flex-col w-full max-w-xs items-center gap-3 mt-6">
                 <button 
                   onClick={() => {
                     setProfileForm({ pseudo: userData?.pseudo || '', bio: userData?.bio || '', avatarUrl: userData?.avatarUrl || '' });
                     setIsEditingProfile(true);
                   }}
                   className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-full text-xs font-black transition border border-slate-700 hover:bg-slate-700 w-full"
                 >
                   <Edit2 size={14} /> Modifier mon profil
                 </button>

                 {/* NOUVEAU: BOUTON DEMANDE NOTIFICATIONS */}
                 <button 
                   onClick={requestNotificationPermission}
                   className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-black transition border shadow-lg w-full mt-2 ${notificationsEnabled ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-600/40' : 'bg-rose-600/20 text-rose-400 border-rose-500/50 hover:bg-rose-600/40'}`}
                 >
                   <BellRing size={14} /> 
                   {notificationsEnabled ? 'Notifications Activées' : 'Autoriser les notifications'}
                 </button>

                 {/* BOUTON INSTALLATION */}
                 <button 
                   onClick={() => setShowInstallTutorial(true)}
                   className="flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-400 px-5 py-3 rounded-full text-xs font-black transition border border-indigo-500/50 hover:bg-indigo-600/40 shadow-lg w-full"
                 >
                   <Smartphone size={14} /> Ajouter à l'écran d'accueil
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <Heart className="mx-auto text-rose-500 mb-2" size={24} />
                <div className="text-2xl font-black text-white">{userData?.likes?.length || 0}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Favoris</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center cursor-pointer hover:bg-slate-800 transition relative overflow-hidden group" onClick={() => {
                  setNewPos({ name: '', cat: 'Face à face', newCat: '', desc: '', v: '', diff: 3, spice: 3, shared: true });
                  setEditPosId(null);
                  setIsCreating(true);
              }}>
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-emerald-500"/>
                </div>
                <Plus className="mx-auto text-emerald-500 mb-2" size={24} />
                <div className="text-2xl font-black text-white">{myCustomPositions.length}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes Créations</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- BOTTOM NAV (Avec Safe Area d'iOS) --- */}
      <nav 
        className="fixed bottom-0 w-full bg-slate-950/95 backdrop-blur-2xl border-t border-slate-900 px-2 flex justify-between items-center z-40"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)', paddingTop: '0.75rem' }}
      >
        <button onClick={() => {setActiveTab('explorer'); setActiveGame(null);}} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'explorer' ? 'text-rose-500 scale-110' : 'text-slate-500'}`}><Compass size={22}/><span className="text-[8px] font-black uppercase">Catalogue</span></button>
        <button onClick={() => {setActiveTab('jeux'); setActiveGame(null);}} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'jeux' ? 'text-purple-500 scale-110' : 'text-slate-500'}`}><Gamepad2 size={24}/><span className="text-[8px] font-black uppercase">Jeux</span></button>
        <button onClick={() => {setActiveTab('conseils'); setActiveGame(null);}} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'conseils' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}><BookOpen size={22}/><span className="text-[8px] font-black uppercase">Guide</span></button>
        <button onClick={() => {setActiveTab('duo'); setActiveGame(null);}} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'duo' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}><Users size={22}/><span className="text-[8px] font-black uppercase">Duo</span></button>
        <button onClick={() => {setActiveTab('profil'); setActiveGame(null);}} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'profil' ? 'text-white scale-110' : 'text-slate-500'}`}><User size={22}/><span className="text-[8px] font-black uppercase">Moi</span></button>
      </nav>

      {/* --- MODALS --- */}

      {/* MODAL ADMIN POPUP (Le Message du Game Master) */}
      {adminPopupMessage && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.3)] relative overflow-hidden">
            <AlertTriangle className="absolute -top-6 -right-6 text-rose-500/10" size={150} />
            <h2 className="text-2xl font-black text-rose-500 mb-6 uppercase tracking-widest relative z-10">Message System</h2>
            <p className="text-lg text-white font-bold leading-relaxed mb-8 relative z-10 whitespace-pre-line">
              {adminPopupMessage}
            </p>
            <button 
              onClick={() => setAdminPopupMessage(null)} 
              className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-rose-500 transition relative z-10"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* NOUVEAU: MODAL DU CHAT */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
          <header className="px-6 flex items-center justify-between border-b border-white/5 bg-slate-950/90 backdrop-blur-xl z-10 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 p-2 bg-slate-900 rounded-full hover:text-white"><ArrowLeft size={20}/></button>
            <div className="flex flex-col items-center">
              <h2 className="font-black text-white tracking-tight flex items-center gap-2">
                {partnerData?.pseudo || 'Partenaire'}
              </h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Connexion sécurisée</span>
            </div>
            <div className="w-10"></div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 custom-scroll space-y-4 flex flex-col bg-slate-950" style={{ WebkitOverflowScrolling: 'touch' }}>
            {messages.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm space-y-4 opacity-50">
                  <MessageSquare size={48} className="text-slate-700" />
                  <p>Envoyez votre premier message...</p>
               </div>
            ) : (
               messages.map((msg, i) => {
                 const isMe = msg.uid === user?.uid;
                 return (
                   <div key={msg.id || i} className={`max-w-[80%] flex ${isMe ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                     <div className={`px-4 py-3 text-sm ${isMe ? 'bg-rose-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-slate-800 text-slate-200 rounded-r-2xl rounded-tl-2xl'}`}>
                       {msg.text}
                     </div>
                   </div>
                 );
               })
            )}
            {/* Élément invisible pour forcer le scroll vers le bas */}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900 shrink-0 flex gap-2 items-end" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
             <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message secret..."
                className="flex-1 bg-slate-900 border border-slate-800 text-white p-3 rounded-2xl outline-none text-base resize-none max-h-32 min-h-[50px] custom-scroll"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
             />
             <button type="submit" disabled={!newMessage.trim()} className="bg-rose-600 p-3.5 rounded-2xl text-white disabled:opacity-50 disabled:bg-slate-800 transition-colors shrink-0">
               <Send size={20} className={newMessage.trim() ? 'translate-x-0.5' : ''} />
             </button>
          </form>
        </div>
      )}

      {/* MODAL EDITION PROFIL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <header className="px-6 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
            <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 bg-slate-900 p-2 rounded-full"><ArrowLeft size={20}/></button>
            <h2 className="font-black text-white tracking-tight">Profil</h2>
            <div className="w-9"/>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
                  <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button onClick={generateNewAvatar} className="absolute bottom-0 right-0 bg-rose-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-950 hover:scale-110 transition">
                  <RefreshCw size={16} />
                </button>
              </div>
              <span className="text-xs text-slate-400 font-medium">Avatar aléatoire</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Pseudo</label>
                <input 
                  className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 p-4 rounded-xl outline-none text-white text-base" 
                  placeholder="Votre pseudonyme" value={profileForm.pseudo} onChange={(e) => setProfileForm({...profileForm, pseudo: e.target.value})} maxLength={20}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Biographie</label>
                <textarea 
                  className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 p-4 rounded-xl outline-none h-32 text-base leading-relaxed text-slate-300 resize-none" 
                  placeholder="Dites-en plus sur vous..." value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} maxLength={150}
                />
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-950 border-t border-slate-900" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            <button onClick={handleSaveProfile} className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition">Enregistrer</button>
          </div>
        </div>
      )}

      {/* MODAL POSITION DETAILS */}
      {selectedPosition && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="relative pb-8 px-6 bg-gradient-to-b from-rose-950/40 to-slate-950 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 3rem)' }}>
            <button onClick={() => {setSelectedPosition(null); setShowDeleteConfirm(false);}} className="absolute left-6 text-slate-400 bg-slate-900/50 p-2 rounded-full backdrop-blur-md hover:bg-slate-800 transition" style={{ top: 'max(env(safe-area-inset-top), 1.5rem)' }}><ArrowLeft size={20}/></button>
            
            {/* BOUTONS ACTIONS POUR SES PROPRES CRÉATIONS */}
            {selectedPosition.isMine && (
              <div className="absolute right-6 flex gap-2" style={{ top: 'max(env(safe-area-inset-top), 1.5rem)' }}>
                 <button onClick={() => handleOpenEdit(selectedPosition)} className="text-indigo-400 bg-indigo-900/40 p-2 rounded-full backdrop-blur-md border border-indigo-500/20 hover:bg-indigo-900/60 transition"><Edit3 size={18}/></button>
                 <button onClick={() => setShowDeleteConfirm(true)} className="text-rose-400 bg-rose-900/40 p-2 rounded-full backdrop-blur-md border border-rose-500/20 hover:bg-rose-900/60 transition"><Trash2 size={18}/></button>
              </div>
            )}

            <div className="text-center mt-6">
              <span className="inline-block px-3 py-1 bg-slate-900 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-500/20 mb-3">{selectedPosition.cat}</span>
              <h2 className="text-3xl font-black text-white leading-tight">{discreetMode ? "Masqué" : selectedPosition.name}</h2>
              {selectedPosition.isPartner && <div className="mt-2 text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1"><Users size={12}/> Création de {partnerData?.pseudo || 'votre partenaire'}</div>}
              {selectedPosition.isMine && selectedPosition.shared === false && <div className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1"><EyeOff size={12}/> Privé (non partagé)</div>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 custom-scroll" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '20px' }}>
            
            {showDeleteConfirm && (
              <div className="bg-rose-900/20 border border-rose-500/30 rounded-3xl p-6 mb-6 text-center animate-in zoom-in">
                <h3 className="text-white font-bold mb-4">Êtes-vous sûr de vouloir supprimer cette création ?</h3>
                <div className="flex gap-2">
                  <button onClick={handleDeletePosition} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold">Oui, Supprimer</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">Annuler</button>
                </div>
              </div>
            )}

            <div className={`space-y-6 ${discreetMode ? 'blur-md opacity-50 select-none' : ''}`}>
               <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <Info className="absolute -top-4 -right-4 text-white/5" size={120} />
                  <h4 className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Sparkles size={14}/> La Posture
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed relative z-10 whitespace-pre-line">{applyDiscreet(selectedPosition.desc)}</p>
               </div>

               {selectedPosition.v && (
                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-6">
                    <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                       <RefreshCw size={14}/> Variante & Astuce
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{applyDiscreet(selectedPosition.v)}</p>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Physique</span>
                <div className="flex justify-center gap-1.5">{[...Array(5)].map((_, i) => <div key={i} className={`w-3 h-3 rounded-full ${i < selectedPosition.diff ? 'bg-indigo-500' : 'bg-slate-800'}`}/>)}</div>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Intensité</span>
                <div className="flex justify-center gap-1.5">{[...Array(5)].map((_, i) => <div key={i} className={`w-3 h-3 rounded-full ${i < selectedPosition.spice ? 'bg-rose-500' : 'bg-slate-800'}`}/>)}</div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-950 border-t border-slate-900 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            <button onClick={() => handleLike(selectedPosition.id)} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${userData?.likes?.includes(selectedPosition.id) ? 'bg-slate-800 text-rose-500' : 'bg-rose-600 text-white'}`}>
              <Heart fill={userData?.likes?.includes(selectedPosition.id) ? "currentColor" : "none"} size={18} />
              {userData?.likes?.includes(selectedPosition.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREATION & EDITION */}
      {isCreating && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <header className="px-6 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
            <button onClick={() => {setIsCreating(false); setEditPosId(null);}} className="text-slate-400 bg-slate-900 p-2 rounded-full hover:text-white transition"><ArrowLeft size={20}/></button>
            <h2 className="font-black text-white">{editPosId ? 'Modifier' : 'Créer'}</h2>
            <div className="w-9"/>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '20px' }}>
            
            {/* BOUTON DE PARTAGE (PRIVÉ VS PARTENAIRE) */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
               <div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Visibilité</span>
                 <span className={`text-sm font-bold ${newPos.shared ? 'text-emerald-400' : 'text-slate-400'}`}>
                   {newPos.shared ? 'Partagée avec mon partenaire' : 'Privée (Moi uniquement)'}
                 </span>
               </div>
               <button 
                 onClick={() => setNewPos({...newPos, shared: !newPos.shared})} 
                 className={`w-14 h-8 rounded-full relative transition-colors ${newPos.shared ? 'bg-emerald-500' : 'bg-slate-700'}`}
               >
                 <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${newPos.shared ? 'translate-x-7' : 'translate-x-1'}`}/>
               </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nom de la position</label>
              <input className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 p-4 rounded-2xl outline-none text-white text-base" placeholder="Ex: Le Volcan..." value={newPos.name} onChange={(e) => setNewPos({...newPos, name: e.target.value})} />
            </div>

            {/* SELECTION CATÉGORIE + NOUVELLE */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catégorie</label>
              <select className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 p-4 rounded-2xl outline-none text-white text-base appearance-none" value={newPos.cat} onChange={(e) => setNewPos({...newPos, cat: e.target.value})}>
                {displayCategories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                <option value="NEW">+ Créer une nouvelle catégorie...</option>
              </select>
              
              {newPos.cat === 'NEW' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input className="w-full bg-indigo-900/20 border border-indigo-500/50 focus:border-indigo-400 p-4 rounded-2xl outline-none text-indigo-300 text-base placeholder:text-indigo-900/50" placeholder="Nom de votre nouvelle catégorie" value={newPos.newCat} onChange={(e) => setNewPos({...newPos, newCat: e.target.value})} autoFocus />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-3">Physique ({newPos.diff}/5)</label>
                <input type="range" min="1" max="5" value={newPos.diff} onChange={(e) => setNewPos({...newPos, diff: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-3">Intensité ({newPos.spice}/5)</label>
                <input type="range" min="1" max="5" value={newPos.spice} onChange={(e) => setNewPos({...newPos, spice: parseInt(e.target.value)})} className="w-full accent-rose-500" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description de la Posture</label>
              <textarea className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 p-5 rounded-2xl outline-none h-32 text-base leading-relaxed text-slate-300 resize-none" placeholder="Décrivez comment se placer..." value={newPos.desc} onChange={(e) => setNewPos({...newPos, desc: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variante (Optionnel)</label>
              <textarea className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-5 rounded-2xl outline-none h-24 text-base leading-relaxed text-slate-300 resize-none" placeholder="Une astuce ou variante pour pimenter..." value={newPos.v} onChange={(e) => setNewPos({...newPos, v: e.target.value})} />
            </div>

          </div>
          <div className="p-6 bg-slate-950 border-t border-slate-900" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
             <button onClick={handleSavePosition} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98]">
               {editPosId ? 'Enregistrer les modifications' : (newPos.shared ? 'Créer et Partager' : 'Créer Secrètement')}
             </button>
          </div>
        </div>
      )}

      {/* MODAL TIP */}
      {selectedTip && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="px-6 bg-slate-900/50" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
            <button onClick={() => setSelectedTip(null)} className="text-slate-400 bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition"><ArrowLeft size={20}/></button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-8 custom-scroll" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
             <h2 className="text-3xl font-black text-white mb-6 leading-tight">{selectedTip.title}</h2>
             <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">{selectedTip.content}</div>
          </div>
        </div>
      )}

      {/* MODAL INSTALLATION ECRAN ACCUEIL */}
      {showInstallTutorial && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="px-6 flex items-center justify-between border-b border-white/5 bg-slate-950/90 backdrop-blur-xl z-10 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)', paddingBottom: '1.25rem' }}>
            <button onClick={() => setShowInstallTutorial(false)} className="text-slate-400 p-2 bg-slate-900 rounded-full hover:text-white"><ArrowLeft size={20}/></button>
            <h2 className="font-black text-white tracking-tight">Installation</h2>
            <div className="w-10"></div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 custom-scroll space-y-6" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
            
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">🍏 Pour iOS (iPhone)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300 font-medium">
                <li>Ouvrez l'application <b>Safari</b> et allez sur <code>kama-sync.vercel.app</code></li>
                <li>Appuyez sur l'icône <b>Partager</b> (le carré avec la flèche vers le haut) en bas de l'écran.</li>
                <li>Faites défiler vers le bas et choisissez <b>Sur l'écran d'accueil</b>.</li>
                <li>Appuyez sur <b>Ajouter</b>.</li>
              </ol>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">🤖 Pour Android</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300 font-medium">
                <li>Ouvrez l'application <b>Chrome</b> et allez sur <code>kama-sync.vercel.app</code></li>
                <li>Appuyez sur les <b>trois petits points</b> en haut à droite.</li>
                <li>Sélectionnez <b>Ajouter à l'écran d'accueil</b> (ou Installer l'application).</li>
                <li>Appuyez sur <b>Installer</b>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}
