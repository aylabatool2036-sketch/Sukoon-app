import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  BookOpen, 
  CloudRain, 
  Anchor, 
  MessageSquare, 
  AlertCircle,
  ShieldAlert,
  Loader2,
  Trash2
} from 'lucide-react';

import { format } from 'date-fns';
import { useAppStore } from './store/useAppStore';
import { useAppInitialization } from './hooks/useAppInitialization';
import { dbService } from './services/firebase';
import { translations } from './translations';
import { cn, getFriendlyErrorMessage } from './lib/utils';

// UI Components
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

// Feature Components
import { HomeTimeline } from './features/home/HomeTimeline';
import { CalmSanctuary } from './features/calm/CalmSanctuary';
import { GeminiChat } from './features/chat/GeminiChat';

// --- Main App Component ---

export default function App() {
  useAppInitialization();
  const { user, profile, initializing, sukoonMode, lang } = useAppStore();
  const [view, setView] = useState<'home' | 'journal' | 'calm' | 'chat' | 'settings'>('home');
  const t = translations[lang];

  if (initializing) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-pastel-green dark:bg-slate-950">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-primary-strong mb-6"
        >
          <CloudRain className="w-16 h-16" />
        </motion.div>
        <p className="text-sm font-bold tracking-[0.3em] uppercase opacity-40">Breathe In... Breathe Out...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (profile && !profile.onboardingComplete) {
     return <OnboardingView onComplete={() => window.location.reload()} />;
  }

  return (
    <div 
      dir="ltr"
      className={cn(
        "h-[100dvh] w-screen transition-colors duration-1000 overflow-hidden relative flex flex-col",
        sukoonMode ? "bg-slate-950 text-slate-100" : "bg-pastel-green text-gray-900"
      )}>
      {sukoonMode && <div className="fixed inset-0 z-0 atmosphere opacity-30 pointer-events-none" />}
      
      {/* App Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-2 pointer-events-auto">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-md transform -rotate-12 transition-colors",
              sukoonMode ? "bg-primary-strong/30 border border-primary-strong/20" : "bg-primary-strong"
            )}>
               <CloudRain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight">Sukoon</span>
         </div>
      </header>

      {/* Main Content Area - Fixed vertical scrolling by ensuring flex-1 and overflow-y-auto */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-20 pb-28 px-4 sm:px-6 relative z-10 w-full scroll-smooth">
        <div className="max-w-4xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="min-h-full"
            >
              {view === 'home' && <HomeTimeline onSOS={() => setView('calm')} setView={setView} />}
              {view === 'calm' && <CalmSanctuary />}
              {view === 'chat' && <GeminiChat />}
              {view === 'journal' && <JournalView />}
              {view === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-10 pb-safe transition-all duration-500",
        sukoonMode 
          ? "bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" 
          : "bg-gradient-to-t from-white via-white/90 to-transparent"
      )}>
        <div className={cn(
          "max-w-md mx-auto flex items-center justify-between px-4 py-2 rounded-full shadow-2xl backdrop-blur-2xl border transition-all duration-500",
          sukoonMode 
            ? "bg-slate-900/95 border-white/5 shadow-black/40" 
            : "bg-white/95 border-black/5 shadow-black/10"
        )}>
          <NavButton icon={<HomeIcon />} label="Home" active={view === 'home'} onClick={() => setView('home')} sukoon={sukoonMode} />
          <NavButton icon={<BookOpen />} label="Journal" active={view === 'journal'} onClick={() => setView('journal')} sukoon={sukoonMode} />
          <NavButton icon={<CloudRain />} label="Calm" active={view === 'calm'} onClick={() => setView('calm')} sukoon={sukoonMode} />
          <NavButton icon={<MessageSquare />} label="Chat" active={view === 'chat'} onClick={() => setView('chat')} sukoon={sukoonMode} />
          <NavButton icon={<SettingsIcon />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} sukoon={sukoonMode} />
        </div>
      </nav>
    </div>
  );
}

// --- Sub-Views ---

const LoginView = () => {
  const [loggingIn, setLoggingIn] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError('');
    try {
      if (mode === 'signup') {
        await dbService.auth.signUpWithEmail(email, password);
      } else {
        await dbService.auth.loginWithEmail(email, password);
      }
    } catch(e: any) {
      setError(getFriendlyErrorMessage(e));
      setLoggingIn(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-pastel-green p-6 overflow-hidden relative">
      <BackgroundBlobs />
      <Card className="w-full max-w-sm p-10 border-0 shadow-2xl relative z-10 text-center space-y-10">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary-strong rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-primary-soft/30 rotate-12">
            <CloudRain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight">Sukoon</h1>
          <p className="text-gray-400 font-medium">Your sanctuary for mental clarity and emotional peace.</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-primary-soft transition-colors text-gray-900 placeholder-gray-400"
            required
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-primary-soft transition-colors text-gray-900 placeholder-gray-400"
            required
          />
          <Button 
            type="submit"
            disabled={loggingIn || !email || !password}
            className="w-full h-14 rounded-2xl"
          >
            {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>
        
        <div className="text-sm text-gray-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            className="text-primary-strong font-bold hover:underline"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe • Anonymous • Healing</p>
      </Card>
    </div>
  );
};

const JournalView = () => {
  const { user, lang, journalEntries, sukoonMode } = useAppStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    await dbService.journal.save({
      uid: user.uid,
      content,
      tags: ['Journal'] // Ensure tags are not empty if required by rules (though rules say optional, better safe)
    });
    setContent('');
    setLoading(false);
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2 px-1">
        <h2 className="text-4xl font-serif font-bold tracking-tight text-theme-primary">{t.journal}</h2>
        <p className="text-theme-secondary text-sm">A timeline of your reflections and deep thoughts.</p>
      </header>

      <Card className="p-6 shadow-sm border-0">
        <div className="space-y-4">
          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full min-h-[120px] p-4 text-lg border-0 rounded-xl focus:ring-2 focus:ring-primary-soft/20 outline-none resize-none input-theme placeholder-gray-400"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!content.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Write Entry"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {journalEntries.map(entry => (
          <Card key={entry.id} className={cn("p-8 hover:shadow-xl transition-all border-0 shadow-sm", sukoonMode ? "bg-slate-900/50" : "bg-white")}>
            <div className="flex justify-between items-start mb-4">
	              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
	                {format(
	                  entry.timestamp instanceof Date 
	                    ? entry.timestamp 
	                    : (entry.timestamp as any)?.toDate 
	                      ? (entry.timestamp as any).toDate() 
	                      : (entry.timestamp as any)?.seconds 
	                        ? new Date((entry.timestamp as any).seconds * 1000) 
	                        : new Date(), 
	                  'PPP'
	                )}
	              </span>
            </div>
            <p className={cn("text-xl font-serif leading-relaxed", sukoonMode ? "text-slate-200" : "text-gray-800")}>{entry.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { lang, setLang, sukoonMode, setSukoonMode, user, profile } = useAppStore();
  const [deleting, setDeleting] = useState(false);
  const t = translations[lang];

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await dbService.auth.deleteAccount();
      window.location.reload();
    } catch (e: any) {
      alert("Error deleting account: " + getFriendlyErrorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h2 className="text-4xl font-serif font-bold tracking-tight text-theme-primary">Settings</h2>
      <Card className="divide-y border-0 shadow-sm divide-theme">
        <div className="p-8 flex items-center justify-between">
           <div className="space-y-1">
              <p className="font-bold text-lg text-theme-primary">Language</p>
              <p className="text-xs text-theme-muted">Select your primary communication language.</p>
           </div>
           <select 
              value={lang} 
              onChange={async (e) => {
                const newLang = e.target.value as any;
                setLang(newLang);
                if (user && profile) {
                  await dbService.auth.createUserProfile({
                    ...profile,
                    preferredLanguage: newLang
                  });
                }
              }}
              className="border-0 rounded-xl px-4 py-2 font-bold text-sm outline-none ring-1 transition-all input-theme ring-transparent"
           >
             <option value="en">English</option>
             <option value="hi">Hindi</option>
             <option value="ur">Urdu</option>
           </select>
        </div>
        <div className="p-8 flex items-center justify-between">
           <div className="space-y-1">
              <p className="font-bold text-lg text-theme-primary">Sukoon Mode</p>
              <p className="text-xs text-theme-muted">Low-stimulation interface for overwhelmed moments.</p>
           </div>
           <div 
             onClick={async () => {
               const newMode = !sukoonMode;
               setSukoonMode(newMode);
               if (user && profile) {
                 await dbService.auth.createUserProfile({
                   ...profile,
                   silentMode: newMode
                 });
               }
             }}
             className={cn(
                "w-12 h-6 rounded-full transition-all cursor-pointer relative",
                sukoonMode ? "bg-primary-strong" : "bg-gray-200"
             )}
           >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                sukoonMode ? "right-1" : "left-1"
              )} />
           </div>
        </div>
        <div className="p-8 space-y-6">
           <div className="p-4 rounded-xl border border-theme bg-surface-raised text-[11px] leading-relaxed text-theme-muted">
             <p className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
               <ShieldAlert className="w-3 h-3" /> Medical Disclaimer
             </p>
             Sukoon is a wellness tool and does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. If you are in a crisis, please contact your local emergency services or a crisis hotline immediately.
           </div>

           <div className="space-y-3">
             <Button variant="secondary" onClick={() => dbService.auth.logout()} className="w-full">
               <LogOut className="w-4 h-4 mr-2" /> {t.logout}
             </Button>
             
             <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-100">
               {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
               Delete Account
             </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

const OnboardingView = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAppStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ displayName: '', preferredLanguage: 'en' as any });

  const steps = [
    { title: "Welcome to Sukoon", desc: "A sanctuary for your mind. Let's start by getting to know you." },
    { title: "What should we call you?", desc: "Your name will be kept private." },
    { title: "Select your language", desc: "Sukoon talks to you in your preferred language." }
  ];

  const handleFinish = async () => {
    if (!user) return;
    await dbService.auth.createUserProfile({
      uid: user.uid,
      email: user.email!,
      displayName: profile.displayName,
      preferredLanguage: profile.preferredLanguage,
      onboardingComplete: true,
      createdAt: new Date()
    });
    onComplete();
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-white p-6">
       <div className="max-w-sm w-full space-y-12 text-center">
          <div className="space-y-4">
             <h2 className="text-4xl font-serif font-bold tracking-tight">{steps[step].title}</h2>
             <p className="text-gray-400 font-medium">{steps[step].desc}</p>
          </div>

          <div className="min-h-[60px]">
             {step === 1 && (
               <input 
                 autoFocus
                 value={profile.displayName} 
                 onChange={e => setProfile({...profile, displayName: e.target.value})}
                 className="w-full border-b-2 border-gray-100 py-4 text-2xl font-serif outline-none focus:border-primary-soft transition-colors"
                 placeholder="Your name"
               />
             )}
             {step === 2 && (
               <div className="flex gap-2 justify-center">
                 {['en', 'hi', 'ur'].map(l => (
                   <button 
                     key={l} 
                     onClick={() => setProfile({...profile, preferredLanguage: l})}
                     className={cn(
                       "w-12 h-12 rounded-xl font-bold uppercase transition-all",
                       profile.preferredLanguage === l ? "bg-primary-strong text-white" : "bg-gray-100 text-gray-400"
                     )}
                   >
                     {l}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="flex gap-4">
             {step > 0 && <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>}
             <Button 
               onClick={() => step === 2 ? handleFinish() : setStep(s => s + 1)} 
               className="flex-1"
             >
               {step === 2 ? "Begin Journey" : "Next"}
             </Button>
          </div>
       </div>
    </div>
  );
}

// --- Helpers ---

const NavButton = ({ icon, label, active, onClick, sukoon }: { icon: any, label?: string, active: boolean, onClick: () => void, sukoon?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-2 rounded-xl transition-all relative overflow-hidden group w-14",
      active 
        ? (sukoon ? "text-primary-soft" : "text-primary-strong") 
        : (sukoon ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-700")
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
      active 
        ? (sukoon ? "bg-primary-strong/30 shadow-lg shadow-primary-strong/20" : "bg-primary-soft/20 shadow-lg shadow-primary-soft/10") 
        : "bg-transparent"
    )}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn("w-5 h-5", active && "scale-110") }) : icon}
    </div>
    {label && (
      <span className={cn(
        "text-[9px] font-bold mt-1 transition-all",
        active ? "opacity-100 uppercase tracking-wide" : "opacity-0 h-0 w-0 group-hover:opacity-100 overflow-hidden"
      )}>
        {label}
      </span>
    )}
  </button>
);

const BackgroundBlobs = () => (
  <div className="absolute inset-0 z-0 opacity-40">
    <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-20 -left-20 w-96 h-96 bg-primary-soft/30 rounded-full blur-[120px]" />
    <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-1/2 -right-20 w-[450px] h-[450px] bg-emerald-100 rounded-full blur-[140px]" />
  </div>
);

