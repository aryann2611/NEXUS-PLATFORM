import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Apis from "./pages/Apis";
import Dashboard from "./pages/Dashboard";
import LoadTests from "./pages/LoadTests";
import Monitoring from "./pages/Monitoring";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

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
