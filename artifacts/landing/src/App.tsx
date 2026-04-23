import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FoodLogger from "./pages/FoodLogger";
import FoodScanner from "./pages/FoodScanner";
import MealPlanner from "./pages/MealPlanner";
import Recipes from "./pages/Recipes";
import HealthGuide from "./pages/HealthGuide";
import Progress from "./pages/Progress";
import Chatbot from "./pages/Chatbot";
import { useUser } from "@/store";

const queryClient = new QueryClient();

function Protected({ children }: { children: JSX.Element }) {
  const profile = useUser((s) => s.profile);
  if (!profile) return <Navigate to="/onboarding" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<FoodLogger />} />
            <Route path="/scanner" element={<FoodScanner />} />
            <Route path="/planner" element={<MealPlanner />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/health" element={<HealthGuide />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/chat" element={<Chatbot />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
