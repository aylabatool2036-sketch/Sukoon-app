import React from 'react';
import { motion } from 'motion/react';
import { Bot, User } from 'lucide-react';
import { cn, formatTime } from '@/src/lib/utils';
import { ChatMessage } from '@/src/types';

export const MessageItem = React.memo(({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[88%] sm:max-w-[80%] gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
          isUser ? "bg-primary-strong text-white" : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-primary-soft"
        )}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
        </div>
        <div className="space-y-1 min-w-0">
          <div className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary-strong text-white rounded-tr-sm"
              : "bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-tl-sm border border-gray-100 dark:border-slate-700"
          )}>
            {message.content}
          </div>
          <p className={cn(
            "text-[10px] font-medium text-gray-400 dark:text-slate-500 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
MessageItem.displayName = 'MessageItem';
