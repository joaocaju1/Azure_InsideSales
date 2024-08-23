import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './CardDetails.css';

function CardDetails() {
    const { cardId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [card, setCard] = useState(location.state?.card || {});
    const [statusHistory, setStatusHistory] = useState([]);
    const [newStatus, setNewStatus] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        titulo: '',
        empresa: '',
        nome1: '',
        contato1: '',
        email1: '',
        nome2: '',
        contato2: '',
        email2: '',
        descricao: ''
    });
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [fullStatusHistory, setFullStatusHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchCardData() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3001/cards/${cardId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                const data = await response.json();
                if (data) {
                    setCard(data);
                    setEditFormData({
                        titulo: data.titulo,
                        empresa: data.empresa,
                        nome1: data.nome1,
                        contato1: data.contato1,
                        email1: data.email1,
                        nome2: data.nome2,
                        contato2: data.contato2,
                        email2: data.email2,
                        descricao: data.descricao
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar os dados do card:', error);
            }
        }

        async function fetchStatusHistory() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3001/status/${cardId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    setStatusHistory(data.slice(0, 20));
                } else {
                    console.error('Os dados recebidos não são uma matriz:', data);
                }
            } catch (error) {
                console.error('Erro ao buscar o histórico de status:', error);
            }
        }

        fetchCardData();
        fetchStatusHistory();
    }, [cardId]);

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
                body: JSON.stringify({ cardId: parseInt(cardId), status: newStatus }),
            });
            const data = await response.json();
            console.log(data);

            setStatusHistory(prevStatusHistory => {
                const updatedStatusHistory = [{ id: Date.now(), status: newStatus, created_at: new Date(), user_email: 'Você' }, ...prevStatusHistory];
                return updatedStatusHistory.slice(0, 20); // Limita o tamanho do histórico a 20 mensagens
            });
            setNewStatus('');
        } catch (error) {
            console.error('Erro ao adicionar status:', error);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/excluirCard/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log(data);
            navigate('/');
        } catch (error) {
            console.error('Erro ao excluir o card:', error);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    const handleSave = async () => {
        console.log('Enviando dados para atualização:', editFormData);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/editarCard/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editFormData),
            });
            const data = await response.json();
            console.log('Resposta do servidor:', data);

            if (data.message === 'Card atualizado com sucesso') {
                // Atualizar os dados do card com os dados editados
                setCard({ ...card, ...editFormData });
                setIsEditing(false);
            } else {
                console.error('Erro ao atualizar o card:', data);
            }
        } catch (error) {
            console.error('Erro ao salvar as alterações:', error);
        }
    };

    const handleShowFullHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/status/${cardId}/full`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setFullStatusHistory(data);
                setShowFullHistory(true);
            } else {
                console.error('Os dados recebidos não são uma matriz:', data);
            }
        } catch (error) {
            console.error('Erro ao buscar o histórico completo de status:', error);
        }
    };

    const handleCloseFullHistory = () => {
        setShowFullHistory(false);
    };

    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredFullStatusHistory = fullStatusHistory.filter(status =>
        status.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="card-details">
            <div className="card-details-header">
                <h2>{card.titulo}</h2>
                <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
            </div>
            <div className="card-details-main">
                <div className="card-details-info">
                    <div className="card-info-section">
                        <h3>Dados Básicos</h3>
                        {isEditing ? (
                            <div className="modal-row">
                                <div className="modal-input-group">
                                    <label>
                                        Título:
                                        <input type="text" name="titulo" className="modal-input" value={editFormData.titulo} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Empresa:
                                        <input type="text" name="empresa" className="modal-input" value={editFormData.empresa} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Nome 1:
                                        <input type="text" name="nome1" className="modal-input" value={editFormData.nome1} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Contato 1:
                                        <input type="text" name="contato1" className="modal-input" value={editFormData.contato1} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Email 1:
                                        <input type="email" name="email1" className="modal-input" value={editFormData.email1} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Nome 2:
                                        <input type="text" name="nome2" className="modal-input" value={editFormData.nome2} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Contato 2:
                                        <input type="text" name="contato2" className="modal-input" value={editFormData.contato2} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Email 2:
                                        <input type="email" name="email2" className="modal-input" value={editFormData.email2} onChange={handleEditInputChange} />
                                    </label>
                                </div>
                                <div className="modal-input-group">
                                    <label>
                                        Descrição:
                                        <textarea name="descricao" className="modal-textarea" value={editFormData.descricao} onChange={handleEditInputChange}></textarea>
                                    </label>
                                    <button className="save-button" onClick={handleSave}>Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p><strong>Título:</strong> {card.titulo}</p>
                                <p><strong>Empresa:</strong> {card.empresa}</p>
                                <p><strong>Nome 1:</strong> {card.nome1}</p>
                                <p><strong>Contato 1:</strong> {card.contato1}</p>
                                <p><strong>Email 1:</strong> {card.email1}</p>
                                <p><strong>Nome 2:</strong> {card.nome2}</p>
                                <p><strong>Contato 2:</strong> {card.contato2}</p>
                                <p><strong>Email 2:</strong> {card.email2}</p>
                                <p><strong>Descrição:</strong> {card.descricao}</p>
                                <button className="edit-button" onClick={handleEditToggle}>Editar</button>
                                <button className="full-history-button" onClick={handleShowFullHistory}>Ver Histórico Completo</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="card-details-status">
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
                        className="status-input"
                        placeholder="Adicionar status"
                        name="newStatus"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                    ></textarea>
                    <button className="status-button" onClick={handleAddStatus}>Adicionar Status</button>
                    <button className="delete-button" onClick={handleDelete}>Excluir Card</button>
                    {/* <button className="full-history-button" onClick={handleShowFullHistory}>Ver Histórico Completo</button> */}
                </div>
            </div>

            {showFullHistory && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseFullHistory}>&times;</span>
                        <h2>Histórico Completo de Status</h2>
                        <input
                            type="text"
                            className="search-inputHistoric"
                            placeholder="Pesquisar status"
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                        />
                        <div className="full-status-history">
                            {filteredFullStatusHistory.map((status, index) => (
                                <div key={index} className="status-entry">
                                    <span className="status-user">{status.user_email}</span>: {status.status}
                                    <div className="status-timestamp">{new Date(status.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CardDetails;
