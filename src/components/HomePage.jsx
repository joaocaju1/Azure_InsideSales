import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import InputMask from 'react-input-mask';
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
        nome1: '',
        contato1: '',
        email1: '',
        nome2: '',
        contato2: '',
        email2: '',
        descricao: '',
        visibleTo: '' // Adiciona o campo para o usuário selecionado
    });
    const [formErrors, setFormErrors] = useState({});
    const [cards, setCards] = useState([]);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [selectedCardData, setSelectedCardData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [userRole, setUserRole] = useState('');
    const [users, setUsers] = useState([]); // Adiciona o estado para a lista de usuários
    const [statusHistory, setStatusHistory] = useState([]); // Adiciona o estado para o histórico de status
    const [newStatus, setNewStatus] = useState(''); // Adiciona o estado para o novo status

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

        async function fetchUsers() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3001/users', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    console.error('Os dados recebidos não são uma matriz:', data);
                }
            } catch (error) {
                console.error('Erro ao buscar os usuários:', error);
            }
        }

        fetchUsers();
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
        setFormErrors({});
    };

    const openCardModal = async (cardData) => {
        setSelectedCardData(cardData);
        setEditedData(cardData); // Preencher os dados de edição com os dados do card selecionado
        setIsCardModalOpen(true);

        // Busca o histórico de status para o card selecionado
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/status/${cardData.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setStatusHistory(data);
            } else {
                console.error('Os dados recebidos não são uma matriz:', data);
            }
        } catch (error) {
            console.error('Erro ao buscar o histórico de status:', error);
        }
    };

    const closeCardModal = () => {
        setIsCardModalOpen(false);
        setStatusHistory([]);
        setNewStatus('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (isCardModalOpen) {
            setEditedData({
                ...editedData,
                [name]: value
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.titulo) errors.titulo = true;
        if (!formData.empresa) errors.empresa = true;
        if (!formData.nome1) errors.nome1 = true;
        if (!formData.contato1) errors.contato1 = true;
        if (!formData.email1) errors.email1 = true;
        if (!formData.visibleTo) errors.visibleTo = true; // Verifica se o campo visibleTo está preenchido
        return errors;
    };

    const handleEnviar = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

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

            setCards([...cards, { ...formData, id: data.insertId }]); // Adicionar o novo card com o ID retornado
            setFormData({
                titulo: '',
                empresa: '',
                nome1: '',
                contato1: '',
                email1: '',
                nome2: '',
                contato2: '',
                email2: '',
                descricao: '',
                visibleTo: ''
            });

            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
        }
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
            window.location.reload(); // Adiciona um reload da página
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

    const handleAddStatus = async () => {
        if (!newStatus.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/adicionarStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cardId: selectedCardData.id, status: newStatus }),
            });
            const data = await response.json();
            console.log(data);

            setStatusHistory([{ id: Date.now(), status: newStatus, created_at: new Date(), user_email: 'Você' }, ...statusHistory]);
            setNewStatus('');
        } catch (error) {
            console.error('Erro ao adicionar status:', error);
        }
    };

    const toggleNavbar = () => {
        setIsNavbarOpen(!isNavbarOpen);
    };

    const handlePainel = () => {
        window.location.href = '/admin';
    };

    const renderModal = (isEditing) => (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={isEditing ? closeCardModal : closeModal}>&times;</span>
                <h2>{isEditing ? 'Editar Card' : 'Adicionar Card'}</h2>
                <label>
                    Título do Card
                    <span className="required">(campo obrigatório)</span>
                </label>
                <input
                    className={`modal-input ${formErrors.titulo ? 'error' : ''}`}
                    type="text"
                    placeholder="Título"
                    name="titulo"
                    value={isEditing ? editedData.titulo : formData.titulo}
                    onChange={handleInputChange}
                />

                <label>
                    Nome da empresa
                    <span className="required">(campo obrigatório)</span>
                </label>
                <input
                    className={`modal-input ${formErrors.empresa ? 'error' : ''}`}
                    type="text"
                    placeholder="Empresa"
                    name="empresa"
                    value={isEditing ? editedData.empresa : formData.empresa}
                    onChange={handleInputChange}
                />

                <div className="modal-row">
                    <div className="modal-input-group">
                        <label>
                            Nome 1
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.nome1 ? 'error' : ''}`}
                            type="text"
                            placeholder="Nome(1)"
                            name="nome1"
                            value={isEditing ? editedData.nome1 : formData.nome1}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group">
                        <label>
                            Contato 1
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <InputMask
                            className={`modal-input ${formErrors.contato1 ? 'error' : ''}`}
                            type="text"
                            placeholder="Contato(1)"
                            name="contato1"
                            mask="+999 (99) 99999-9999"
                            value={isEditing ? editedData.contato1 : formData.contato1}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group">
                        <label>
                            Email 1
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.email1 ? 'error' : ''}`}
                            type="email"
                            placeholder="Email(1)"
                            name="email1"
                            value={isEditing ? editedData.email1 : formData.email1}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="modal-row">
                    <div className="modal-input-group">
                        <label>
                            Nome 2
                            <span className="norequired">(não obrigatório)</span>
                        </label>
                        <input
                            className="modal-input"
                            type="text"
                            placeholder="Nome(2)"
                            name="nome2"
                            value={isEditing ? editedData.nome2 : formData.nome2}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group">
                        <label>
                            Contato 2
                            <span className="norequired">(não obrigatório)</span>
                        </label>
                        <InputMask
                            className="modal-input"
                            type="text"
                            placeholder="Contato(2)"
                            name="contato2"
                            mask="+999 (99) 99999-9999"
                            value={isEditing ? editedData.contato2 : formData.contato2}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group">
                        <label>
                            Email 2
                            <span className="norequired">(não obrigatório)</span>
                        </label>
                        <input
                            className="modal-input"
                            type="email"
                            placeholder="Email(2)"
                            name="email2"
                            value={isEditing ? editedData.email2 : formData.email2}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <label>
                    Selecionar usuário
                    <span className="required">(campo obrigatório)</span>
                </label>
                <select
                    className={`modal-input ${formErrors.visibleTo ? 'error' : ''}`}
                    name="visibleTo"
                    value={isEditing ? editedData.visibleTo : formData.visibleTo}
                    onChange={handleInputChange}
                >
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                </select>

                <textarea
                    className="modal-textarea"
                    placeholder="Descrição"
                    name="descricao"
                    value={isEditing ? editedData.descricao : formData.descricao}
                    onChange={handleInputChange}
                ></textarea>

                {/* Seção para exibir e adicionar status */}
                {isEditing && (
                    <>
                        <h3>Histórico de Status</h3>
                        <div className="status-history">
                            {statusHistory.map((status, index) => (
                                <div key={index} className="status-entry">
                                    <span className="status-user">{status.user_email}</span>: {status.status}
                                    <div className="status-timestamp">{new Date(status.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                        <textarea
                            className="modal-textarea"
                            placeholder="Adicionar status"
                            name="newStatus"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        ></textarea>
                        <button className="modal-button" onClick={handleAddStatus}>Adicionar Status</button>
                    </>
                )}

                {(userRole === 'ADM' || userRole === 'INSIDE_SALES') && (
                    <>
                        {isEditing ? (
                            <>
                                <button className="modal-button" onClick={handleSave}>Salvar</button>
                                <button className="modal-button" onClick={handleDelete}>Excluir</button>
                                <button className="modal-button" onClick={closeCardModal}>Fechar</button>
                            </>
                        ) : (
                            <>
                                <button className="modal-button" onClick={handleEnviar}>Enviar</button>
                                <button className="modal-button" onClick={closeModal}>Fechar</button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );

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
                </div>

                <button className="toggle-button" onClick={handleLogout}>
                    Logout
                </button>

                {(userRole === 'ADM' || userRole === 'ADM') && (
                    <button className="toggle-button" onClick={handlePainel}>
                        Painel ADM
                    </button>
                )}
            </div>

            <div className="cards-container">
                {cards.map((card, index) => (
                    <div key={index} className="card" onClick={() => openCardModal(card)}>
                        <div className="card-header">
                            <h2>{card.titulo}</h2>
                            <div className="card-company">Empresa: {card.empresa}</div>
                        </div>
                        <div className="card-content">
                            <div className="modal-row">
                                <div className="modal-item">
                                    <span className="modal-item-label">Nome 1:</span>
                                    <span className="modal-item-value">{card.nome1}</span>
                                </div>
                                <div className="modal-item">
                                    <span className="modal-item-label">Contato 1:</span>
                                    <span className="modal-item-value">{card.contato1}</span>
                                </div>
                            </div>
                            <div className="modal-row">
                                <div className="modal-item">
                                    <span className="modal-item-label">Email 1:</span>
                                    <span className="modal-item-value">{card.email1}</span>
                                </div>
                            </div>
                            <div className="modal-row">
                                <div className="modal-item">
                                    <span className="modal-item-label">Nome 2:</span>
                                    <span className="modal-item-value">{card.nome2}</span>
                                </div>
                                <div className="modal-item">
                                    <span className="modal-item-label">Contato 2:</span>
                                    <span className="modal-item-value">{card.contato2}</span>
                                </div>
                            </div>
                            <div className="modal-row">
                                <div className="modal-item">
                                    <span className="modal-item-label">Email 2:</span>
                                    <span className="modal-item-value">{card.email2}</span>
                                </div>
                            </div>
                            <div className="modal-row">
                                <div className="modal-item">
                                    <span className="modal-item-label">Descrição:</span>
                                    <span className="modal-item-value">{card.descricao}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && renderModal(false)}

            {isCardModalOpen && renderModal(true)}
        </div>
    );
}

export default HomePage;
