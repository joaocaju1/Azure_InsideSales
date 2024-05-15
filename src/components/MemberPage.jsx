import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberPage.css';
import logo from './logoabaN.png'; // Certifique-se de que o caminho para a imagem esteja correto

const AccessDeniedPage = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="access-denied">
      <img src={logo} alt="Logo ABA" className="logo" />
      <p className="informativo">Você não tem acesso para acessar este conteúdo. Entre em contato com o administrador da página:</p>
      <p><a href="mailto:joao.genari@abainfra.com.br">joao.genari@abainfra.com.br</a></p>
      <button className="home-button" onClick={handleRedirect}>Página Inicial</button>
    </div>
  );
}

export default AccessDeniedPage;
