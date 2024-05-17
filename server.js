const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const mysql = require('mysql2'); // Usar mysql2 em vez de mysql
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  port: 3306,
  password: 'root',
  database: 'fcalista'
});

// Verificação da conexão com o banco de dados
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('Conectado ao banco de dados MySQL');
});

// Configuração do CORS
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Inicialização do Passport
app.use(passport.initialize());

// Configuração da autenticação Azure AD
passport.use(new OIDCStrategy({
    identityMetadata: 'https://login.microsoftonline.com/6355709b-c2c3-4e21-af89-9a5471bfd3ea/v2.0/.well-known/openid-configuration',
    clientID: '885d20bd-4d91-433d-a370-fb48890a1343',
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: 'http://localhost:3001/auth/openid/return',
    allowHttpForRedirectUrl: true,
    clientSecret: 'cfcad369-d477-4565-9540-4d85fbb66143',
    validateIssuer: false,
    passReqToCallback: false,
    scope: ['profile', 'email'],
  },
  (iss, sub, profile, accessToken, refreshToken, done) => {
    return done(null, profile);
  }
));

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, 'chave_secreta', { expiresIn: '1h' });
};

// Middleware para verificar e decodificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token.split(' ')[1], 'chave_secreta', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.userId = decoded.userId;
    next();
  });
};

// Rota para buscar todos os cards
// app.get('/cards', verifyToken, (req, res) => {
//   const userId = req.userId;

//   const sql = 'SELECT * FROM cards WHERE user_id = ?';
//   db.query(sql, [userId], (err, result) => {
//     if (err) {
//       console.error('Erro ao buscar os cards:', err);
//       res.status(500).json({ error: 'Erro interno do servidor' });
//       return;
//     }
//     res.status(200).json(result);
//   });
// });

// Rota para buscar os cards visíveis ao usuário
app.get('/cards', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = 'SELECT * FROM cards WHERE visible_to = ? OR user_id = ?';
  db.query(sql, [userId, userId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json(result);
  });
});

// Rota para buscar todos os cards (independente do usuário)
app.get('/todosCards', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM cards';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Erro ao buscar todos os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json(result);
  });
});

// Rota para verificar o cargo do usuário e redirecionar
app.get('/checkUserRole', (req, res) => {
  const { email } = req.query;

  db.query('SELECT cargo FROM users WHERE email = ?', [email], (err, result) => {
    if (err) {
      console.error('Erro ao buscar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const cargo = result[0].cargo;

    if (cargo === 'MEMBRO') {
      res.redirect('/membro');
    } else {
      res.redirect('/');
    }
  });
});

// Rota para receber e armazenar o username e gerar token JWT
app.post('/saveUsername', (req, res) => {
  const { username } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [username], (err, result) => {
    if (err) {
      console.log('Erro ao verificar usuário:', err);
      return res.status(500).send('Erro interno do servidor');
    }

    if (result.length === 0) {
      db.query('INSERT INTO users (email, cargo) VALUES (?, ?)', [username, 'MEMBRO'], (err, result) => {
        if (err) {
          console.log('Erro ao inserir usuário:', err);
          return res.status(500).send('Erro interno do servidor');
        }

        const userId = result.insertId;
        const token = generateToken(userId);

        res.json({ token });
      });
    } else {
      const userId = result[0].id;
      const token = generateToken(userId);

      res.json({ token });
    }
  });
});

// Rota para adicionar um novo card
// app.post('/adicionarCard', verifyToken, (req, res) => {
//   const { titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao } = req.body;
//   const userId = req.userId;

//   const sql = 'INSERT INTO cards (titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
//   db.query(sql, [titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao, userId], (err, result) => {
//     if (err) {
//       console.error('Erro ao inserir novo card:', err);
//       res.status(500).json({ error: 'Erro interno do servidor' });
//       return;
//     }
//     res.status(200).json({ message: 'Novo card adicionado com sucesso' });
//   });
// });

// Rota para adicionar um novo card
app.post('/adicionarCard', verifyToken, (req, res) => {
  const { titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao, visibleTo } = req.body;
  const userId = req.userId;

  const sql = 'INSERT INTO cards (titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao, user_id, visible_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao, userId, visibleTo], (err, result) => {
    if (err) {
      console.error('Erro ao inserir novo card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json({ message: 'Novo card adicionado com sucesso' });
  });
});


// Rota para atualizar um card existente
app.put('/editarCard/:cardId', verifyToken, (req, res) => {
  const cardId = req.params.cardId;
  const { titulo, empresa, contato1, contato2, email1, email2, nome1, nome2, descricao } = req.body;
  const userId = req.userId;

  db.query('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId], (err, result) => {
    if (err) {
      console.error('Erro ao verificar o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
      return;
    }

    const sql = 'UPDATE cards SET titulo = ?, empresa = ?, contato1 = ?, contato2 = ?, nome1 = ?, nome2 = ?, email1 = ?, email2 = ?, descricao = ? WHERE id = ?';
    db.query(sql, [titulo, empresa, contato1, contato2, nome1, nome2, email1, email2, descricao, cardId], (err, result) => {
      if (err) {
        console.error('Erro ao atualizar o card:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      res.status(200).json({ message: 'Card atualizado com sucesso' });
    });
  });
});

// Rota para excluir um card específico
app.delete('/excluirCard/:cardId', verifyToken, (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.userId;

  db.query('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId], (err, result) => {
    if (err) {
      console.error('Erro ao verificar o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
      return;
    }

    db.query('DELETE FROM cards WHERE id = ?', [cardId], (err, result) => {
      if (err) {
        console.error('Erro ao excluir o card:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      res.status(200).json({ message: 'Card excluído com sucesso' });
    });
  });
});

// Rota para adicionar um status a um card
app.post('/adicionarStatus', verifyToken, (req, res) => {
  const { cardId, status } = req.body;
  const userId = req.userId;

  const sql = 'INSERT INTO card_statuses (card_id, user_id, status) VALUES (?, ?, ?)';
  db.query(sql, [cardId, userId, status], (err, result) => {
    if (err) {
      console.error('Erro ao adicionar status:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json({ message: 'Status adicionado com sucesso' });
  });
});

// Rota para buscar os status de um card
app.get('/status/:cardId', verifyToken, (req, res) => {
  const cardId = req.params.cardId;

  const sql = 'SELECT s.*, u.email AS user_email FROM card_statuses s JOIN users u ON s.user_id = u.id WHERE s.card_id = ? ORDER BY s.created_at DESC';
  db.query(sql, [cardId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar os status:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json(result);
  });
});


// Rota para buscar todos os usuários
app.get('/users', (req, res) => {
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Erro ao buscar os usuários:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json(result);
  });
});

// Rota para atualizar o cargo do usuário
app.put('/updateUserRole/:userId', (req, res) => {
  const userId = req.params.userId;
  const { cargo } = req.body;

  const sql = 'UPDATE users SET cargo = ? WHERE id = ?';
  db.query(sql, [cargo, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    res.status(200).json({ message: 'Cargo do usuário atualizado com sucesso' });
  });
});

// Rota para buscar o cargo do usuário
app.get('/cargo', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = 'SELECT cargo FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const cargo = result[0].cargo;
    res.status(200).json({ role: cargo });
  });
});

// Rota de autenticação
app.get('/login', passport.authenticate('azuread-openidconnect'));

// Rota de retorno após a autenticação
app.post('/auth/openid/return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Rota protegida
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Seja bem-vindo, ${req.user.displayName}!`);
  } else {
    res.send('Faça login para acessar esta página.');
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
