const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const mysql = require('mysql');
const cors = require('cors'); // Adicionando o pacote cors
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


const app = express();
const port = 3001;

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  port: 3306,
  password: '@102030Irigotayndu',
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
  // Obter o token JWT do cabeçalho da solicitação
  const token = req.headers.authorization;

  // Verificar se o token JWT está presente
  if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
  }

  // Verificar e decodificar o token JWT
  jwt.verify(token.split(' ')[1], 'chave_secreta', (err, decoded) => {
      if (err) {
          return res.status(401).json({ message: 'Token inválido' });
      }
      
      // Adicionar o ID do usuário decodificado ao objeto de solicitação (req)
      req.userId = decoded.userId;
      next();
  });
};

// Rota para buscar todos os cards
app.get('/cards', verifyToken, (req, res) => {
  const userId = req.userId; // ID do usuário extraído do token JWT

  // Consulta SQL para selecionar todos os cards do usuário
  const sql = 'SELECT * FROM cards WHERE user_id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    console.log('Cards encontrados:', result);
    res.status(200).json(result); // Retorna os cards encontrados
  });
});





// Rota para receber e armazenar o username e gerar token JWT
app.post('/saveUsername', (req, res) => {
  const { username } = req.body;

  // Verifica se o usuário já existe no banco de dados
  db.query('SELECT * FROM users WHERE email = ?', [username], (err, result) => {
      if (err) {
          console.log('Erro ao verificar usuário:', err);
          return res.status(500).send('Erro interno do servidor');
      }

      // Se o usuário não existir, insere-o no banco de dados com cargo padrão 'VENDEDOR'
      if (result.length === 0) {
          db.query('INSERT INTO users (email, cargo) VALUES (?, ?)', [username, 'VENDEDOR'], (err, result) => {
              if (err) {
                  console.log('Erro ao inserir usuário:', err);
                  return res.status(500).send('Erro interno do servidor');
              }

              console.log('Usuário inserido com sucesso');
              const userId = result.insertId; // Obtém o ID do usuário inserido
              const token = generateToken(userId); // Gera o token JWT

              res.json({ token }); // Retorna o token JWT
          });
      } else {
          console.log('Usuário já existe');
          const userId = result[0].id; // Obtém o ID do usuário existente
          console.log('O Id do usuario obtido é este:', userId);
          const token = generateToken(userId); // Gera o token JWT
          console.log('O Token do usuario obtido é este:', token);


          res.json({ token }); // Retorna o token JWT
      }
  });
});

// Rota para adicionar um novo card
app.post('/adicionarCard', verifyToken, (req, res) => {
  const { titulo, empresa, contato1, contato2, descricao } = req.body;
  const userId = req.userId; // ID do usuário extraído do token JWT

  // Inserir os dados na tabela 'cards'
  const sql = 'INSERT INTO cards (titulo, empresa, contato1, contato2, descricao, user_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [titulo, empresa, contato1, contato2, descricao, userId], (err, result) => {
      if (err) {
          console.error('Erro ao inserir novo card:', err);
          res.status(500).json({ error: 'Erro interno do servidor' });
          return;
      }
      console.log('Novo card adicionado com sucesso');
      res.status(200).json({ message: 'Novo card adicionado com sucesso' });
  });
});

// Rota para atualizar um card existente
app.put('/editarCard/:cardId', verifyToken, (req, res) => {
  const cardId = req.params.cardId;
  const { titulo, empresa, contato1, contato2, descricao } = req.body;
  const userId = req.userId; // ID do usuário extraído do token JWT

  // Verificar se o card pertence ao usuário
  db.query('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId], (err, result) => {
    if (err) {
      console.error('Erro ao verificar o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    // Se o card não for encontrado ou não pertencer ao usuário, retornar um erro
    if (result.length === 0) {
      res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
      return;
    }

    // Atualizar os dados do card
    const sql = 'UPDATE cards SET titulo = ?, empresa = ?, contato1 = ?, contato2 = ?, descricao = ? WHERE id = ?';
    db.query(sql, [titulo, empresa, contato1, contato2, descricao, cardId], (err, result) => {
      if (err) {
        console.error('Erro ao atualizar o card:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      console.log('Card atualizado com sucesso');
      res.status(200).json({ message: 'Card atualizado com sucesso' });
    });
  });
});

// Rota para excluir um card específico
app.delete('/excluirCard/:cardId', verifyToken, (req, res) => {
  const cardId = req.params.cardId;
  const userId = req.userId; // ID do usuário extraído do token JWT

  // Verificar se o card pertence ao usuário
  db.query('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId], (err, result) => {
      if (err) {
          console.error('Erro ao verificar o card:', err);
          res.status(500).json({ error: 'Erro interno do servidor' });
          return;
      }
      // Se o card não for encontrado ou não pertencer ao usuário, retornar um erro
      if (result.length === 0) {
          res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
          return;
      }

      // Excluir o card do banco de dados
      db.query('DELETE FROM cards WHERE id = ?', [cardId], (err, result) => {
          if (err) {
              console.error('Erro ao excluir o card:', err);
              res.status(500).json({ error: 'Erro interno do servidor' });
              return;
          }
          console.log('Card excluído com sucesso');
          res.status(200).json({ message: 'Card excluído com sucesso' });
      });
  });
});

// Rota para buscar todos os usuários
app.get('/users', (req, res) => {
  // Consulta SQL para selecionar todos os usuários
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Erro ao buscar os usuários:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    console.log('Usuários encontrados:', result);
    res.status(200).json(result); // Retorna os usuários encontrados
  });
});

// Rota para atualizar o cargo do usuário
app.put('/updateUserRole/:userId', (req, res) => {
  const userId = req.params.userId;
  const { cargo } = req.body;

  // Atualizar o campo 'cargo' na tabela de usuários
  const sql = 'UPDATE users SET cargo = ? WHERE id = ?';
  db.query(sql, [cargo, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    console.log('Cargo do usuário atualizado com sucesso');
    res.status(200).json({ message: 'Cargo do usuário atualizado com sucesso' });
  });
});

// Rota para buscar o cargo do usuário
app.get('/cargo', verifyToken, (req, res) => {
  const userId = req.userId; // ID do usuário extraído do token JWT

  // Consulta SQL para selecionar o cargo do usuário
  const sql = 'SELECT cargo FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (result.length === 0) {
      console.error('Usuário não encontrado');
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const cargo = result[0].cargo;
    console.log('Cargo do usuário:', cargo);
    res.status(200).json({ role: cargo }); // Retorna o cargo do usuário
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
