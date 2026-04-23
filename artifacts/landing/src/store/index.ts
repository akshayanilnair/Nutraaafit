import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage, FoodLogEntry, UserProfile, WeightEntry } from "@/types";

interface UserState {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  updateWeight: (w: number) => void;
  reset: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (p) => set({ profile: p }),
      updateWeight: (w) => {
        const p = get().profile;
        if (!p) return;
        const heightM = p.height / 100;
        const bmi = +(w / (heightM * heightM)).toFixed(1);
        set({ profile: { ...p, weight: w, bmi } });
      },
      reset: () => set({ profile: null }),
    }),
    { name: "nutrafit-user" }
  )
);

interface FoodLogState {
  entries: FoodLogEntry[];
  add: (e: Omit<FoodLogEntry, "id" | "loggedAt">) => void;
  remove: (id: string) => void;
  clearDay: (date: string) => void;
}

export const useFoodLog = create<FoodLogState>()(
  persist(
    (set) => ({
      entries: [],
      add: (e) =>
        set((s) => ({
          entries: [
            ...s.entries,
            { ...e, id: crypto.randomUUID(), loggedAt: Date.now() },
          ],
        })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),
      clearDay: (date) => set((s) => ({ entries: s.entries.filter((x) => x.date !== date) })),
    }),
    { name: "nutrafit-foodlog" }
  )
);

interface WeightState {
  entries: WeightEntry[];
  add: (w: WeightEntry) => void;
}

export const useWeights = create<WeightState>()(
  persist(
    (set) => ({
      entries: [],
      add: (w) =>
        set((s) => {
          const filtered = s.entries.filter((e) => e.date !== w.date);
          return { entries: [...filtered, w].sort((a, b) => a.date.localeCompare(b.date)) };
        }),
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
