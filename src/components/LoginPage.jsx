// LoginPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import './LoginPage.css'; // Importando o arquivo CSS da LoginPage
import logo from './logo.png'; // Importando o logo da FCA

const config = {
  auth: {
    clientId: '885d20bd-4d91-433d-a370-fb48890a1343',
    authority: 'https://login.microsoftonline.com/6355709b-c2c3-4e21-af89-9a5471bfd3ea',
    redirectUri: 'http://localhost:3000',
  }
};

const msalInstance = new PublicClientApplication(config);

function LoginPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthentication = async () => {
            const accounts = msalInstance.getAllAccounts();

            if (accounts.length > 0) {
                navigate('/'); // Redireciona para a página HomePage se o usuário estiver autenticado
            }
        };

        checkAuthentication();
    }, [navigate]);
      
    const login = async () => {
        try {
            await msalInstance.initialize();
    
            const loginRequest = {
                scopes: ['openid', 'profile', 'User.Read'],
                interactionType: InteractionType.Popup,
            };
    
            const loginResponse = await msalInstance.loginPopup(loginRequest);
            console.log('Usuário logado:', loginResponse.account);
    
            // Enviar o username para o backend
            const username = loginResponse.account.username;
            const response = await fetch('http://localhost:3001/saveUsername', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }), // Verifique se o nome do campo está correto
            });
    
            const responseData = await response.json();
    
            if (response.ok) {
                const { token } = responseData;
                localStorage.setItem('token', token); // Armazena o token JWT retornado pelo backend
                navigate('/'); // Redireciona para a página HomePage após o login
            } else {
                console.error('Erro ao salvar username:', responseData);
            }
        } catch (error) {
            console.log('Erro ao fazer login:', error);
        }
    };
    
    
    return (
        <div className="login-page">
            <img src={logo} alt="FCA Logo" className="fca-logo" />
            {/* <h1>Aplicação React com autenticação Azure</h1> */}
            <button className="login-button" onClick={login}>
                {/* <img src={logo} alt="FCA Logo" className="button-logo" /> */}
                Conectar com Azure
            </button>
        </div>
    );
}

export default LoginPage;
