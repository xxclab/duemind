import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Plus, LogOut, Settings, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="font-bold text-indigo-600 text-lg">DueMind</a>
          <div className="flex items-center gap-2">
            <a href="/channels" className="btn-ghost p-2" title="Channels">
              <Bell className="w-4 h-4" />
            </a>
            <a href="/settings" className="btn-ghost p-2" title="Settings">
              <Settings className="w-4 h-4" />
            </a>
            <button onClick={handleSignOut} className="btn-ghost p-2 text-gray-400" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <nav className="flex gap-1 border-b border-gray-200">
          {[
            { to: '/', label: 'Upcoming', end: true },
            { to: '/all', label: 'All', end: false },
            { to: '/done', label: 'Done', end: false },
          ].map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => navigate('/add')}
            className="px-4 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </nav>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
