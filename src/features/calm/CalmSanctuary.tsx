import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, CloudMoon, Waves, Cloud as CloudIcon, CloudRain, Zap, Heart, User as UserIcon, Loader2, Sparkles, MessageCircle, Play, Square, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { format } from 'date-fns';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

import { FutureMeTab } from './FutureMeTab';

const THEMES = {
  ocean: { 
    o1: 'bg-cyan-300/30', 
    o2: 'bg-indigo-400/20', 
    o3: 'bg-emerald-500/20', 
    d: { d1: 30, d2: 35, d3: 40 },
    name: 'Serene Ocean'
  },
  forest: { 
    o1: 'bg-emerald-200/40', 
    o2: 'bg-yellow-200/20', 
    o3: 'bg-teal-600/15', 
    d: { d1: 45, d2: 50, d3: 55 },
    name: 'Morning Forest'
  },
  nebula: { 
    o1: 'bg-fuchsia-500/20', 
    o2: 'bg-violet-400/15', 
    o3: 'bg-indigo-700/20', 
    d: { d1: 20, d2: 25, d3: 30 },
    name: 'Deep Space'
  },
  sunset: {
    o1: 'bg-orange-300/30',
    o2: 'bg-rose-400/20',
    o3: 'bg-amber-500/15',
    d: { d1: 35, d2: 40, d3: 45 },
    name: 'Golden Hour'
  }
};

const EnhancedBackground = ({ sukoonMode, theme }: { sukoonMode: boolean, theme: keyof typeof THEMES }) => {
  const t = THEMES[theme];
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <motion.div 
        animate={{ x: [0, 150, -50, 0], y: [0, 80, 120, 0], scale: [1, 1.4, 0.8, 1] }}
        transition={{ duration: t.d.d1, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[150px] transition-colors duration-1000", sukoonMode ? "bg-slate-900/50" : t.o1)}
      />
      <motion.div 
        animate={{ x: [0, -180, 80, 0], y: [0, 100, -60, 0], scale: [1, 1.5, 1.2, 1] }}
        transition={{ duration: t.d.d2, repeat: Infinity, delay: 5, ease: "easeInOut" }}
        className={cn("absolute top-[20%] -right-[15%] w-[65%] h-[65%] rounded-full blur-[130px] transition-colors duration-1000", sukoonMode ? "bg-slate-800/80" : t.o2)}
      />
      <motion.div 
        animate={{ x: [0, 120, -150, 0], y: [0, -150, 70, 0], scale: [1, 1.2, 1.4, 1] }}
        transition={{ duration: t.d.d3, repeat: Infinity, delay: 10, ease: "easeInOut" }}
        className={cn("absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000", sukoonMode ? "bg-purple-900/40" : t.o3)}
      />
    </div>
  );
};

const Soundscapes = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const tracks = [
    { id: 'white', title: "Zen Static", yt: "nMfPqeZjc2c", icon: <CloudIcon className="w-6 h-6" /> },
    { id: 'rain', title: "Twilight Rain", yt: "mPZkdNFkNps", icon: <CloudRain className="w-6 h-6" /> },
    { id: 'ocean', title: "Ebb & Flow", yt: "f77SKdyn-1Y", icon: <Waves className="w-6 h-6" /> },
    { id: 'birds', title: "Secret Forest", yt: "eKFTSSKCzWA", icon: <Wind className="w-6 h-6" /> }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tracks.map(track => (
        <Card 
          key={track.id}
          className={cn(
            "group overflow-hidden transition-all duration-500 relative",
            playingId === track.id ? "ring-2 ring-primary-soft shadow-2xl scale-[1.02]" : "hover:shadow-xl hover:-translate-y-1",
            sukoonMode && "bg-slate-900 border-slate-800"
          )}
        >
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                  playingId === track.id ? "bg-primary-strong text-white" : "bg-primary-soft/5 text-primary-soft shadow-inner"
                )}>
                  {track.icon}
                </div>
                <h3 className="font-bold text-xl tracking-tight">{track.title}</h3>
              </div>
              <Button
                variant={playingId === track.id ? 'primary' : 'secondary'}
                size="icon"
                onClick={() => setPlayingId(playingId === track.id ? null : track.id)}
                className="rounded-full w-12 h-12"
              >
                {playingId === track.id ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
              </Button>
            </div>

            <div className={cn(
              "aspect-video rounded-3xl bg-black overflow-hidden transition-all duration-700",
              playingId === track.id ? "opacity-100 max-h-[300px]" : "opacity-0 max-h-0"
            )}>
              {playingId === track.id && (
                <iframe 
                   src={`https://www.youtube.com/embed/${track.yt}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${track.yt}`}
                   className="w-full h-full opacity-60"
                   allow="autoplay"
                />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const WallOfHope = ({ messages, sukoonMode, lang, user }: { messages: any[], sukoonMode: boolean, lang: any, user: any }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('sukoon_liked_messages');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handlePost = async () => {
    if (!input.trim() || loading || !user) return;
    setLoading(true);
    try {
      await dbService.wall.post(user.uid, input.trim(), lang);
      setInput('');
    } catch (e: any) {
      alert("Error posting: " + e.message);
    }
    setLoading(false);
  };

  const handleLike = async (id: string, currentLikes: number) => {
    const hasLiked = likedMessageIds.has(id);
    
    // Update local state optimistically
    setLikedMessageIds(prev => {
      const newSet = new Set(prev);
      if (hasLiked) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('sukoon_liked_messages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    
    // Update database with the new like count
    try {
      await dbService.wall.like(id, currentLikes || 0, !hasLiked);
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on error
      setLikedMessageIds(prev => {
        const newSet = new Set(prev);
        if (hasLiked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        localStorage.setItem('sukoon_liked_messages', JSON.stringify(Array.from(newSet)));
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <Card className={cn("p-10 border-0 shadow-2xl shadow-primary-soft/10 overflow-hidden relative", sukoonMode ? "bg-slate-900" : "bg-white")}>
        {!sukoonMode && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-primary-soft to-indigo-400" />}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold">The Wall of Hope</h3>
            <p className="text-gray-400 text-sm italic">"Your words might be exactly what someone else needs to hear today."</p>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share a thought, a hope, or a tiny win..."
            className={cn(
              "w-full rounded-[24px] p-6 text-lg border-0 focus:ring-4 transition-all min-h-[140px]",
              sukoonMode ? "bg-slate-800 text-slate-200 focus:ring-slate-700" : "bg-gray-50 focus:ring-primary-soft/10 placeholder:text-gray-300"
            )}
          />
          <Button onClick={handlePost} disabled={!input.trim() || loading} className="w-full h-14 rounded-2xl text-base shadow-lg shadow-primary-soft/10">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Anonymously Share Hope"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin">
        {messages.map((m, i) => {
          const hasLiked = likedMessageIds.has(m.id!);
          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={cn(
                "p-8 rounded-[40px] border shadow-sm transition-all relative overflow-hidden group",
                sukoonMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 hover:shadow-2xl"
              )}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", sukoonMode ? "bg-slate-800" : "bg-primary-soft/10")}>
                  <UserIcon className={cn("w-5 h-5", sukoonMode ? "text-slate-500" : "text-primary-soft")} />
                </div>
                <div className="flex-1">
                  <p className={cn("font-bold", sukoonMode ? "text-slate-100" : "text-gray-900")}>Kind Stranger</p>
                  <div className="flex items-center gap-2">
	                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
	                      {m.authorLang} • {format(
	                        m.createdAt instanceof Date 
	                          ? m.createdAt 
	                          : (m.createdAt as any)?.toDate 
	                            ? (m.createdAt as any).toDate() 
	                            : (m.createdAt as any)?.seconds 
	                              ? new Date((m.createdAt as any).seconds * 1000) 
	                              : new Date(), 
	                        'MMM d'
	                      )}
	                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xl font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed pl-2 mb-8 border-l-2 border-primary-soft/20 py-1">
                "{m.text}"
              </p>
              <div className="flex justify-start">
	                 <button 
	                  onClick={() => handleLike(m.id!, m.likes || 0)}
	                  className={cn(
	                    "flex items-center gap-2 group/btn font-bold text-sm text-gray-400 transition-colors px-4 py-2 rounded-full cursor-pointer",
	                    hasLiked ? "bg-red-50/50 dark:bg-red-900/10 text-red-500" : "hover:text-red-500 bg-gray-50 dark:bg-slate-800"
	                  )}
	                 >
                   <Heart className={cn("w-4 h-4 transition-transform", hasLiked ? "text-red-500 fill-current" : "group-active/btn:scale-125", (m.likes > 0 && !hasLiked) && "text-red-400")} />
                   <span className={cn(hasLiked && "text-red-500")}>{m.likes || 0}</span>
                 </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const DistractTasks = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [task, setTask] = useState<'rhythm' | 'facts' | 'none'>('none');
  const [count, setCount] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  
  const facts = [
    "A day on Venus is longer than its year.",
    "Wombats have cube-shaped poop.",
    "Octopuses have three hearts and blue blood.",
    "The Eiffel Tower can grow 15cm in summer.",
    "Honey never spoils. archaeologists found 3000-year-old honey that is edible.",
    "A group of flamingos is called a 'flamboyance'.",
    "Sea otters hold hands when they sleep to keep from drifting apart.",
    "The shortest war in history lasted only 38 minutes.",
    "A snail can sleep for three years.",
    "The heart of a shrimp is located in its head.",
    "It is physically impossible for pigs to look up into the sky.",
    "A shark is the only known fish that can blink with both eyes.",
    "An ostrich's eye is bigger than its brain.",
    "Sloths can hold their breath longer than dolphins.",
    "Koalas have fingerprints that are almost indistinguishable from humans."
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex gap-4">
        <Button 
          variant={task === 'rhythm' ? 'primary' : 'secondary'} 
          className="flex-1 h-16 rounded-2xl gap-2"
          onClick={() => setTask('rhythm')}
        >
          <Zap className="w-5 h-5" /> Rhythm Tap
        </Button>
        <Button 
          variant={task === 'facts' ? 'primary' : 'secondary'} 
          className="flex-1 h-16 rounded-2xl gap-2"
          onClick={() => setTask('facts')}
        >
          <RefreshCw className="w-5 h-5" /> Random Facts
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {task === 'rhythm' && (
          <motion.div 
            key="rhythm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <Card className={cn("p-12", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <div className="space-y-6">
                <h3 className="text-4xl font-bold">{count}</h3>
                <p className="text-gray-400">Tap to the rhythm of your heartbeat</p>
                <button 
                  onClick={() => setCount(c => c + 1)}
                  className="w-32 h-32 rounded-full bg-primary-soft/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all mx-auto"
                >
                  <Heart className="w-12 h-12 text-primary-strong fill-current" />
                </button>
              </div>
            </Card>
            <Button variant="ghost" onClick={() => { setTask('none'); setCount(0); }}>Reset</Button>
          </motion.div>
        )}

        {task === 'facts' && (
          <motion.div 
            key="facts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <Card className={cn("p-12", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <div className="space-y-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-2xl font-serif leading-relaxed italic">
                  "{facts[factIndex]}"
                </p>
                <Button 
                  onClick={() => setFactIndex((factIndex + 1) % facts.length)}
                  variant="secondary"
                  className="rounded-full px-8"
                >
                  Next Fact
                </Button>
              </div>
            </Card>
            <Button variant="ghost" onClick={() => setTask('none')}>Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CalmSanctuary = () => {
  const { sukoonMode, lang, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'sounds' | 'wall' | 'future' | 'reset'>('sounds');
  const [theme, setTheme] = useState<keyof typeof THEMES>('ocean');
  const [messages, setMessages] = useState<any[]>([]);
  const t = translations[lang];

  useEffect(() => {
    const unsub = dbService.wall.subscribe(setMessages);
    return () => unsub();
  }, []);

  return (
    <div className="relative min-h-screen">
      <EnhancedBackground sukoonMode={sukoonMode} theme={theme} />
      
      <div className="relative z-10 space-y-12 pb-24">
        <header className="text-center space-y-4 pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft/10 text-primary-strong text-xs font-bold uppercase tracking-widest"
          >
            <CloudMoon className="w-4 h-4" />
            Safe Space
          </motion.div>
          <h1 className={cn("text-5xl font-serif font-bold", sukoonMode ? "text-slate-100" : "text-gray-900")}>
            The Sanctuary
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            A quiet corner of the world just for you. No noise, no pressure, just peace.
          </p>
        </header>

        <div className="flex justify-center gap-2 p-1 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl max-w-md mx-auto sticky top-4 z-50 shadow-sm">
          {(['sounds', 'wall', 'future', 'reset'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab 
                  ? "bg-white dark:bg-slate-800 text-primary-strong shadow-lg" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <main className="container max-w-5xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'sounds' && (
              <motion.div key="sounds" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-bold">Soundscapes</h2>
                    <div className="flex gap-2">
                      {Object.keys(THEMES).map(k => (
                        <button
                          key={k}
                          onClick={() => setTheme(k as any)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            theme === k ? "border-primary-strong scale-110 shadow-lg" : "border-transparent",
                            THEMES[k as keyof typeof THEMES].o1
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <Soundscapes sukoonMode={sukoonMode} />
                </div>
              </motion.div>
            )}
            
            {activeTab === 'wall' && (
              <motion.div key="wall" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <WallOfHope messages={messages} sukoonMode={sukoonMode} lang={lang} user={user} />
              </motion.div>
            )}

            {activeTab === 'future' && (
              <motion.div key="future" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <FutureMeTab />
              </motion.div>
            )}

            {activeTab === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DistractTasks sukoonMode={sukoonMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
