import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { UpcomingPage } from './pages/UpcomingPage';
import { AddPage } from './pages/AddPage';
import { ThingDetailPage } from './pages/ThingDetailPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={
        user ? <Navigate to="/" replace /> : <AuthPage />
      } />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<UpcomingPage />} />
        <Route path="all" element={<UpcomingPage showAll />} />
        <Route path="done" element={<UpcomingPage showDone />} />
        <Route path="add" element={<AddPage />} />
        <Route path="thing/:id" element={<ThingDetailPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
