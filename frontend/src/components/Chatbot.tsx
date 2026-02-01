import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { sendChatMessage } from "../api";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  // ✅ Scroll ONLY to bottom anchor
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ Auto-send example prompt from Dashboard
  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(text);
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ AI service is temporarily unavailable.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#050B2E] to-[#020617] flex justify-center items-center">
      <div className="w-full max-w-5xl h-[85vh] glass rounded-3xl flex flex-col overflow-hidden">

        {/* ================= MESSAGES ================= */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-24">
              Ask me anything about your studies ✨
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed
                break-words
                ${
                  msg.role === "user"
                    ? "bg-sky-500 text-white rounded-br-md"
                    : "bg-white/10 text-gray-100 rounded-bl-md"
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 whitespace-pre-wrap">{children}</p>
                    ),
                    code: ({ children }) => (
                      <code className="bg-black/30 px-1 rounded">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* 🔥 THE REAL SCROLL ANCHOR */}
          <div ref={bottomRef} />
        </div>

        {/* ================= INPUT ================= */}
        <form
          onSubmit={send}
          className="border-t border-white/10 bg-[#050B2E]/80 px-6 py-4"
        >
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your studies..."
              className="flex-1 bg-white/10 border border-sky-400/50 rounded-xl px-4 py-3
                         text-white placeholder-gray-400 focus:outline-none
                         focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-sky-500 text-white font-medium
                         hover:bg-sky-400 transition disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
