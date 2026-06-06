import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Heart, Sparkles, BookOpen, Anchor, MessageCircle, ArrowRight, Loader2, Smile, AlertCircle, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { aiService } from '@/src/services/gemini';
import { translations } from '@/src/translations';
import { Language } from '@/src/types';

export const GuidedHomeFlow = ({
  lang,
  onComplete,
  onSaveMood,
  onJournal,
  onFutureMe,
  onChat,
  initialMood,
}: {
  lang: Language;
  onComplete: () => void;
  onSaveMood: (mood: string, intensity: number, note?: string) => void;
  onJournal: () => void;
  onFutureMe: () => void;
  onChat: () => void;
  initialMood?: string | null;
}) => {
  // Always start at 'entry' so user can set intensity before continuing
  const [step, setStep] = useState<'entry' | 'calm' | 'ai'>('entry');
  const [selectedMood, setSelectedMood] = useState(initialMood || '');
  const [intensity, setIntensity] = useState(5);
  const [aiResponse, setAIResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [isBreathingIn, setIsBreathingIn] = useState(true);
  const t = translations[lang];

  const onSaveMoodRef = useRef(onSaveMood);
  useEffect(() => { onSaveMoodRef.current = onSaveMood; }, [onSaveMood]);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => setIsBreathingIn(p => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAI = useCallback(async (mood: string, intens: number) => {
    setLoadingAI(true);
    try {
      const moodMap: Record<string, string> = { stressed: 'stressed', anxious: 'anxious', low: 'sad', okay: 'neutral' };
      const resp = await aiService.getReassurance(
        moodMap[mood] || mood,
        `I'm feeling ${mood} with intensity ${intens}/10`,
        lang
      );
      setAIResponse(resp.text || resp.error || "I'm here for you.");
    } catch {
      setAIResponse("Take a deep breath. I'm here.");
    } finally {
      setLoadingAI(false);
    }
  }, [lang]);

  const handleContinue = useCallback(() => {
    // Save mood + intensity only when user clicks Continue
    onSaveMoodRef.current(selectedMood, intensity);

    if (selectedMood === 'okay') {
      // Skip breathing for okay — go straight to AI
      setStep('ai');
      fetchAI(selectedMood, intensity);
    } else {
      setStep('calm');
    }
  }, [selectedMood, intensity, fetchAI]);

  const handleFinishBreathing = useCallback(() => {
    setStep('ai');
    fetchAI(selectedMood, intensity);
  }, [selectedMood, intensity, fetchAI]);

  const moods = [
    { key: 'stressed', label: t.stressed || 'Stressed', icon: <AlertCircle className="w-5 h-5" /> },
    { key: 'anxious', label: t.anxious || 'Anxious', icon: <Wind className="w-5 h-5" /> },
    { key: 'low', label: t.low || 'Low', icon: <Heart className="w-5 h-5" /> },
    { key: 'okay', label: t.okay || 'Okay', icon: <Smile className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-safe pb-5 flex items-center justify-between border-b border-gray-50 dark:border-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-strong rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-xl">Guided Flow</span>
        </div>
        <button onClick={onComplete} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-50 dark:bg-slate-900 flex-shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: step === 'entry' ? '33%' : step === 'calm' ? '66%' : '100%' }}
          className="h-full bg-primary-strong"
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto w-full min-h-full flex flex-col">
          <AnimatePresence mode="wait">

            {/* ENTRY — mood select + intensity */}
            {step === 'entry' && (
              <motion.div key="entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                  {t.feelingQuestion || 'How are you feeling?'}
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {moods.map((mood) => (
                    <button key={mood.key} onClick={() => setSelectedMood(mood.key)}
                      className={cn(
                        'p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 font-semibold text-sm',
                        selectedMood === mood.key
                          ? 'border-primary-strong bg-primary-soft/10 text-primary-strong scale-105 shadow-md'
                          : 'border-gray-100 bg-white hover:border-primary-soft text-gray-700'
                      )}>
                      {mood.icon}
                      {mood.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedMood && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-5 pt-4">
                      <div className="flex justify-between items-end">
                        <p className="text-base sm:text-lg font-serif font-bold text-left">How intense is this feeling?</p>
                        <span className="text-3xl font-bold text-primary-strong">{intensity}</span>
                      </div>

                      {/* Touch-friendly intensity buttons — works on Android WebView */}
                      <div className="flex gap-1.5 justify-between">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <button
                            key={n}
                            onClick={() => setIntensity(n)}
                            className={cn(
                              "flex-1 h-10 rounded-xl text-xs font-bold transition-all active:scale-95",
                              n <= intensity
                                ? "bg-primary-strong text-white shadow-sm"
                                : "bg-gray-100 text-gray-400"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span>Mild</span>
                        <span>Moderate</span>
                        <span>Overwhelming</span>
                      </div>

                      <Button onClick={handleContinue} className="w-full py-5 text-base sm:text-lg mt-2">
                        Continue <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* CALM — breathing */}
            {step === 'calm' && (
              <motion.div key="calm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full space-y-10 text-center">
                <div className="space-y-6">
                  <motion.div
                    animate={{ scale: isBreathingIn ? 1.3 : 1 }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                    className="w-32 h-32 rounded-full bg-primary-soft/20 border-4 border-primary-soft/40 mx-auto flex items-center justify-center">
                    <Wind className="w-10 h-10 text-primary-strong" />
                  </motion.div>
                  <p className="text-xl font-semibold text-gray-700">
                    {isBreathingIn ? (t.breatheIn || 'Breathe In') : (t.breatheOut || 'Breathe Out')}
                  </p>
                  <p className="text-sm text-gray-400">{t.breathePrompt || 'Slow breath in for 4… hold… out for 6.'}</p>
                </div>
                <Button onClick={handleFinishBreathing} className="w-full py-5">
                  {t.done || 'Done'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* AI RESPONSE */}
            {step === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-6">
	                <Card className="p-5 sm:p-8 border-0 shadow-sm bg-white min-h-[100px] flex items-center justify-center">
                  {loadingAI ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary-strong" />
                  ) : (
                    <p className="text-base sm:text-lg font-serif leading-relaxed text-gray-800 text-center">
                      {aiResponse}
                    </p>
                  )}
                </Card>

                {!loadingAI && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={onJournal}
                      className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-soft transition-all flex flex-col items-center gap-2 text-sm font-semibold text-gray-600">
                      <BookOpen className="w-5 h-5 text-primary-strong" /> Journal
                    </button>
                    <button onClick={onFutureMe}
                      className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-soft transition-all flex flex-col items-center gap-2 text-sm font-semibold text-gray-600">
                      <Anchor className="w-5 h-5 text-primary-strong" /> Future Me
                    </button>
                    <button onClick={onChat}
                      className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-soft transition-all flex flex-col items-center gap-2 text-sm font-semibold text-gray-600">
                      <MessageCircle className="w-5 h-5 text-primary-strong" /> Talk More
                    </button>
                    <button onClick={onComplete}
                      className="p-4 rounded-2xl bg-primary-strong text-white hover:opacity-90 transition-all flex flex-col items-center gap-2 text-sm font-semibold">
                      <Sparkles className="w-5 h-5" /> Done
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
