import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import Admin from './components/Admin';
import MemberPage from './components/MemberPage';
import CardDetails from './components/CardDetails';
import ControleLigacoes from './components/ControleLigacoes';
import PrivateRoute from './components/PrivateRoute'; // Certifique-se de que o caminho está correto
import ControleLigacoesCentral from './components/ControleLigacoesCentral';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas privadas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/membro"
          element={
            <PrivateRoute>
              <MemberPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/card/:cardId"
          element={
            <PrivateRoute>
              <CardDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/controleligacoes"
          element={
            <PrivateRoute>
              <ControleLigacoes />
            </PrivateRoute>
          }
        />

        {/* Redireciona para a HomePage se a rota não for encontrada */}
        <Route path="*" element={<Navigate to="/" />} />
     


      <Route 
        path="/controle-ligacoes-central" 
        element={
          <PrivateRoute>
            <ControleLigacoesCentral />
          </PrivateRoute>
        }
        />
 </Routes>
    </Router>
  );
}

export default App;
