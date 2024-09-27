import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  
import './ControleLigacoes.css';

function ControleLigacoes() {
    const [ligacoes, setLigacoes] = useState([]);
    const [newLigacao, setNewLigacao] = useState({
        cliente: '',
        inside: '',
        produto: '',
        programacaoLigacao: '',
        situacaoContato: '',
        comentarios: '',
        proximoContato: '',
        ocorrencia: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false); // Estado para controlar a visibilidade do formulário

    const navigate = useNavigate();  

    useEffect(() => {
        const fetchLigacoes = async () => {
            try {
                const response = await fetch('http://localhost:3001/ligacoes', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();

                const ligacoesComDatasFormatadas = data.map(ligacao => ({
                    ...ligacao,
                    programacaoLigacao: ligacao.programacao_ligacao ? ligacao.programacao_ligacao.split('T')[0] : '',
                    proximoContato: ligacao.proximo_contato ? ligacao.proximo_contato.split('T')[0] : '',
                    situacaoContato: ligacao.situacao_contato || 'vazio'
                }));

                setLigacoes(ligacoesComDatasFormatadas);
            } catch (error) {
                console.error('Erro ao buscar as ligações:', error);
            }
        };

        fetchLigacoes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLigacao({ ...newLigacao, [name]: value });
    };

    const handleAdd = async () => {
        try {
            const response = await fetch('http://localhost:3001/ligacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newLigacao)
            });

            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Erro ao adicionar a ligação');
            }
        } catch (error) {
            console.error('Erro ao adicionar a ligação:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:3001/ligacoes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setLigacoes(ligacoes.filter(l => l.id !== id));
            } else {
                console.error('Erro ao excluir a ligação');
            }
        } catch (error) {
            console.error('Erro ao excluir a ligação:', error);
        }
    };

    const handleEdit = (ligacao) => {
        setIsEditing(true);
        setCurrentEditId(ligacao.id);
        setNewLigacao({
            cliente: ligacao.cliente,
            inside: ligacao.inside,
            produto: ligacao.produto,
            programacaoLigacao: ligacao.programacaoLigacao,
            situacaoContato: ligacao.situacaoContato,
            comentarios: ligacao.comentarios,
            proximoContato: ligacao.proximoContato,
            ocorrencia: ligacao.ocorrencia
        });
        setShowAddForm(true); // Exibe o formulário quando for editar
    };

    const handleUpdate = async () => {
        try {
            const response = await fetch(`http://localhost:3001/ligacoes/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newLigacao)
            });
    
            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Erro ao atualizar a ligação');
            }
        } catch (error) {
            console.error('Erro ao atualizar a ligação:', error);
        }
    };

    const handleBackToCardDetails = () => {
        navigate(-1); 
    };

    return (
        <div className="controle-ligacoes">
            <h2>Controle de Ligações</h2>
            <button className="back-button" onClick={handleBackToCardDetails}>Voltar para CardDetails</button>

            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Inside</th>
                        <th>Produto</th>
                        <th>Programação de Ligação</th>
                        <th>Situação de Contato</th>
                        <th>Comentários</th>
                        <th>Data do Próximo Contato</th>
                        <th>Principal Ocorrência</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {ligacoes.map((ligacao, index) => (
                        <tr key={ligacao.id || index}>
                            <td>{ligacao.cliente}</td>
                            <td>{ligacao.inside}</td>
                            <td>{ligacao.produto}</td>
                            <td>{ligacao.programacaoLigacao}</td>
                            <td>{ligacao.situacaoContato}</td>
                            <td>{ligacao.comentarios}</td>
                            <td>{ligacao.proximoContato}</td>
                            <td>{ligacao.ocorrencia}</td>
                            <td class="botoes">
                                <button className="edit-button" onClick={() => handleEdit(ligacao)}>
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button className="delete-button" onClick={() => handleDelete(ligacao.id)}>
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button className="toggle-form-button" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Ocultar Formulário' : 'Adicionar Nova Ligação'}
            </button>

            {showAddForm && (
                <div className="add-ligacao">
                    <input type="text" name="cliente" placeholder="Cliente" value={newLigacao.cliente} onChange={handleInputChange} />
                    <input type="text" name="inside" placeholder="Inside" value={newLigacao.inside} onChange={handleInputChange} />
                    <input type="text" name="produto" placeholder="Produto" value={newLigacao.produto} onChange={handleInputChange} />
                    <input type="date" name="programacaoLigacao" value={newLigacao.programacaoLigacao} onChange={handleInputChange} />
                    <input type="text" name="situacaoContato" placeholder="Situação de Contato" value={newLigacao.situacaoContato} onChange={handleInputChange} />
                    <textarea name="comentarios" placeholder="Comentários" value={newLigacao.comentarios} onChange={handleInputChange}></textarea>
                    <input type="date" name="proximoContato" value={newLigacao.proximoContato} onChange={handleInputChange} />
                    <input type="text" name="ocorrencia" placeholder="Principal Ocorrência" value={newLigacao.ocorrencia} onChange={handleInputChange} />
                    
                    {isEditing ? (
                        <button onClick={handleUpdate}>Atualizar Ligação</button>
                    ) : (
                        <button onClick={handleAdd}>Adicionar Ligação</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ControleLigacoes;
