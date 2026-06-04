import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, CloudMoon, Waves, Cloud as CloudIcon, CloudRain, Zap, Heart, User as UserIcon, Loader2, Sparkles, RefreshCw, Anchor } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { format } from 'date-fns';
import { FutureMeTab } from './FutureMeTab';

const THEMES = {
  ocean: { o1: 'bg-cyan-300/30', o2: 'bg-indigo-400/20', o3: 'bg-emerald-500/20', o4: 'bg-blue-600/10' },
  forest: { o1: 'bg-emerald-300/30', o2: 'bg-teal-400/20', o3: 'bg-lime-500/20', o4: 'bg-green-600/10' },
  sunset: { o1: 'bg-orange-300/30', o2: 'bg-rose-400/20', o3: 'bg-amber-500/20', o4: 'bg-pink-600/10' }
};

const EnhancedBackground = ({ sukoonMode, theme }: { sukoonMode: boolean, theme: keyof typeof THEMES }) => {
  const current = THEMES[theme];
  return (
    <div className={cn("fixed inset-0 -z-10 transition-colors duration-1000", sukoonMode ? "bg-slate-950" : "bg-slate-50")}>
      <motion.div animate={{ scale: [1,1.2,1], x: [0,100,0], y: [0,50,0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={cn("absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-[120px] mix-blend-multiply opacity-50", current.o1)} />
      <motion.div animate={{ scale: [1.2,1,1.2], x: [0,-120,0], y: [0,-80,0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className={cn("absolute top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full blur-[100px] mix-blend-multiply opacity-40", current.o2)} />
      <motion.div animate={{ scale: [1,1.3,1], x: [100,0,100], y: [-50,0,-50] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={cn("absolute -bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[110px] mix-blend-multiply opacity-40", current.o3)} />
      <div className={cn("absolute inset-0 opacity-10", sukoonMode ? "bg-[radial-gradient(#ffffff_1px,transparent_1px)]" : "bg-[radial-gradient(#000000_1px,transparent_1px)]")} style={{ backgroundSize: '40px 40px' }} />
    </div>
  );
};

// Web Audio API sound generators — no external URLs, works on Android
function createOceanSound(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 400;
  lowpass.Q.value = 0.5;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;

  // LFO for wave rhythm
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.4;
  lfo.connect(lfoGain);
  lfoGain.connect((lowpass.frequency as any));
  lfo.start();

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.35;

  source.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(gainNode);
  source.start();
  return gainNode;
}

function createRainSound(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 1200;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 8000;

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.25;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gainNode);
  source.start();
  return gainNode;
}

function createWindSound(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 600;
  bandpass.Q.value = 0.8;

  // LFO for wind gusts
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect((bandpass.frequency as any));
  lfo.start();

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.2;

  source.connect(bandpass);
  bandpass.connect(gainNode);
  source.start();
  return gainNode;
}

function createForestSound(ctx: AudioContext): AudioNode {
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.15;

  // Multiple bird-like tones
  const freqs = [520, 780, 1040, 660, 880];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const envGain = ctx.createGain();
    envGain.gain.value = 0;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3 + i * 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.08;
    lfo.connect(lfoG);
    lfoG.connect(envGain.gain);
    lfo.start();

    osc.connect(envGain);
    envGain.connect(gainNode);
    osc.start(ctx.currentTime + i * 0.5);
  });

  // Soft background noise
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 300;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(gainNode);
  noise.start();

  return gainNode;
}

const SOUND_CREATORS: Record<string, (ctx: AudioContext) => AudioNode> = {
  waves: createOceanSound,
  rain: createRainSound,
  wind: createWindSound,
  birds: createForestSound,
};

const Soundscapes = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioNode | null>(null);

  const sounds = [
    { id: 'waves', name: 'Ocean Waves', icon: Waves, color: 'text-blue-500' },
    { id: 'rain', name: 'Soft Rain', icon: CloudRain, color: 'text-indigo-400' },
    { id: 'wind', name: 'Mountain Wind', icon: Wind, color: 'text-slate-400' },
    { id: 'birds', name: 'Deep Forest', icon: CloudIcon, color: 'text-emerald-500' },
  ];

  const stopCurrent = () => {
    if (nodeRef.current) {
      try { (nodeRef.current as any).disconnect(); } catch {}
      nodeRef.current = null;
    }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
  };

  const toggle = (id: string) => {
    if (playing === id) {
      stopCurrent();
      setPlaying(null);
    } else {
      stopCurrent();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;
      const node = SOUND_CREATORS[id](ctx);
      node.connect(ctx.destination);
      nodeRef.current = node;
      setPlaying(id);
    }
  };

  useEffect(() => () => stopCurrent(), []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      {sounds.map(s => (
        <Card
          key={s.id}
          className={cn(
            "p-4 sm:p-8 border-0 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95",
            playing === s.id
              ? (sukoonMode ? "bg-primary-strong/20 ring-2 ring-primary-soft/50" : "bg-primary-soft/10 ring-2 ring-primary-soft/20")
              : (sukoonMode ? "bg-slate-900 hover:bg-slate-800" : "bg-white hover:bg-gray-50")
          )}
          onClick={() => toggle(s.id)}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={cn("p-4 rounded-2xl transition-colors", playing === s.id ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-800")}>
              <s.icon className={cn("w-8 h-8", playing === s.id ? s.color : "text-gray-300")} />
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", playing === s.id ? "text-primary-strong dark:text-primary-soft" : "text-gray-400")}>
              {s.name}
            </span>
            {playing === s.id && <span className="text-[10px] text-primary-strong font-bold uppercase tracking-widest animate-pulse">● Playing</span>}
          </div>
        </Card>
      ))}
    </div>
  );
};

const WallOfHope = ({ messages, sukoonMode, lang, user }: { messages: any[], sukoonMode: boolean, lang: string, user: any }) => {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const handlePost = async () => {
    if (!text.trim() || !user) return;
    setPosting(true);
    try {
      await dbService.wall.post(user.uid, text, lang);
      setText('');
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setPosting(false);
  };

  const handleLike = async (id: string, currentLikes: number) => {
    const nowLiked = !likedMap[id];
    setLikedMap(prev => ({ ...prev, [id]: nowLiked }));
    try {
      await dbService.wall.like(id, currentLikes, nowLiked);
    } catch {
      setLikedMap(prev => ({ ...prev, [id]: !nowLiked }));
    }
  };

  return (
    <div className="space-y-12">
      <Card className={cn("p-8 border-0 shadow-lg", sukoonMode ? "bg-slate-900" : "bg-white")}>
        <div className="flex gap-6 items-start">
          <div className="w-12 h-12 rounded-full bg-primary-soft/10 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-primary-strong" />
          </div>
          <div className="flex-1 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Leave a message of hope for someone else..."
              className={cn("w-full min-h-[120px] p-4 text-lg font-serif border-0 rounded-2xl outline-none resize-none",
                sukoonMode ? "bg-slate-800 text-slate-100" : "bg-gray-50 text-gray-900")}
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={!text.trim() || posting} className="rounded-full px-8">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Hope"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {messages.map((m) => {
          const hasLiked = likedMap[m.id!];
          return (
            <motion.div layout key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={cn("p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary-soft/10 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary-strong" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Anonymous</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-strong/60">{m.authorLang}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {format(m.createdAt instanceof Date ? m.createdAt : (m.createdAt as any)?.toDate ? (m.createdAt as any).toDate() : (m.createdAt as any)?.seconds ? new Date((m.createdAt as any).seconds * 1000) : new Date(), 'MMM d')}
                  </span>
                </div>
              </div>
              <p className="text-xl font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed pl-2 mb-8 border-l-2 border-primary-soft/20 py-1">
                "{m.text}"
              </p>
              <button
                onClick={() => handleLike(m.id!, m.likes || 0)}
                className={cn(
                  "flex items-center gap-2 font-bold text-sm transition-colors px-4 py-2 rounded-full cursor-pointer",
                  hasLiked ? "bg-red-50/50 dark:bg-red-900/10 text-red-500" : "text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-slate-800"
                )}
              >
                <Heart className={cn("w-4 h-4 transition-transform active:scale-125", hasLiked ? "text-red-500 fill-current" : "")} />
                <span>{m.likes || 0}</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const DistractTasks = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [task, setTask] = useState<'rhythm' | 'facts' | 'breathing' | 'none'>('none');
  const [count, setCount] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [breathState, setBreathState] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    if (task !== 'breathing') return;
    const sequence = async () => {
      setBreathState('inhale'); await new Promise(r => setTimeout(r, 4000));
      setBreathState('hold'); await new Promise(r => setTimeout(r, 4000));
      setBreathState('exhale'); await new Promise(r => setTimeout(r, 4000));
      sequence();
    };
    sequence();
  }, [task]);

  const facts = [
    "A day on Venus is longer than its year.",
    "Wombats have cube-shaped poop.",
    "Octopuses have three hearts and blue blood.",
    "The Eiffel Tower can grow 15cm in summer.",
    "Honey never spoils — archaeologists found 3000-year-old honey still edible.",
    "A group of flamingos is called a 'flamboyance'.",
    "Sea otters hold hands when they sleep so they don't drift apart.",
    "The shortest war in history lasted only 38 minutes.",
    "A snail can sleep for three years.",
    "The heart of a shrimp is in its head.",
    "It is physically impossible for pigs to look up into the sky.",
    "An ostrich's eye is bigger than its brain.",
    "Sloths can hold their breath longer than dolphins.",
    "Koalas have fingerprints almost indistinguishable from humans.",
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Button variant={task === 'breathing' ? 'primary' : 'secondary'} className="h-14 sm:h-16 rounded-2xl gap-1 sm:gap-2 text-xs sm:text-sm px-2" onClick={() => setTask('breathing')}>
          <Wind className="w-4 h-4 flex-shrink-0" /><span className="truncate">Breathe</span>
        </Button>
        <Button variant={task === 'rhythm' ? 'primary' : 'secondary'} className="h-14 sm:h-16 rounded-2xl gap-1 sm:gap-2 text-xs sm:text-sm px-2" onClick={() => setTask('rhythm')}>
          <Zap className="w-4 h-4 flex-shrink-0" /><span className="truncate">Rhythm</span>
        </Button>
        <Button variant={task === 'facts' ? 'primary' : 'secondary'} className="h-14 sm:h-16 rounded-2xl gap-1 sm:gap-2 text-xs sm:text-sm px-2" onClick={() => setTask('facts')}>
          <RefreshCw className="w-4 h-4 flex-shrink-0" /><span className="truncate">Facts</span>
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {task === 'breathing' && (
          <motion.div key="breathing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center space-y-8">
            <Card className={cn("p-6 sm:p-12 min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <motion.div animate={{ scale: breathState === 'inhale' ? 1.4 : breathState === 'hold' ? 1.4 : 0.7, opacity: breathState === 'hold' ? 0.8 : 1 }}
                transition={{ duration: 4, ease: "easeInOut" }} className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-primary-soft/20 flex items-center justify-center relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary-soft/30 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base sm:text-xl font-bold uppercase tracking-widest text-primary-strong">
                    {breathState === 'inhale' ? 'Inhale' : breathState === 'hold' ? 'Hold' : 'Exhale'}
                  </span>
                </div>
              </motion.div>
              <p className="mt-8 sm:mt-12 text-gray-400 font-medium max-w-xs text-sm text-center">Follow the circle. Breathe in through your nose, hold, then slowly out.</p>
            </Card>
            <Button variant="ghost" onClick={() => setTask('none')}>Done</Button>
          </motion.div>
        )}
        {task === 'rhythm' && (
          <motion.div key="rhythm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
            <Card className={cn("p-12", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <div className="space-y-6">
                <h3 className="text-4xl font-bold">{count}</h3>
                <p className="text-gray-400">Tap to the rhythm of your heartbeat</p>
                <button onClick={() => setCount(c => c + 1)} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary-soft/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all mx-auto">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary-strong fill-current" />
                </button>
              </div>
            </Card>
            <Button variant="ghost" onClick={() => { setTask('none'); setCount(0); }}>Reset</Button>
          </motion.div>
        )}
        {task === 'facts' && (
          <motion.div key="facts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
            <Card className={cn("p-12", sukoonMode ? "bg-slate-900" : "bg-white")}>
              <div className="space-y-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-2xl font-serif leading-relaxed italic">"{facts[factIndex]}"</p>
                <Button onClick={() => setFactIndex((factIndex + 1) % facts.length)} variant="secondary" className="rounded-full px-8">Next Fact</Button>
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

  useEffect(() => {
    const unsub = dbService.wall.subscribe(setMessages);
    return () => unsub();
  }, []);

  return (
    <div className="relative min-h-screen">
      <EnhancedBackground sukoonMode={sukoonMode} theme={theme} />
      <div className="relative z-10 space-y-12 pb-24">
        <header className="text-center space-y-4 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft/10 text-primary-strong text-xs font-bold uppercase tracking-widest">
            <CloudMoon className="w-4 h-4" /> Safe Space
          </motion.div>
          <h1 className={cn("text-5xl font-serif font-bold", sukoonMode ? "text-slate-100" : "text-gray-900")}>The Sanctuary</h1>
          <p className="text-gray-400 max-w-lg mx-auto">A quiet corner of the world just for you. No noise, no pressure, just peace.</p>
        </header>

        <div className="flex justify-center gap-2 p-1 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl max-w-md mx-auto sticky top-4 z-50 shadow-sm">
          {(['sounds', 'wall', 'future', 'reset'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab ? "bg-white dark:bg-slate-800 text-primary-strong shadow-lg" : "text-gray-400 hover:text-gray-600 dark:hover:text-slate-200")}>
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
                        <button key={k} onClick={() => setTheme(k as any)}
                          className={cn("w-8 h-8 rounded-full border-2 transition-all",
                            theme === k ? "border-primary-strong scale-110 shadow-lg" : "border-transparent",
                            THEMES[k as keyof typeof THEMES].o1)} />
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
