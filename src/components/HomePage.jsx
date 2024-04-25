import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import './Modal.css';
import './NavBar.css';
import './HomePage.css';
import logo from './logo.png'; // Importe o seu logo aqui

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
    const [isNavbarOpen, setIsNavbarOpen] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        empresa: '',
        contato1: '',
        contato2: '',
        descricao: ''
    });
    const [cards, setCards] = useState([]);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [selectedCardData, setSelectedCardData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
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

    useEffect(() => {
        async function fetchUserRole() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3001/cargo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                const data = await response.json();

                if (data.role) {
                    setUserRole(data.role);
                } else {
                    console.error('Cargo do usuário não encontrado:', data);
                }
            } catch (error) {
                console.error('Erro ao buscar o cargo do usuário:', error);
            }
        }

        fetchUserRole();

        async function fetchCards() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3001/cards', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    setCards(data);
                } else {
                    console.error('Os dados recebidos não são uma matriz:', data);
                }
            } catch (error) {
                console.error('Erro ao buscar os cards:', error);
            }
        }

        fetchCards();
    }, []);

    const handleLogout = async () => {
        try {
            if (!isMsalInitialized) {
                console.log('MSAL ainda não inicializado. Aguarde...');
                return;
            }

            await msalInstance.logoutPopup();
            navigate('/login');
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

            setCards([...cards, formData]);
            setFormData({
                titulo: '',
                empresa: '',
                contato1: '',
                contato2: '',
                descricao: ''
            });

            setIsModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
        }
    };

    const toggleNavbar = () => {
        setIsNavbarOpen(!isNavbarOpen);
    };

    const openCardModal = (cardData) => {
        setSelectedCardData(cardData);
        setIsCardModalOpen(true);
    };

    const closeCardModal = () => {
        setIsCardModalOpen(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedData({
            titulo: selectedCardData.titulo,
            empresa: selectedCardData.empresa,
            contato1: selectedCardData.contato1,
            contato2: selectedCardData.contato2,
            descricao: selectedCardData.descricao
        });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/editarCard/${selectedCardData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editedData),
            });
            const data = await response.json();
            console.log(data);

            setSelectedCardData(editedData);
            const updatedCards = cards.map(card => {
                if (card.id === selectedCardData.id) {
                    return { ...card, ...editedData };
                } else {
                    return card;
                }
            });
            setCards(updatedCards);

            setIsEditing(false);
            setIsCardModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar as alterações do card:', error);
        }
    };

    const handleDelete = async () => {
        try {
            if (!selectedCardData || !selectedCardData.id) {
                console.error('ID do card não encontrado.');
                return;
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/excluirCard/${selectedCardData.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log(data);

            const updatedCards = cards.filter(card => card.id !== selectedCardData.id);
            setCards(updatedCards);

            setIsCardModalOpen(false);
        } catch (error) {
            console.error('Erro ao excluir o card:', error);
        }
    };

    return (
        <div>
            <div className={`navbar ${isNavbarOpen ? 'show' : ''}`} onClick={toggleNavbar}>
                <img src={logo} alt="Logo" style={{ width: '40%', margin: '0px auto', display: 'block' }} /> {/* Adicionando o logo */}


                <div className="navbar-links">
                    {(userRole === 'ADM' || userRole === 'INSIDE_SALES') && (
                        <button className="toggle-button" onClick={openModal}>
                            Adicionar Card
                        </button>
                    )}
                    <button className="toggle-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="cards-container">
                {cards.map((card, index) => (
                    <div key={index} className="card" onClick={() => openCardModal(card)}>
                        <h2>{card.titulo}</h2>
                        <p>Empresa: {card.empresa}</p>
                        <p>Contato 1: {card.contato1}</p>
                        <p>Contato 2: {card.contato2}</p>
                        <p>Descrição: {card.descricao}</p>
                    </div>
                ))}
            </div>

            {isModalOpen && (
    <div className="modal">
        <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <h2>Adicionar Card</h2>
            <input className="modal-input" type="text" placeholder="Título" name="titulo" value={formData.titulo} onChange={handleInputChange} />
            <input className="modal-input" type="text" placeholder="Empresa" name="empresa" value={formData.empresa} onChange={handleInputChange} />
            <input className="modal-input" type="text" placeholder="Contato 1" name="contato1" value={formData.contato1} onChange={handleInputChange} />
            <input className="modal-input" type="text" placeholder="Contato 2" name="contato2" value={formData.contato2} onChange={handleInputChange} />
            <textarea className="modal-textarea" placeholder="Descrição" name="descricao" value={formData.descricao} onChange={handleInputChange}></textarea>
            {(userRole === 'ADM' || userRole === 'INSIDE_SALES') && (
                <>
                    {isEditing ? (
                        <>
                            <button className="modal-button" onClick={handleEnviar}>Enviar</button>
                            <button className="modal-button" onClick={closeModal}>Fechar</button>
                        </>
                    ) : (
                        <button className="modal-button" onClick={handleEnviar}>Enviar</button>
                    )}
                </>
            )}
        </div>
    </div>
)}

            {isCardModalOpen && selectedCardData && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeCardModal}>&times;</span>
                        <h2>{selectedCardData.titulo}</h2>
                        <p>Empresa: {selectedCardData.empresa}</p>
                        <p>Contato 1: {selectedCardData.contato1}</p>
                        <p>Contato 2: {selectedCardData.contato2}</p>
                        <p>Descrição: {selectedCardData.descricao}</p>
                        {isEditing ? (
                            <>
                                <input className="modal-input" type="text" placeholder="Título" name="titulo" value={editedData.titulo} onChange={(e) => setEditedData({ ...editedData, titulo: e.target.value })} />
                                <input className="modal-input" type="text" placeholder="Empresa" name="empresa" value={editedData.empresa} onChange={(e) => setEditedData({ ...editedData, empresa: e.target.value })} />
                                <input className="modal-input" type="text" placeholder="Contato 1" name="contato1" value={editedData.contato1} onChange={(e) => setEditedData({ ...editedData, contato1: e.target.value })} />
                                <input className="modal-input" type="text" placeholder="Contato 2" name="contato2" value={editedData.contato2} onChange={(e) => setEditedData({ ...editedData, contato2: e.target.value })} />
                                <textarea className="modal-textarea" placeholder="Descrição" name="descricao" value={editedData.descricao} onChange={(e) => setEditedData({ ...editedData, descricao: e.target.value })}></textarea>

                                {(userRole === 'ADM' || userRole === 'INSIDE_SALES') && isEditing && (
                                    <>
                                        <button className="modal-button" onClick={handleSave}>Salvar</button>
                                    </>
                                )}

                                {(userRole === 'ADM' || userRole === 'ADM') && isEditing && (
                                    <>
                                        <button className="modal-button" onClick={handleDelete}>Excluir</button>
                                    </>
                                )}
                            </>
                        ) : (
                            (userRole !== 'VENDEDOR' && (
                                <button className="modal-button" onClick={handleEdit}>
                                    Editar
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;
