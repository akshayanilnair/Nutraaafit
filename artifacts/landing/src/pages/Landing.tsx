import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Camera,
  CalendarRange,
  ChefHat,
  HeartPulse,
  MessageCircle,
  Mic,
  TrendingUp,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { useUser } from "@/store";

const features = [
  { icon: Camera, title: "AI Food Scanner", desc: "Snap any thali — instant calories & macros." },
  { icon: CalendarRange, title: "Smart Meal Planner", desc: "Personalised by region, allergies & goals." },
  { icon: ChefHat, title: "Recipe AI", desc: "Turn what's in your kitchen into a dish." },
  { icon: HeartPulse, title: "Health Guidance", desc: "Eat right for diabetes, PCOS, BP & more." },
  { icon: Mic, title: "Voice Assistant", desc: "Just say “2 rotis and dal” — done." },
  { icon: MessageCircle, title: "AI Nutrition Chat", desc: "Ask anything, get expert answers." },
];

const stats = [
  { v: "150+", l: "Indian Foods" },
  { v: "4", l: "Regions Covered" },
  { v: "AI", l: "Personalised" },
  { v: "100%", l: "Free to Try" },
];

export default function Landing() {
  const profile = useUser((s) => s.profile);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) navigate("/dashboard", { replace: true });
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* nav */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cool shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">NutraFit</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/onboarding">Sign in</Link>
        </Button>
      </header>

      {/* hero */}
      <section className="container relative grid items-center gap-12 py-12 md:grid-cols-2 md:py-20">
        <div className="animate-slide-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
            <Leaf className="h-3.5 w-3.5 text-leaf" />
            AI-powered · Made for Indian cuisine
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Track your{" "}
            <span className="bg-gradient-warm bg-clip-text text-transparent">thali</span>,<br />
            transform your{" "}
            <span className="bg-gradient-cool bg-clip-text text-transparent">health</span>.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            NutraFit AI is the only nutrition tracker built for Indian food diversity — from poha
            to biryani. Scan, log, plan and chat with an AI nutritionist that actually gets your plate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/onboarding">
                Get started free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Explore features</a>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl font-bold text-primary">{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* hero visual */}
        <div className="relative animate-fade-in">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-hero opacity-20 blur-3xl" />
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today · 1,840 / 2,200 kcal</p>
                <p className="font-display text-3xl font-bold">Aap kaisa khaa rahe ho?</p>
              </div>
              <div className="flex h-12 w-12 animate-pulse-ring items-center justify-center rounded-full bg-gradient-warm">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { meal: "Breakfast", item: "Masala Dosa + Coconut Chutney", kcal: 390, color: "bg-turmeric/15 text-turmeric" },
                { meal: "Lunch", item: "Rajma Chawal + Salad", kcal: 540, color: "bg-leaf/15 text-leaf" },
                { meal: "Snack", item: "Roasted Chana + Chai", kcal: 190, color: "bg-accent/15 text-accent" },
                { meal: "Dinner", item: "2 Roti + Palak Paneer", kcal: 720, color: "bg-chili/15 text-chili" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${m.color}`}>{m.meal}</span>
                    <span className="text-sm font-medium">{m.item}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{m.kcal} kcal</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Protein", value: "82g", color: "bg-leaf" },
                { label: "Carbs", value: "240g", color: "bg-turmeric" },
                { label: "Fats", value: "62g", color: "bg-chili" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-secondary/40 p-3">
                  <div className={`mx-auto mb-2 h-1.5 w-12 rounded-full ${m.color}`} />
                  <p className="font-display text-xl font-bold">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">Everything an Indian foodie needs</h2>
          <p className="mt-3 text-muted-foreground">From the streets of Mumbai to your fitness journal.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-cool text-primary-foreground shadow-soft transition-smooth group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-glow md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              Your healthier plate starts today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Join NutraFit AI and turn every meal into measurable progress.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 shadow-card">
              <Link to="/onboarding">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="container border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with ♥ for Indian kitchens · NutraFit AI
      </footer>
    </div>
  );
}
