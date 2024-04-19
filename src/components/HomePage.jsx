// HomePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';

const config = {
  auth: {
    clientId: '885d20bd-4d91-433d-a370-fb48890a1343',
    authority: 'https://login.microsoftonline.com/6355709b-c2c3-4e21-af89-9a5471bfd3ea',
    redirectUri: 'http://localhost:3000',
  }
};

const msalInstance = new PublicClientApplication(config);

function HomePage() {
    const navigate = useNavigate();
    const [isMsalInitialized, setIsMsalInitialized] = useState(false);

    useEffect(() => {
        // Inicializar a instância do MSAL
        async function initializeMsal() {
            try {
                await msalInstance.initialize();
                setIsMsalInitialized(true);
            } catch (error) {
                console.log('Erro ao inicializar o MSAL:', error);
            }
        }
        
        initializeMsal();
    }, []);

    const handleLogout = async () => {
        try {
            // Garantir que o MSAL foi inicializado antes de fazer o logout
            if (!isMsalInitialized) {
                console.log('MSAL ainda não inicializado. Aguarde...');
                return;
            }

            await msalInstance.logoutPopup();
            navigate('/login'); // Redireciona para a página de login após o logout
        } catch (error) {
            console.log('Erro ao fazer logout:', error);
        }
    };

    return (
        <div style={{ backgroundColor: 'green', height: '100vh' }}> {/* Background vermelho */}
            <h1>Página Inicial</h1>
            <p>Bem-vindo à HomePage!</p>
            <button onClick={handleLogout}>Logout</button> {/* Botão de logout */}
        </div>
    );
}

export default HomePage;
