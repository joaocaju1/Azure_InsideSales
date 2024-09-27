import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const isAuthenticated = localStorage.getItem('token'); // Verifica se o token está armazenado no localStorage

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
