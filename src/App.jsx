/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "./store/authStore";
import supabase from "./config/supabaseClient";
import React from "react";

import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import SignInUp from "./pages/SignInUp";
import HousingPage from "./pages/HousingPage";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Search from "./pages/Search";
import Settings from "./pages/Settings";

import { extendTheme, CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';

import { getUser } from "./functions/userQueries";
import { darkModeScheme } from "./constants/Constants";

function ColorSchemeSetting({ user }) {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setMode(user[0]?.theme_ld || 'system'); // Use the `user` prop directly
  }, [user, setMode]); // Include dependencies to avoid warnings

  if (!mounted) {
    return null;
  }

  return <></>;
}

const customTheme = extendTheme({
  colorSchemes: {
    dark: darkModeScheme
  },
});

const App = () => {
  const { session, setSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState([]);

  // All logic for loading the application
  const loadApp = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (!error) setSession(data.session);

    setLoading(false);
  };

  useEffect(() => {
    loadApp();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const fetchUserData = async () => {
        try {
          const userData = await getUser(session.user.id);
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser([]);
        }
      };

      fetchUserData();
    }
  }, [session]);

  if (loading) return null;

  return (
    <CssVarsProvider theme={customTheme}>
      <CssBaseline/>
      <ColorSchemeSetting
      user={user}
      />
      <Router>
        <div className="app-container">
          <Navbar />
          <main>
            <Routes>
              <Route
                path="/"
                element={session ? <Navigate to="/dashboard" /> : <LandingPage />}
              />
              <Route
                path="/signin"
                element={session ? <Navigate to="/dashboard" /> : <SignInUp />}
              />
              <Route
                path="/dashboard"
                element={session ? <Dashboard /> : <Navigate to="/signin" />}
              />
              <Route
                path="/settings"
                element={session ? <Settings /> : <Navigate to="/signin" />}
              />
              <Route path="/about" element={<About />} />
              <Route path="/search" element={<Search />} />
              <Route path="/housing/:housingId" element={<HousingPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CssVarsProvider>
  );
};

export default App;
