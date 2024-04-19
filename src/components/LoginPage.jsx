// LoginPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

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

            navigate('/'); // Redireciona para a página HomePage após o login
        } catch (error) {
            console.log('Erro ao fazer login:', error);
        }
    };

    return (
        <div>
            <h1>Aplicação React com autenticação Azure</h1>
            <button onClick={login}>Login com Azure</button>
        </div>
    );
}

export default LoginPage;
