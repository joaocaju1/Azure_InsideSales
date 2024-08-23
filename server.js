const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const sql = require('mssql'); // Usar mssql para SQL Server
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Configuração da conexão com o SQL Server
const dbConfig = {
  user: 'service.followup', // Substitua pelo seu usuário do SQL Server
  password: '@2024aba*', // Substitua pela sua senha do SQL Server
  server: 'SQLSERVER', // Substitua pelo endereço do seu servidor SQL Server++++
  port: 1443,
  database: 'FOLLOWUP',
  options: {
    encrypt: true, // Use caso esteja utilizando o Azure SQL. Caso contrário, pode ser false.
    trustServerCertificate: true // Adicione isso se estiver testando localmente e não tiver um certificado SSL
  }
};

// Conectar ao banco de dados SQL Server
sql.connect(dbConfig).then(pool => {
  if (pool.connected) {
    console.log('Conectado ao banco de dados SQL Server');
  }

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

  // Rota para buscar os cards visíveis ao usuário
  app.get('/cards', verifyToken, async (req, res) => {
    const userId = req.userId;

    try {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM cards WHERE visible_to = @userId OR user_id = @userId');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar todos os cards (independente do usuário)
  app.get('/todosCards', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM cards');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar todos os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para verificar o cargo do usuário e redirecionar
  app.get('/checkUserRole', async (req, res) => {
    const { email } = req.query;

    try {
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT cargo FROM users WHERE email = @email');

      if (result.recordset.length === 0) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const cargo = result.recordset[0].cargo;

      if (cargo === 'MEMBRO') {
        res.redirect('/membro');
      } else {
        res.redirect('/');
      }
    } catch (err) {
      console.error('Erro ao buscar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para receber e armazenar o username e gerar token JWT
  app.post('/saveUsername', async (req, res) => {
    const { username } = req.body;

    try {
      let result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query('SELECT * FROM users WHERE email = @username');

      if (result.recordset.length === 0) {
        result = await pool.request()
          .input('username', sql.NVarChar, username)
          .input('cargo', sql.NVarChar, 'MEMBRO')
          .query('INSERT INTO users (email, cargo) VALUES (@username, @cargo); SELECT SCOPE_IDENTITY() AS id');

        const userId = result.recordset[0].id;
        const token = generateToken(userId);

        res.json({ token });
      } else {
        const userId = result.recordset[0].id;
        const token = generateToken(userId);

        res.json({ token });
      }
    } catch (err) {
      console.log('Erro ao verificar/inserir usuário:', err);
      return res.status(500).send('Erro interno do servidor');
    }
  });

  // Rota para adicionar um novo card
  app.post('/adicionarCard', verifyToken, async (req, res) => {
    const { titulo, empresa, razaoSocial, cnpj, cpf, endereco, contato1, contato2, email1, email2, nome1, nome2, descricao, visibleTo } = req.body;
    const userId = req.userId;

    try {
      await pool.request()
        .input('titulo', sql.NVarChar, titulo)
        .input('empresa', sql.NVarChar, empresa)
        .input('razaoSocial', sql.NVarChar, razaoSocial)
        .input('cnpj', sql.NVarChar, cnpj)
        .input('cpf', sql.NVarChar, cpf)
        .input('endereco', sql.NVarChar, endereco)
        .input('contato1', sql.NVarChar, contato1)
        .input('contato2', sql.NVarChar, contato2)
        .input('email1', sql.NVarChar, email1)
        .input('email2', sql.NVarChar, email2)
        .input('nome1', sql.NVarChar, nome1)
        .input('nome2', sql.NVarChar, nome2)
        .input('descricao', sql.NVarChar, descricao)
        .input('userId', sql.Int, userId)
        .input('visibleTo', sql.Int, visibleTo)
        .query('INSERT INTO cards (titulo, empresa, razao_social, cnpj, cpf, endereco, contato1, contato2, email1, email2, nome1, nome2, descricao, user_id, visible_to) VALUES (@titulo, @empresa, @razaoSocial, @cnpj, @cpf, @endereco, @contato1, @contato2, @email1, @email2, @nome1, @nome2, @descricao, @userId, @visibleTo)');
      
      res.status(200).json({ message: 'Novo card adicionado com sucesso' });
    } catch (err) {
      console.error('Erro ao inserir novo card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/editarCard/:cardId', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;
    const { empresa, nome1, contato1, email1, nome2, contato2, email2, descricao } = req.body;
    const userId = req.userId;

    try {
      const result = await pool.request()
        .input('cardId', sql.Int, cardId)
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM cards WHERE id = @cardId AND user_id = @userId');

      if (result.recordset.length === 0) {
        res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
        return;
      }

      await pool.request()
        .input('empresa', sql.NVarChar, empresa)
        .input('nome1', sql.NVarChar, nome1)
        .input('contato1', sql.NVarChar, contato1)
        .input('email1', sql.NVarChar, email1)
        .input('nome2', sql.NVarChar, nome2)
        .input('contato2', sql.NVarChar, contato2)
        .input('email2', sql.NVarChar, email2)
        .input('descricao', sql.NVarChar, descricao)
        .input('cardId', sql.Int, cardId)
        .query('UPDATE cards SET empresa = @empresa, nome1 = @nome1, contato1 = @contato1, email1 = @email1, nome2 = @nome2, contato2 = @contato2, email2 = @email2, descricao = @descricao WHERE id = @cardId');
      
      res.status(200).json({ message: 'Card atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para excluir um card específico
  app.delete('/excluirCard/:cardId', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;
    const userId = req.userId;

    try {
      const result = await pool.request()
        .input('cardId', sql.Int, cardId)
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM cards WHERE id = @cardId AND user_id = @userId');

      if (result.recordset.length === 0) {
        res.status(404).json({ error: 'Card não encontrado ou não autorizado' });
        return;
      }

      // Primeiro exclua os status associados ao card
      await pool.request()
        .input('cardId', sql.Int, cardId)
        .query('DELETE FROM card_statuses WHERE card_id = @cardId');

      // Então, exclua o card
      await pool.request()
        .input('cardId', sql.Int, cardId)
        .query('DELETE FROM cards WHERE id = @cardId');

      res.status(200).json({ message: 'Card excluído com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/cards/:cardId', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;

    try {
      const result = await pool.request()
        .input('cardId', sql.Int, cardId)
        .query('SELECT * FROM cards WHERE id = @cardId');

      if (result.recordset.length === 0) {
        res.status(404).json({ error: 'Card não encontrado' });
        return;
      }

      res.status(200).json(result.recordset[0]);
    } catch (err) {
      console.error('Erro ao buscar o card:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para adicionar um status a um card
  app.post('/adicionarStatus', verifyToken, async (req, res) => {
    const { cardId, status } = req.body;
    const userId = req.userId;

    if (!cardId || !status) {
      return res.status(400).json({ error: 'Card ID e status são obrigatórios' });
    }

    try {
      await pool.request()
        .input('cardId', sql.Int, cardId)
        .input('userId', sql.Int, userId)
        .input('status', sql.NVarChar, status)
        .query('INSERT INTO card_statuses (card_id, user_id, status) VALUES (@cardId, @userId, @status)');
      
      res.status(200).json({ message: 'Status adicionado com sucesso' });
    } catch (err) {
      console.error('Erro ao adicionar status:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar os status de um card
  app.get('/status/:cardId', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;

    try {
      const result = await pool.request()
        .input('cardId', sql.Int, cardId)
        .query('SELECT s.*, u.email AS user_email FROM card_statuses s JOIN users u ON s.user_id = u.id WHERE s.card_id = @cardId ORDER BY s.created_at DESC');

      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar os status:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar todos os usuários
  app.get('/users', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM users');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar os usuários:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para atualizar o cargo do usuário
  app.put('/updateUserRole/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { cargo } = req.body;

    try {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('cargo', sql.NVarChar, cargo)
        .query('UPDATE users SET cargo = @cargo WHERE id = @userId');
      
      res.status(200).json({ message: 'Cargo do usuário atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar o cargo do usuário
  app.get('/cargo', verifyToken, async (req, res) => {
    const userId = req.userId;

    try {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT cargo FROM users WHERE id = @userId');

      if (result.recordset.length === 0) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const cargo = result.recordset[0].cargo;
      res.status(200).json({ role: cargo });
    } catch (err) {
      console.error('Erro ao buscar o cargo do usuário:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar o histórico completo de status de um card
  app.get('/status/:cardId/full', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;

    try {
      const result = await pool.request()
        .input('cardId', sql.Int, cardId)
        .query('SELECT s.*, u.email AS user_email FROM card_statuses s JOIN users u ON s.user_id = u.id WHERE s.card_id = @cardId ORDER BY s.created_at DESC');

      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar o histórico completo de status:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
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

}).catch(err => {
  console.error('Erro ao conectar ao banco de dados SQL Server:', err);
});
