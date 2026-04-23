import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage, FoodLogEntry, UserProfile, WeightEntry } from "@/types";
import {
  createFoodLog,
  deleteFoodLog,
  fetchFoodLogs,
  fetchUser,
  fetchWeights,
  saveUser,
  saveWeight,
} from "@/lib/api";

interface UserState {
  profile: UserProfile | null;
  hydrated: boolean;
  setProfile: (p: UserProfile) => void;
  updateWeight: (w: number) => void;
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      hydrated: false,
      setProfile: (p) => {
        set({ profile: p });
        void saveUser(p);
      },
      updateWeight: (w) => {
        const p = get().profile;
        if (!p) return;
        const heightM = p.height / 100;
        const bmi = +(w / (heightM * heightM)).toFixed(1);
        const updated = { ...p, weight: w, bmi };
        set({ profile: updated });
        void saveUser(updated);
      },
      hydrate: async () => {
        const remote = await fetchUser();
        if (remote) {
          const local = get().profile;
          const merged = local ? { ...remote, gender: local.gender, likes: local.likes, dailyCalorieGoal: local.dailyCalorieGoal } : remote;
          set({ profile: merged, hydrated: true });
        } else {
          set({ hydrated: true });
          const local = get().profile;
          if (local) void saveUser(local);
        }
      },
      reset: () => set({ profile: null }),
    }),
    { name: "nutrafit-user" }
  )
);

interface FoodLogState {
  entries: FoodLogEntry[];
  hydrated: boolean;
  add: (e: Omit<FoodLogEntry, "id" | "loggedAt">) => void;
  remove: (id: string) => void;
  clearDay: (date: string) => void;
  hydrate: () => Promise<void>;
}

export const useFoodLog = create<FoodLogState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,
      add: (e) => {
        const tempId = `tmp-${crypto.randomUUID()}`;
        const optimistic: FoodLogEntry = { ...e, id: tempId, loggedAt: Date.now() };
        set((s) => ({ entries: [...s.entries, optimistic] }));
        void createFoodLog(e).then((created) => {
          if (!created) return;
          set((s) => ({
            entries: s.entries.map((x) => (x.id === tempId ? created : x)),
          }));
        });
      },
      remove: (id) => {
        set((s) => ({ entries: s.entries.filter((x) => x.id !== id) }));
        if (!id.startsWith("tmp-")) void deleteFoodLog(id);
      },
      clearDay: (date) => {
        const toDelete = get().entries.filter((x) => x.date === date);
        set((s) => ({ entries: s.entries.filter((x) => x.date !== date) }));
        for (const e of toDelete) {
          if (!e.id.startsWith("tmp-")) void deleteFoodLog(e.id);
        }
      },
      hydrate: async () => {
        const remote = await fetchFoodLogs();
        if (remote.length) {
          set({ entries: remote, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      },
    }),
    { name: "nutrafit-foodlog" }
  )
);

interface WeightState {
  entries: WeightEntry[];
  hydrated: boolean;
  add: (w: WeightEntry) => void;
  hydrate: () => Promise<void>;
}

export const useWeights = create<WeightState>()(
  persist(
    (set) => ({
      entries: [],
      hydrated: false,
      add: (w) => {
        set((s) => {
          const filtered = s.entries.filter((e) => e.date !== w.date);
          return { entries: [...filtered, w].sort((a, b) => a.date.localeCompare(b.date)) };
        });
        void saveWeight(w);
      },
      hydrate: async () => {
        const remote = await fetchWeights();
        if (remote.length) {
          set({ entries: remote, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      },
    }),
    { name: "nutrafit-weights" }
  )
);

interface ChatState {
  messages: ChatMessage[];
  add: (m: Omit<ChatMessage, "id" | "ts">) => void;
  clear: () => void;
}

export const useChat = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      add: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: crypto.randomUUID(), ts: Date.now() }],
        })),
      clear: () => set({ messages: [] }),
    }),
    { name: "nutrafit-chat" }
  )
);
