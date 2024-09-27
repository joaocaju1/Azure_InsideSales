import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegação

function ControleLigacoesCentral() {
  const [ligacoes, setLigacoes] = useState([]);
  const [searchInside, setSearchInside] = useState(''); // Estado para armazenar o valor do filtro
  const navigate = useNavigate(); // Hook para navegação

  useEffect(() => {
    // Função para buscar todas as ligações do backend
    const fetchLigacoes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/todas-ligacoes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setLigacoes(data);
      } catch (error) {
        console.error('Erro ao buscar as ligações:', error);
      }
    };

    fetchLigacoes();
  }, []);

  // Filtra as ligações pelo campo "Inside"
  const filteredLigacoes = ligacoes.filter((ligacao) =>
    ligacao.inside.toLowerCase().includes(searchInside.toLowerCase())
  );

  // Função para voltar à página inicial
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="container">
   
      <h1>Controle Central de Ligações</h1>

      <button className="voltar" onClick={handleBack}>Voltar para a página inicial</button>

      {/* Campo de busca para o filtro "Inside" */}
      <div className="input-wrapper">
        <input
          type="text"
          placeholder="Buscar por Inside"
          value={searchInside}
          onChange={(e) => setSearchInside(e.target.value)} // Atualiza o estado do filtro
        />
      </div>

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
            <th>Ocorrência</th>
          </tr>
        </thead>
        <tbody>
          {filteredLigacoes.map((ligacao, index) => (
            <tr key={index}>
              <td>{ligacao.cliente}</td>
              <td>{ligacao.inside}</td>
              <td>{ligacao.produto}</td>
              <td>{new Date(ligacao.programacaoLigacao).toLocaleDateString()}</td>
              <td>{ligacao.situacaoContato}</td>
              <td>{ligacao.comentarios}</td>
              <td>{new Date(ligacao.proximoContato).toLocaleDateString()}</td>
              <td>{ligacao.ocorrencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ControleLigacoesCentral;
