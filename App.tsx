import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { supabase } from './services/supabaseClient';
import { DataService } from './services/dataService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setIsAuthenticated(!!data.session);
      DataService.setActiveUserId(data.session?.user?.id ?? null);
      window.dispatchEvent(new Event('studo_data_updated'));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      DataService.setActiveUserId(session?.user?.id ?? null);
      window.dispatchEvent(new Event('studo_data_updated'));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    DataService.setActiveUserId(null);
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        <Route 
          path="/dashboard/*" 
          element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </div>
  );
};

export default App;
