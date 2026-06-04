import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  disabled: boolean;
  placeholder: string;
}

export const ChatInput = ({ onSendMessage, disabled, placeholder }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-end gap-2 bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-2 shadow-inner border border-gray-100 dark:border-slate-700 focus-within:border-primary-soft/40 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-base leading-relaxed py-2 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 min-h-[40px] max-h-[120px]"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-strong text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 hover:bg-primary-strong/90 mb-1"
        >
          {disabled
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
      <p className="text-[10px] text-gray-300 dark:text-slate-600 text-center mt-1.5 font-medium">Enter to send · Shift+Enter for new line</p>
    </div>
  );
};
