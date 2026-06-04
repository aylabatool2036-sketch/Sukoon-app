import { Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { ChatMessage } from '@/src/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  isTyping: boolean;
  error: string | null;
  helpText: string;
  inputPlaceholder: string;
  onSendMessage: (msg: string) => void;
  onClearHistory?: () => void;
}

export const ChatView = ({ messages, loading, isTyping, error, helpText, inputPlaceholder, onSendMessage, onClearHistory }: ChatViewProps) => {
  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] sm:h-[calc(100dvh-160px)] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-gray-50 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-slate-800 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Secure conversation</span>
        {messages.length > 0 && (
          <Button variant="secondary" size="sm" onClick={onClearHistory}
            className="h-6 px-3 rounded-full text-[9px] uppercase tracking-widest font-bold">
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Messages — flex-1 so it fills available space */}
      <MessageList messages={messages} loading={loading} isTyping={isTyping} helpText={helpText} />

      {/* Error */}
      {error && (
        <div className="px-4 py-2 flex-shrink-0">
          <div className="p-3 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-xl text-center border border-red-100">
            {error}
          </div>
        </div>
      )}

      {/* Input — always pinned to bottom */}
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={onSendMessage} disabled={loading || isTyping} placeholder={inputPlaceholder} />
      </div>
    </div>
  );
};
