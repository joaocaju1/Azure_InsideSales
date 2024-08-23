import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import InputMask from 'react-input-mask';
import './Modal.css';
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
    const [formData, setFormData] = useState({
        titulo: '',
        empresa: '',
        razaoSocial: '',
        cnpj: '',
        cpf: '', // Adiciona o campo CPF
        endereco: '',
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
    const [userRole, setUserRole] = useState('');
    const [users, setUsers] = useState([]); // Adiciona o estado para a lista de usuários
    const [searchQuery, setSearchQuery] = useState(''); // Adiciona o estado para a barra de pesquisa

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
                    // Aqui fazemos a conversão de 'razao_social' para 'razaoSocial'
                    const formattedData = data.map(card => ({
                        ...card,
                        razaoSocial: card.razao_social
                    }));
                    setCards(formattedData);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.titulo) errors.titulo = true;
        if (!formData.empresa) errors.empresa = true;
        if (!formData.razaoSocial) errors.razaoSocial = true;
        if (!formData.cnpj && !formData.cpf) errors.cnpj = true; // Verifica se pelo menos um dos dois campos está preenchido
        if (!formData.endereco) errors.endereco = true;
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
                razaoSocial: '',
                cnpj: '',
                cpf: '', // Adiciona o campo CPF
                endereco: '',
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
    
            // Adicione essa linha para recarregar a página após a criação do card
            window.location.reload();
        } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
        }
    };
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCards = cards.filter(card =>
        card.empresa.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePainel = () => {
        navigate('/admin');
    };

    const handleCardClick = (card) => {
        navigate(`/card/${card.id}`, { state: { card } });
    };

    const renderModal = () => (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={closeModal}>&times;</span>
                <h2>Adicionar Card</h2>

                <div className="modal-row">
                    <div className="modal-input-group-half">
                        <label>
                            Título do Card
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.titulo ? 'error' : ''}`}
                            type="text"
                            placeholder="Título"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group-half">
                        <label>
                            Nome da empresa
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.empresa ? 'error' : ''}`}
                            type="text"
                            placeholder="Empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="modal-row">
                    <div className="modal-input-group-third">
                        <label>
                            Razão Social
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.razaoSocial ? 'error' : ''}`}
                            type="text"
                            placeholder="Razão Social"
                            name="razaoSocial"
                            value={formData.razaoSocial}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group-third">
                        <label>
                            CNPJ
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.cnpj ? 'error' : ''}`}
                            type="text"
                            placeholder="CNPJ"
                            name="cnpj"
                            value={formData.cnpj}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="modal-input-group-third">
                        <label>
                            CPF
                            <span className="norequired">(não obrigatório)</span>
                        </label>
                        <InputMask
                            className="modal-input"
                            type="text"
                            placeholder="CPF"
                            name="cpf"
                            mask="999.999.999-99"
                            value={formData.cpf}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="modal-row">
                    <div className="modal-input-group-third">
                        <label>
                            Endereço
                            <span className="required">(campo obrigatório)</span>
                        </label>
                        <input
                            className={`modal-input ${formErrors.endereco ? 'error' : ''}`}
                            type="text"
                            placeholder="Endereço"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

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
                            value={formData.nome1}
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
                            value={formData.contato1}
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
                            value={formData.email1}
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
                            value={formData.nome2}
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
                            value={formData.contato2}
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
                            value={formData.email2}
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
                    value={formData.visibleTo}
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
                    value={formData.descricao}
                    onChange={handleInputChange}
                ></textarea>

                <button className="modal-button" onClick={handleEnviar}>Enviar</button>
                <button className="modal-button" onClick={closeModal}>Fechar</button>
            </div>
        </div>
    );

    return (
        <div className="homepage">
            <div className="navbar">
                <div className="logofca">
                    <img src={logo} alt="FCA Logo" className="fca-logofca"/>
                    
                </div>

                <input
                    type="text"
                    className="search-input"
                    placeholder="Pesquisar empresa..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                />

                <div className="navbar-buttons">
                    <button className="navbar-button" onClick={openModal}>Adicionar Card</button>
                    <button className="navbar-button" onClick={handleLogout}>Logout</button>
                    {userRole === 'ADM' && (
                        <button className="navbar-button" onClick={handlePainel}>Painel ADM</button>
                    )}
                </div>
            </div>

            <div className="cards-table">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Empresa</th>
                            <th>Razão Social</th>
                            <th>CNPJ/CPF</th> {/* Atualize para refletir a nova lógica */}
                            <th>Endereço</th>
                            <th>Nome</th>
                            <th>Contato</th>
                            <th>Email</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCards.map((card, index) => (
                            <tr key={index} onClick={() => handleCardClick(card)}>
                                <td>{card.titulo}</td>
                                <td>{card.empresa}</td>
                                <td>{card.razaoSocial}</td>
                                <td>{card.cnpj || card.cpf}</td> {/* Exibe CNPJ ou CPF */}
                                <td>{card.endereco}</td>
                                <td>{card.nome1}</td>
                                <td>{card.contato1}</td>
                                <td>{card.email1}</td>
                                <td>{card.descricao}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && renderModal()}

            <footer className="footer">
                <p>© 2024 ABA Infra. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}

export default HomePage;
