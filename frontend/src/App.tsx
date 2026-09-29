import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

// Each page is its own chunk so heavy dependencies (Recharts) load only where they're used.
const Apis = lazy(() => import("./pages/Apis"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LoadTests = lazy(() => import("./pages/LoadTests"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="apis" element={<Apis />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="load-tests" element={<LoadTests />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
