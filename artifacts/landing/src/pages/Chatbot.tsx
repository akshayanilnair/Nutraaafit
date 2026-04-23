import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Mic, Volume2, Sparkles, Trash2 } from "lucide-react";
import { useChat, useUser } from "@/store";
import { chatReply } from "@/lib/api";

const SUGGESTIONS = [
  "What's my BMI?",
  "How many calories should I eat?",
  "Best Indian breakfast for weight loss?",
  "Foods to avoid in diabetes?",
];

export default function Chatbot() {
  const profile = useUser((s) => s.profile);
  const messages = useChat((s) => s.messages);
  const add = useChat((s) => s.add);
  const clear = useChat((s) => s.clear);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    add({ role: "user", content: msg });
    setThinking(true);
    const reply = await chatReply(msg, profile);
    setThinking(false);
    add({ role: "assistant", content: reply });
    speak(reply);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text.replace(/\*/g, ""));
    u.lang = "en-IN";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN";
    setListening(true);
    r.onresult = (ev: any) => send(ev.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Nutrition Chat"
        description="Ask anything about Indian nutrition, your BMI or your goals."
        icon={<MessageCircle className="h-5 w-5" />}
        actions={
          messages.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
          ) : undefined
        }
      />

      <div className="flex h-[65vh] flex-col rounded-2xl border border-border bg-card shadow-soft">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-cool text-primary-foreground shadow-glow">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-4 font-display text-2xl font-bold">Aap kuch poochna chahte hain?</p>
              <p className="mt-1 text-sm text-muted-foreground">Try one of these:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-smooth hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {m.content.split("\n").map((line, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                ))}
                {m.role === "assistant" && (
                  <button onClick={() => speak(m.content)} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <Volume2 className="h-3 w-3" /> Read aloud
                  </button>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={startVoice} disabled={listening}>
              <Mic className={`h-4 w-4 ${listening ? "text-chili animate-pulse" : ""}`} />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about Indian foods, calories, BMI..."
            />
            <Button onClick={() => send()} disabled={!input.trim() || thinking} className="shadow-glow">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
