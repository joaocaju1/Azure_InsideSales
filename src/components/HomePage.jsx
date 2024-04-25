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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        empresa: '',
        contato1: '',
        contato2: '',
        descricao: ''
    });

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

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    const handleEnviar = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/adicionarCard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
        }
    };
    
    

    return (
        <div style={{ backgroundColor: 'green', height: '100vh' }}>
            <h1>Página Inicial</h1>
            <p>Bem-vindo à HomePage!</p>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={openModal}>Adicionar Card</button>
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>Adicionar Card</h2>
                        <input type="text" placeholder="Título" name="titulo" value={formData.titulo} onChange={handleInputChange} />
                        <input type="text" placeholder="Empresa" name="empresa" value={formData.empresa} onChange={handleInputChange} />
                        <input type="text" placeholder="Contato 1" name="contato1" value={formData.contato1} onChange={handleInputChange} />
                        <input type="text" placeholder="Contato 2" name="contato2" value={formData.contato2} onChange={handleInputChange} />
                        <textarea placeholder="Descrição" name="descricao" value={formData.descricao} onChange={handleInputChange}></textarea>
                        <button onClick={handleEnviar}>Enviar</button>
                        <button onClick={closeModal}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;
