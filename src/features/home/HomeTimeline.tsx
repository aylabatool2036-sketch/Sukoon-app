import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Smile, BookOpen, Calendar, ShieldAlert, Wind, Settings, Play, X, Filter, SortDesc, SortAsc, AlertCircle, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { GuidedHomeFlow } from './GuidedHomeFlow';
import { MoodEntry, JournalEntry, FutureMeMessage, Mood } from '@/src/types';

export const HomeTimeline = ({ onSOS, setView }: { onSOS: () => void, setView: (v: any) => void }) => {
  const { lang, moods, journalEntries, sukoonMode, user, profile } = useAppStore();
  const [flowActive, setFlowActive] = useState(false);
  const [initialMood, setInitialMood] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [editingMood, setEditingMood] = useState<MoodEntry | null>(null);
  const [editNote, setEditNote] = useState('');
  const t = translations[lang];

  const handleStartFlow = (mood: string) => {
    setInitialMood(mood);
    setFlowActive(true);
  };

  const handleSaveMoodDirectly = React.useCallback(async (mood: string, intensity: number, note?: string) => {
    if (!user) return;
    const moodValue = 
      mood === 'okay' ? 'neutral' : 
      mood === 'low' ? 'sad' : 
      mood === 'stressed' ? 'stressed' :
      mood === 'anxious' ? 'anxious' :
      mood as Mood;

    await dbService.moods.save({
      uid: user.uid,
      mood: moodValue,
      intensity: Number(intensity) || 5,
      note: note || "",
      timestamp: new Date()
    });
  }, [user]);

  // Home only shows mood entries, not journal entries
  const timeline = useMemo(() => {
    return [...moods.map(m => ({ ...m, type: 'mood' as const }))].sort((a, b) => {
      const getT = (ts: any) => {
        if (ts instanceof Date) return ts.getTime();
        if (ts?.toDate) return ts.toDate().getTime();
        if (ts?.seconds) return ts.seconds * 1000;
        return 0;
      };
      return sortOrder === 'desc' ? getT(b.timestamp) - getT(a.timestamp) : getT(a.timestamp) - getT(b.timestamp);
    });
  }, [moods, sortOrder]);

  const handleUpdateMood = async () => {
    if (!editingMood || !user) return;
    try {
      await dbService.moods.update(editingMood.id!, { note: editNote });
      setEditingMood(null);
    } catch (error) {
      console.error(error);
    }
  };

  const sukoonIcon = (mood: string) => {
    switch (mood) {
      case 'stressed': return <AlertCircle className="w-8 h-8" />;
      case 'anxious': return <Wind className="w-8 h-8" />;
      case 'low': return <Heart className="w-8 h-8" />;
      case 'okay': return <Smile className="w-8 h-8" />;
      default: return <Smile className="w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <AnimatePresence mode="wait">
        {!flowActive ? (
          <motion.div 
            key="home-main" exit={{ opacity: 0 }}
            className="space-y-16"
          >
            {/* Step 1: Entry */}
	            <div className="text-center space-y-8 sm:space-y-12 pt-4 sm:pt-8">
              <div className="space-y-4">
                <h2 className={cn(
                  "text-sm font-bold uppercase tracking-widest",
                  sukoonMode ? "text-primary-strong/60" : "text-primary-soft"
                )}>
                  Salaam, {profile?.displayName?.split(' ')[0]}
                </h2>
                <h1 className={cn(
                  "text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight leading-tight transition-colors duration-1000",
                  sukoonMode ? "text-slate-100" : "text-gray-900"
                )}>
                  {t.feelingQuestion}
                </h1>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto px-4">
                {(['stressed', 'anxious', 'low', 'okay'] as const).map(m => (
                  <Card 
                    key={m} 
                    onClick={() => handleStartFlow(m)}
                    className={cn(
                      "p-4 sm:p-10 cursor-pointer transition-all active:scale-95 flex flex-col items-center gap-3 sm:gap-6 group hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden",
                      sukoonMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-gray-50 hover:border-primary-soft/20 text-gray-900"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[32px] flex items-center justify-center transition-all duration-500 shadow-inner z-10",
                      m === 'stressed' ? "bg-rose-50 text-rose-500" : 
                      m === 'anxious' ? "bg-amber-50 text-amber-500" :
                      m === 'low' ? "bg-indigo-50 text-indigo-500" :
                      "bg-emerald-50 text-emerald-500"
                    )}>
                       {sukoonIcon(m)}
                    </div>
                    <span className="font-bold text-base sm:text-2xl z-10">{t[m]}</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Mood Timeline — no journal entries here */}
            {timeline.length > 0 && (
              <div className="space-y-10 pt-16 border-t border-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 gap-4">
                   <div className="space-y-1">
                      <h3 className={cn("text-2xl font-serif font-bold tracking-tight", sukoonMode ? "text-slate-100" : "text-gray-900")}>Your Moods</h3>
                      <p className="text-gray-400 font-bold uppercase tracking-widest">{timeline.length} Entries</p>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} className="text-gray-500 rounded-full w-9 h-9">
                     {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                   </Button>
                </div>
                
                <div className={cn(
                  "space-y-8 relative before:absolute before:left-[15px] before:top-4 before:bottom-0 before:w-[2px] mx-4 pb-4",
                  "before:bg-gradient-to-b before:from-primary-soft/20 before:to-transparent"
                )}>
                  {timeline.map((item, i) => (
                    <motion.div 
                      key={item.id || i} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="relative pl-12"
                    >
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-2xl flex items-center justify-center z-10 shadow-lg",
                        sukoonMode ? "bg-slate-800 text-primary-soft shadow-slate-950" : "bg-pastel-green text-primary-soft shadow-emerald-100"
                      )}>
                        <Smile className="w-4 h-4" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1 opacity-70">
                          {format(
                            item.timestamp instanceof Date 
                              ? item.timestamp 
                              : (item.timestamp as any)?.toDate 
                                ? (item.timestamp as any).toDate() 
                                : (item.timestamp as any)?.seconds 
                                  ? new Date((item.timestamp as any).seconds * 1000) 
                                  : new Date(), 
                            'HH:mm • MMM d'
                          )}
                        </p>
                        <Card 
                          onClick={() => { setEditingMood(item as MoodEntry); setEditNote((item as MoodEntry).note || ""); }}
                          className={cn(
                            "p-6 border-0 shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer hover:-translate-y-0.5", 
                            sukoonMode ? "bg-slate-900/50" : "bg-white"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={cn("text-lg font-bold tracking-tight block", sukoonMode ? "text-slate-100" : "text-gray-800")}>
                                  Feeling {(item as MoodEntry).mood}
                                </span>
	                                {(item as MoodEntry).intensity !== undefined && (
	                                  <span className={cn(
	                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
	                                    (item as MoodEntry).intensity! >= 7 ? "bg-rose-50 text-rose-600 border border-rose-100" :
	                                    (item as MoodEntry).intensity! >= 4 ? "bg-amber-50 text-amber-600 border border-amber-100" :
	                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
	                                  )}>
	                                    Level {(item as MoodEntry).intensity}
	                                  </span>
	                                )}
                              </div>
                              {(item as MoodEntry).note && (
                                <p className="text-sm text-gray-500 mt-1 italic">"{(item as MoodEntry).note}"</p>
                              )}
                              <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to edit note
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <GuidedHomeFlow 
            lang={lang}
            initialMood={initialMood}
            onComplete={() => {
              setFlowActive(false);
              setInitialMood(null);
            }}
            onSaveMood={handleSaveMoodDirectly}
            onJournal={() => { setView('journal'); setFlowActive(false); }}
            onFutureMe={() => { setView('calm'); setFlowActive(false); }}
            onChat={() => { setView('chat'); setFlowActive(false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm"
            >
              <Card className="p-6 border-0 shadow-2xl relative overflow-hidden bg-white">
                <button 
                  onClick={() => setEditingMood(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-2"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Add a Note</h3>
                  <textarea 
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    placeholder="How was your day?"
                    className="w-full min-h-[100px] p-4 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-primary-soft/20 resize-none"
                  />
                  <Button onClick={handleUpdateMood} className="w-full">Save Note</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
