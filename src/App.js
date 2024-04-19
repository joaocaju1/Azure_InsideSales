import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Removido Switch e useNavigate
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" />} /> {/* Rota de redirecionamento para o HomePage */}
      </Routes>
    </Router>
  );
}

export default App;
