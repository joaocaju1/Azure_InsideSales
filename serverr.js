// Importações dos módulos necessários
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Inicialização do aplicativo Express
const app = express();
const port = 3000;
const secretKey = 'suaChaveSecreta'; // Chave secreta para assinatura do token JWT

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    port: 3306,
    password: '@102030Irigotayndu',
    database: 'vendedor_contatos'
});

// Verificação da conexão com o banco de dados
db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Middleware para permitir solicitações CORS
app.use(cors());
// Middleware para análise de corpos de solicitação JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Configuração do MSAL
// const msalConfig = {
//     auth: {
//         clientId: '885d20bd-4d91-433d-a370-fb48890a1343', // Seu client ID da aplicação Azure AD
//         authority: 'https://login.microsoftonline.com/6355709b-c2c3-4e21-af89-9a5471bfd3ea', // Seu tenant ID do Azure AD
//         redirectUri: 'http://localhost:8081', // URI de redirecionamento para sua aplicação
//         pkce: true // Habilita o PKCE

//     },
//     cache: {
//         cacheLocation: 'localStorage', // Local de armazenamento do cache
//         storeAuthStateInCookie: false // Armazenar estado de autenticação em cookie
//     }
// };

// const msalInstance = new PublicClientApplication(msalConfig); // Usar PublicClientApplication




// Rota de registro de usuário
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Verificar se o usuário já existe
    db.query('SELECT * FROM Usuario WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar usuário existente' });
        }
        if (results.length > 0) {
            return res.status(409).json({ error: 'Usuário já registrado' });
        }

        // Se o usuário não existir, proceda com o registro
        const sql = 'INSERT INTO Usuario (username, password) VALUES (?, ?)';
        db.query(sql, [username, password], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao registrar usuário' });
            }
            res.status(201).json({ message: 'Usuário registrado com sucesso' });
        });
    });
});


// Rota de login para iniciar a autenticação
//app.post('/login', (req, res) => {
//     const authCodeUrlParameters = {
//         scopes: ["user.read"],
//         redirectUri: msalConfig.auth.redirectUri,
//     };

//     msalInstance.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
//         console.log('Redirecting to:', response);
//         res.json({ redirectUrl: response }); // Retorna a URL de autenticação para o frontend
//     }).catch((error) => {
//         console.log('Login error:', error);
//         res.status(500).json({ error: 'Erro no login' });
//     });
// });

// // Rota de callback de autenticação
// app.get('/auth-callback', (req, res) => {
//     const tokenRequest = {
//         code: req.query.code,
//         scopes: ["user.read"],
//         redirectUri: msalConfig.auth.redirectUri,
//     };

//     msalInstance.acquireTokenByCode(tokenRequest).then((response) => {
//         console.log('Token acquired:', response);
//         const token = jwt.sign(response.account, secretKey); // Usar a conta do usuário para criar o token JWT
//         res.json({ token });
//     }).catch((error) => {
//         console.log('Authentication error:', error);
//         res.status(500).json({ error: 'Erro na autenticação' });
//     });
// });

// // Middleware para verificar o token JWT em todas as solicitações subsequentes
// function verifyToken(req, res, next) {
//     // Obter o token do cabeçalho da solicitação
//     const token = req.headers['authorization'];
//     if (!token) {
//         return res.status(403).json({ error: 'Token não fornecido' });
//     }
//     // Verificar e decodificar o token JWT
//     jwt.verify(token, secretKey, (err, decoded) => {
//         if (err) {
//             return res.status(401).json({ error: 'Token inválido' });
//         }
//         req.user = decoded;
//         next();
//     });
// }



// Rota de login para autenticar o usuário e gerar um token JWT
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT id, username FROM Usuario WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const usuarioId = results[0].id;
        const nomeDoUsuario = results[0].username;
        const token = jwt.sign({ usuarioId, nomeDoUsuario }, secretKey);
        res.json({ token, nomeDoUsuario });
    });
});

app.get('/dados-usuario', verifyToken, (req, res) => {
    const token = req.headers['authorization'];
    const decoded = jwt.verify(token, secretKey);
    res.json({ usuario: decoded });
});

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'Token não fornecido' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

app.get('/dados-usuario', verifyToken, (req, res) => {
    const usuarioId = req.usuarioId;

    console.log('ID do usuário:', usuarioId); // Adiciona um log para verificar o ID do usuário

    // Consulta ao banco de dados para obter os dados dos fornecedores do usuário com base no ID do usuário
    db.query('SELECT * FROM Fornecedor WHERE usuario_id = ?', [usuarioId], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err); // Adiciona um log para verificar se houve erros na consulta
            return res.status(500).json({ error: 'Erro ao obter dados do usuário do banco de dados' });
        }
        console.log('Resultados da consulta:', results); // Adiciona um log para verificar os resultados da consulta
        // Retorne os dados do usuário como resposta
        res.json({ fornecedores: results });
    });
});

// Middleware para verificar a permissão de acesso
function checkPermission(permission) {
    return (req, res, next) => {
        const usuarioId = req.usuarioId;
        db.query('SELECT permissao FROM Usuario WHERE id = ?', [usuarioId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao verificar permissões do usuário' });
            }
            const permissao = results[0].permissao;
            if (permissao === permission || permissao === 'ADM') {
                next();
            } else {
                return res.status(403).json({ error: 'Permissão insuficiente' });
            }
        });
    };
}


// Rota para obter a lista de usuários e suas permissões
app.get('/usuarios', (req, res) => {
    db.query('SELECT id, username, permissao FROM Usuario', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao obter usuários' });
        }
        res.json({ users: results });
    });
});

// Rota para atualizar a permissão de um usuário
app.put('/atualizar-permissao/:id', (req, res) => {
    const userId = req.params.id;
    const { permission } = req.body;

    db.query('UPDATE Usuario SET permissao = ? WHERE id = ?', [permission, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar permissão do usuário' });
        }
        res.json({ message: 'Permissão atualizada com sucesso' });
    });
});

// Rota para salvar fornecedores
app.post('/salvar-fornecedores', verifyToken, (req, res) => {
    const usuarioId = req.usuarioId;
    const suppliers = req.body.suppliers;

    //Aqui você salvaria os fornecedores no banco de dados associados ao usuário com o usuarioId
    //Exemplo:
    suppliers.forEach(supplier => {
        db.query('INSERT INTO Fornecedor (nome, empresa, telefone1, telefone2, observacao, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
            [supplier.nome, supplier.empresa, supplier.telefone1, supplier.telefone2, supplier.observacao, usuarioId],
            (err, result) => {
                if (err) {
                    console.error('Erro ao salvar fornecedores no banco de dados:', err);
                    return res.status(500).json({ error: 'Erro ao salvar fornecedores no banco de dados' });
                }
            });
    });
    res.status(200).json({ message: 'Fornecedores salvos com sucesso' }); // Mova essa linha para fora do loop forEach
});


// Rota para criar um novo card
app.post('/criar-card', verifyToken, (req, res) => {
    const { title, description } = req.body;
    const usuarioId = req.usuarioId;

    db.query('INSERT INTO Card (title, description, usuario_id) VALUES (?, ?, ?)', [title, description, usuarioId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao criar um novo card' });
        }
        res.status(201).json({ message: 'Card criado com sucesso' });
    });
});

// Rota para obter os cards do usuário
app.get('/cards', verifyToken, (req, res) => {
    const usuarioId = req.usuarioId;

    db.query('SELECT * FROM Card WHERE usuario_id = ?', [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao obter cards do usuário' });
        }
        res.json({ cards: results });
    });
});

// Rota para obter os dados do usuário após o login
app.get('/dados-usuario', verifyToken, (req, res) => {
    const usuarioId = req.usuarioId;

    console.log('ID do usuário:', usuarioId); // Adiciona um log para verificar o ID do usuário

    // Consulta ao banco de dados para obter os dados do usuário, incluindo a permissão
    db.query('SELECT id, username, permissao FROM Usuario WHERE id = ?', [usuarioId], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err); // Adiciona um log para verificar se houve erros na consulta
            return res.status(500).json({ error: 'Erro ao obter dados do usuário do banco de dados' });
        }
        console.log('Resultados da consulta:', results); // Adiciona um log para verificar os resultados da consulta
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        // Retorne os dados do usuário, incluindo a permissão, como resposta
        res.json({ usuario: results[0] });
    });
});


// Rota para obter as permissões do usuário
app.get('/permissoes-usuario', verifyToken, (req, res) => {
    const usuarioId = req.usuarioId;

    db.query('SELECT permissao FROM Usuario WHERE id = ?', [usuarioId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao obter permissões do usuário' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const permissao = results[0].permissao;
        res.json({ permissao });
    });
});



// Rota para excluir um fornecedor
app.delete('/excluir-fornecedor/:id', verifyToken, (req, res) => {
    const fornecedorId = req.params.id;
    const usuarioId = req.usuarioId;
  
    // Verifique se o fornecedor pertence ao usuário logado
    db.query('SELECT * FROM Fornecedor WHERE id = ? AND usuario_id = ?', [fornecedorId, usuarioId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao excluir fornecedor' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Fornecedor não encontrado ou não pertence ao usuário' });
      }
  
      // Execute a exclusão do fornecedor
      db.query('DELETE FROM Fornecedor WHERE id = ?', [fornecedorId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao excluir fornecedor' });
        }
        res.json({ message: 'Fornecedor excluído com sucesso' });
      });
    });
  });

   // Rota para editar um fornecedor
   app.put('/editar-fornecedor/:id', verifyToken, (req, res) => {
    const fornecedorId = req.params.id;
    const usuarioId = req.usuarioId;
    const { nome, empresa, telefone1, telefone2, observacao } = req.body;
  
    // Verifique se o fornecedor pertence ao usuário logado
    db.query('SELECT * FROM Fornecedor WHERE id = ? AND usuario_id = ?', [fornecedorId, usuarioId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao editar fornecedor' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Fornecedor não encontrado ou não pertence ao usuário' });
      }
  
      // Execute a atualização do fornecedor
      db.query('UPDATE Fornecedor SET nome = ?, empresa = ?, telefone1 = ?, telefone2 = ?, observacao = ? WHERE id = ?',
        [nome, empresa, telefone1, telefone2, observacao, fornecedorId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao editar fornecedor' });
          }
          res.json({ message: 'Fornecedor editado com sucesso' });
        });
    });
  });


// Middleware para verificar o token JWT em todas as solicitações subsequentes
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'Token não fornecido' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.usuarioId = decoded.usuarioId;
        next();
    });
}

// Inicialização do servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor está rodando na porta ${port}`);
});
