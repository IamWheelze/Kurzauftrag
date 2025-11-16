import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Tasks from './pages/Tasks';
import Elderly from './pages/Elderly';
import Forum from './pages/Forum';
import Donations from './pages/Donations';
import Jobs from './pages/Jobs';
import Businesses from './pages/Businesses';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Credits from './pages/Credits';
import Feedback from './pages/Feedback';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="elderly" element={<PrivateRoute><Elderly /></PrivateRoute>} />
        <Route path="forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
        <Route path="donations" element={<PrivateRoute><Donations /></PrivateRoute>} />
        <Route path="jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
        <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="credits" element={<PrivateRoute><Credits /></PrivateRoute>} />
        <Route path="feedback" element={<Feedback />} />
      </Route>
    </Routes>
  );
}

export default App;
