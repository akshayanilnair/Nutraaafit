// Anonymous JWT bootstrap so each browser gets a persistent backend account.
const TOKEN_KEY = "nutrafit-token";
const EMAIL_KEY = "nutrafit-anon-email";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

let token: string | null = null;
let bootstrapPromise: Promise<string | null> | null = null;

export function getToken(): string | null {
  if (token) return token;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

function setToken(t: string) {
  token = t;
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {}
}

function randomCreds() {
  const id = crypto.randomUUID();
  return { email: `anon-${id}@nutrafit.local`, password: id };
}

export async function ensureToken(): Promise<string | null> {
  const existing = getToken();
  if (existing) return existing;
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const creds = randomCreds();
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      if (!res.ok) throw new Error(`register ${res.status}`);
      const data = (await res.json()) as { token?: string };
      if (data?.token) {
        setToken(data.token);
        try { localStorage.setItem(EMAIL_KEY, creds.email); } catch {}
        return data.token;
      }
      return null;
    } catch (e) {
      console.warn("anon auth bootstrap failed", e);
      return null;
    } finally {
      bootstrapPromise = null;
    }
  })();
  return bootstrapPromise;
}

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const t = (await ensureToken()) ?? getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
