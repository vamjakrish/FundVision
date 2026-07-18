import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { aiAPI } from '../../services/api';
import Logo from '../common/Logo';

const QUICK_PROMPTS = [
  'How do I donate?',
  'Show medical campaigns',
  'How are NGOs verified?',
  'What is FundVision?',
];

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm **FundBot** 👋 I'm here to help you discover campaigns, understand donations, and navigate FundVision. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const { data } = await aiAPI.chat(msg, history);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again shortly!" }]);
    }
    setLoading(false);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-brand shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-card-hover overflow-hidden flex flex-col max-h-[85vh]"
            style={{ height: minimized ? 'auto' : '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-brand p-4 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden p-1">
                <Logo variant="icon" height={28} className="rounded-md overflow-hidden" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">FundBot AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-white/75 text-xs">Always here to help</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setMinimized(p => !p)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="bg-slate-50 flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-gradient-brand'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white text-slate-700 shadow-sm rounded-tl-sm'}`}
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                        {[0, 1, 2].map(j => (
                          <motion.span key={j} className="w-2 h-2 bg-primary/40 rounded-full"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick prompts */}
                {messages.length <= 1 && (
                  <div className="bg-slate-50 px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                    {QUICK_PROMPTS.map(p => (
                      <button key={p} onClick={() => sendMessage(p)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors whitespace-nowrap">
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="bg-white border-t border-slate-100 p-3 flex gap-2 shrink-0">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center disabled:opacity-40 hover:shadow-glow transition-all"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}