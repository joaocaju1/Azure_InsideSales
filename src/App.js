import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Removido Switch e useNavigate
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import Admin from './components/Admin';
import MemberPage from './components/MemberPage'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" />} /> {/* Rota de redirecionamento para o HomePage */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/membro" element={<MemberPage />} />
      </Routes>
    </Router>
  );
}

export default App;
