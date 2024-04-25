import React, { useEffect, useState } from 'react';
import './AdminPanel.css'; // Estilo para a tela de administração

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        // Função para buscar todos os usuários do banco de dados
        async function fetchUsers() {
            try {
                const response = await fetch('http://localhost:3001/users');
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error('Erro ao buscar os usuários:', error);
            }
        }

        fetchUsers();
    }, []);

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) {
            console.error('Selecione um usuário e um cargo.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/updateUserRole/${selectedUser}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cargo: selectedRole }),
            });
            const data = await response.json();
            console.log(data);

            // Atualizar a lista de usuários após atribuir o cargo
            const updatedUsers = users.map(user => {
                if (user.id === selectedUser) {
                    return { ...user, cargo: selectedRole };
                } else {
                    return user;
                }
            });
            setUsers(updatedUsers);

            // Limpar o estado do usuário selecionado e do cargo selecionado
            setSelectedUser('');
            setSelectedRole('');
        } catch (error) {
            console.error('Erro ao atribuir o cargo:', error);
        }
    };

    return (
        <div className="admin-panel">
            <h1>Administração de Usuários</h1>
            <div className="user-list">
                <h2>Usuários</h2>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                    <option value="">Selecione um usuário</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.email} - {user.cargo}</option>
                    ))}
                </select>
            </div>
            <div className="role-selector">
                <h2>Selecionar Cargo</h2>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                    <option value="">Selecione um cargo</option>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="INSIDE_SALES">Inside Sales</option>
                    <option value="ADM">Admin</option>
                </select>
                <button onClick={handleAssignRole}>Atribuir Cargo</button>
            </div>
        </div>
    );
}

export default AdminPanel;
