import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/src/lib/firebase'; // Import the Firebase app instance


import { Mic, Send, Play, Square, Trash2, Clock, Sparkles, MessageSquare, Loader2, Anchor } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { format } from 'date-fns';

export const FutureMeTab = () => {
  const { user, futureMeMessages, sukoonMode } = useAppStore();
  const [mode, setMode] = useState<'view' | 'composeText' | 'composeAudio'>('view');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleCreateText = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      await dbService.futureMe.save({
        uid: user.uid,
        type: 'text',
        content: text,
        tags: ['Reflection'], 
        prompt: text
      });
      setText('');
      setMode('view');
    } catch (e: any) {
      alert("Error saving: " + e.message);
    }
    setLoading(false);
  };

  const handleCreateAudio = async () => {
    if (!audioBlob || !user) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
                // Upload audio to Firebase Storage
        const audioRef = ref(storage, `futureMeAudio/${user.uid}/${Date.now()}.webm`);
        await uploadBytes(audioRef, audioBlob);
        const downloadURL = await getDownloadURL(audioRef);

        await dbService.futureMe.save({
          uid: user.uid,
          type: 'audio',
          content: downloadURL, // Store the download URL instead of base64
          tags: ['Voice Note'],
          prompt: 'A gentle reminder (Voice Note)'
        });
        

        
        setAudioBlob(null);
        setAudioUrl(null);
        setMode('view');
        setLoading(false);
      };
    } catch (e: any) {
      alert("Error saving: " + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {mode === 'view' ? (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => setMode('composeText')} className="rounded-full px-6 h-12">
                <MessageSquare className="w-4 h-4 mr-2" /> Write a Note
              </Button>
              <Button onClick={() => setMode('composeAudio')} variant="secondary" className="rounded-full px-6 h-12">
                <Mic className="w-4 h-4 mr-2" /> Record Audio
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {futureMeMessages.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center py-12">
                  <Anchor className={cn("w-12 h-12 mx-auto mb-4", sukoonMode ? "text-slate-700" : "text-gray-300")} />
                  <p className={cn(sukoonMode ? "text-slate-500" : "text-gray-400")}>You haven't left any messages for your future self yet.</p>
                </div>
              ) : (
                futureMeMessages.map((msg) => (
                  <Card key={msg.id} className={cn("p-8 border-0 shadow-lg relative overflow-hidden group transition-all", sukoonMode ? "bg-slate-800 text-slate-100" : "bg-primary-strong text-white")}>
                    <Anchor className="absolute top-0 right-0 w-32 h-32 opacity-5 -rotate-12 group-hover:scale-110 transition-transform" />
                    <p className="text-lg font-serif italic mb-6">"{msg.prompt || (msg.type === 'audio' ? "A voice reminder..." : msg.content.substring(0, 50) + '...')}"</p>
                    <div className="flex items-center justify-between relative z-10">
	                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
	                         {format(
	                           msg.createdAt instanceof Date 
	                             ? msg.createdAt 
	                             : (msg.createdAt as any)?.toDate 
	                               ? (msg.createdAt as any).toDate() 
	                               : (msg.createdAt as any)?.seconds 
	                                 ? new Date((msg.createdAt as any).seconds * 1000) 
	                                 : new Date(), 
	                           'MMM d'
	                         )}
	                       </span>
                       {msg.type === 'audio' ? (
                         <Button 
                           onClick={() => {
                             const audio = new Audio(msg.content);
                             audio.play().catch(e => console.error("Playback error:", e));
                           }}
                           variant="secondary" 
                           className={cn("h-10 px-4 border-0", sukoonMode ? "bg-slate-700 text-slate-100" : "bg-white/20 text-white")}
                         >
                           <Play className="w-4 h-4 mr-2 fill-current"/> Play
                         </Button>
                       ) : (
                         <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase drop-shadow-sm text-white">Note</div>
                       )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        ) : mode === 'composeText' ? (
          <motion.div key="composeText" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
            <Card className={cn("p-6", sukoonMode ? "bg-slate-900 border-slate-800" : "")}>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Dear Future Me..."
                className={cn(
                  "w-full min-h-[150px] p-4 text-lg border-0 rounded-xl focus:ring-2 outline-none resize-none",
                  sukoonMode ? "bg-slate-800 text-slate-100" : "bg-gray-50 text-gray-900"
                )}
              />
              <div className="flex justify-end gap-3 mt-4">
                 <Button variant="ghost" onClick={() => setMode('view')} className={sukoonMode ? "text-slate-300" : "text-gray-500"}>Cancel</Button>
                 <Button onClick={handleCreateText} disabled={!text.trim() || loading}>
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save for Future"}
                 </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="composeAudio" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
            <Card className={cn("p-10 text-center space-y-6", sukoonMode ? "bg-slate-900 border-slate-800" : "")}>
              <div className="flex justify-center">
                <div className="relative">
                  <AnimatePresence>
                    {recording && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-red-500 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={recording ? handleStopRecording : handleStartRecording}
                    className={cn(
                      "relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl",
                      recording ? "bg-red-500 text-white scale-110" : "bg-primary-soft/10 text-primary-soft hover:scale-105"
                    )}
                  >
                    {recording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                  </button>
                </div>
              </div>
              <p className={cn("font-medium", sukoonMode ? "text-slate-300" : "text-gray-400")}>
                {recording ? "Recording... Tap square to stop" : audioUrl ? "Recording Complete" : "Tap mic to start recording"}
              </p>
              
              {audioUrl && !recording && (
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => new Audio(audioUrl!).play()} className="gap-2">
                    <Play className="w-4 h-4 fill-current" /> Preview
                  </Button>
                </div>
              )}

              <div className="flex justify-center gap-3">
                 <Button variant="ghost" onClick={() => { setMode('view'); setAudioUrl(null); setAudioBlob(null); }} className={sukoonMode ? "text-slate-300" : "text-gray-500"}>Cancel</Button>
                 <Button onClick={handleCreateAudio} disabled={recording || !audioBlob || loading}>
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Voice Note"}
                 </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
