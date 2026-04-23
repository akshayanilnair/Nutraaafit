import { useEffect, useState } from "react";

interface Endpoint {
  method: string;
  path: string;
  desc: string;
}

const sections: { title: string; items: Endpoint[] }[] = [
  {
    title: "Auth",
    items: [
      { method: "POST", path: "/api/auth/register", desc: "Create account, returns JWT" },
      { method: "POST", path: "/api/auth/login", desc: "Login, returns JWT" },
      { method: "GET", path: "/api/me", desc: "Current user (auth required)" },
    ],
  },
  {
    title: "User Profile",
    items: [
      { method: "POST", path: "/api/user", desc: "Create or update profile (auto-BMI)" },
      { method: "GET", path: "/api/user", desc: "Fetch user" },
    ],
  },
  {
    title: "Food Logging",
    items: [
      { method: "POST", path: "/api/food", desc: "Log a meal" },
      { method: "GET", path: "/api/food", desc: "List logs" },
      { method: "POST", path: "/api/food/quick-log/:id", desc: "Re-log a previous entry" },
      { method: "DELETE", path: "/api/food/:id", desc: "Remove a log" },
      { method: "GET", path: "/api/food/search?q=", desc: "Search logged foods" },
      { method: "GET", path: "/api/food/recent", desc: "Recent unique foods" },
    ],
  },
  {
    title: "AI Features",
    items: [
      { method: "POST", path: "/api/scan-food", desc: "AI nutrition from food image" },
      { method: "POST", path: "/api/meal-plan", desc: "Indian meal plan" },
      { method: "POST", path: "/api/recipe", desc: "Recipe from ingredients" },
      { method: "POST", path: "/api/chat", desc: "Nutrition chatbot" },
      { method: "POST", path: "/api/health-guide", desc: "Foods to eat / avoid" },
    ],
  },
  {
    title: "Tracking & Goals",
    items: [
      { method: "GET", path: "/api/summary/daily", desc: "Daily totals" },
      { method: "GET", path: "/api/summary/range?days=7", desc: "Trend series + averages" },
      { method: "POST", path: "/api/weight", desc: "Log weight" },
      { method: "GET", path: "/api/weight", desc: "Weight history + trend" },
      { method: "POST", path: "/api/goals", desc: "Set targets" },
      { method: "GET", path: "/api/goals/progress", desc: "Today vs goals" },
      { method: "GET", path: "/api/streak", desc: "Logging streak" },
    ],
  },
];

const methodColor: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-sky-100 text-sky-700",
  DELETE: "bg-rose-100 text-rose-700",
};

function App() {
  const [status, setStatus] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    fetch("/api/healthz")
      .then((r) => (r.ok ? setStatus("ok") : setStatus("down")))
      .catch(() => setStatus("down"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-emerald-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold">
              N
            </div>
            <h1 className="text-3xl font-bold text-slate-900">NutraFit AI Backend</h1>
          </div>
          <p className="text-slate-600">
            AI-powered nutrition API for Indian cuisines. Pairs with the
            Lovable frontend at{" "}
            <a
              className="text-orange-600 underline"
              href="https://my-desi-nutrition.lovable.app"
              target="_blank"
              rel="noreferrer"
            >
              my-desi-nutrition.lovable.app
            </a>
            .
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "ok"
                  ? "bg-emerald-500"
                  : status === "down"
                  ? "bg-rose-500"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-slate-700">
              {status === "ok"
                ? "API healthy"
                : status === "down"
                ? "API unreachable"
                : "Checking..."}
            </span>
          </div>
        </header>

        <div className="space-y-6">
          {sections.map((s) => (
            <section
              key={s.title}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <h2 className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">
                {s.title}
              </h2>
              <ul className="divide-y divide-slate-100">
                {s.items.map((it) => (
                  <li
                    key={it.method + it.path}
                    className="px-5 py-3 flex items-start gap-4"
                  >
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                        methodColor[it.method] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {it.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <code className="text-sm text-slate-900 font-mono break-all">
                        {it.path}
                      </code>
                      <p className="text-sm text-slate-500 mt-0.5">{it.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-10 text-center text-sm text-slate-500">
          Send <code className="font-mono">Authorization: Bearer &lt;token&gt;</code> header to
          scope endpoints to a logged-in user.
        </footer>
      </div>
    </div>
  );
}

export default App;
