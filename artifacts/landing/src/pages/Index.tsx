import { Navigate } from "react-router-dom";
import Landing from "./Landing";
import { useUser } from "@/store";

export default function Index() {
  const profile = useUser((s) => s.profile);
  if (profile) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}
