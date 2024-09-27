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
  user: 'service.followup',
  password: '@2024aba*',
  server: 'SQLSERVER',
  port: 1443,
  database: 'FOLLOWUP',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Função para formatar a data no formato 'YYYY-MM-DD'
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
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

  // Rota para buscar todos os cards
  app.get('/todosCards', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM cards');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar todos os cards:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para verificar o cargo do usuário
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

  // Rota para salvar o username e gerar token JWT
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

  

// Rota para editar um card existente
app.put('/editarCard/:cardId', verifyToken, async (req, res) => {
    const cardId = req.params.cardId;
    const { titulo, empresa, nome1, contato1, email1, nome2, contato2, email2, descricao } = req.body;
    const userId = req.userId;

    try {
        const result = await pool.request()
            .input('cardId', sql.Int, cardId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM cards WHERE id = @cardId AND user_id = @userId');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Card não encontrado ou você não tem permissão para editá-lo' });
        }

        await pool.request()
            .input('titulo', sql.NVarChar, titulo)
            .input('empresa', sql.NVarChar, empresa)
            .input('nome1', sql.NVarChar, nome1)
            .input('contato1', sql.NVarChar, contato1)
            .input('email1', sql.NVarChar, email1)
            .input('nome2', sql.NVarChar, nome2)
            .input('contato2', sql.NVarChar, contato2)
            .input('email2', sql.NVarChar, email2)
            .input('descricao', sql.NVarChar, descricao)
            .input('cardId', sql.Int, cardId)
            .query('UPDATE cards SET titulo = @titulo, empresa = @empresa, nome1 = @nome1, contato1 = @contato1, email1 = @email1, nome2 = @nome2, contato2 = @contato2, email2 = @email2, descricao = @descricao WHERE id = @cardId');
        
        res.status(200).json({ message: 'Card atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar o card:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});



  // Rota para buscar todas as ligações
  app.get('/ligacoes', verifyToken, async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM ligacoes');
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Erro ao buscar as ligações:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para adicionar uma nova ligação
  app.post('/ligacoes', verifyToken, async (req, res) => {
    const { cliente, inside, produto, programacaoLigacao, situacaoContato, comentarios, proximoContato, ocorrencia } = req.body;
    const userId = req.userId; // O ID do usuário vem do middleware verifyToken

    try {
        await pool.request()
            .input('cliente', sql.NVarChar, cliente)
            .input('inside', sql.NVarChar, inside)
            .input('produto', sql.NVarChar, produto)
            .input('programacaoLigacao', sql.Date, formatDate(programacaoLigacao)) // Formatando a data
            .input('situacaoContato', sql.NVarChar, situacaoContato)
            .input('comentarios', sql.NVarChar, comentarios)
            .input('proximoContato', sql.Date, formatDate(proximoContato)) // Formatando a data
            .input('ocorrencia', sql.NVarChar, ocorrencia)
            .input('userId', sql.Int, userId)
            .query('INSERT INTO ligacoes (cliente, inside, produto, programacao_ligacao, situacao_contato, comentarios, proximo_contato, ocorrencia, user_id) VALUES (@cliente, @inside, @produto, @programacaoLigacao, @situacaoContato, @comentarios, @proximoContato, @ocorrencia, @userId)');
        
        res.status(200).json({ message: 'Ligação adicionada com sucesso' });
    } catch (err) {
        console.error('Erro ao adicionar ligação:', err);
        res.status(500).json({ error: 'Erro ao adicionar ligação' });
    }
  });

  // Rota para editar uma ligação existente
  app.put('/ligacoes/:ligacaoId', verifyToken, async (req, res) => {
    const { cliente, inside, produto, programacaoLigacao, situacaoContato, comentarios, proximoContato, ocorrencia } = req.body;

    try {
        await pool.request()
            .input('cliente', sql.NVarChar, cliente)
            .input('inside', sql.NVarChar, inside)
            .input('produto', sql.NVarChar, produto)
            .input('programacaoLigacao', sql.Date, formatDate(programacaoLigacao))
            .input('situacaoContato', sql.NVarChar, situacaoContato)
            .input('comentarios', sql.NVarChar, comentarios)
            .input('proximoContato', sql.Date, formatDate(proximoContato))
            .input('ocorrencia', sql.NVarChar, ocorrencia)
            .input('ligacaoId', sql.Int, req.params.ligacaoId)
            .query('UPDATE ligacoes SET cliente = @cliente, inside = @inside, produto = @produto, programacao_ligacao = @programacaoLigacao, situacao_contato = @situacaoContato, comentarios = @comentarios, proximo_contato = @proximoContato, ocorrencia = @ocorrencia WHERE id = @ligacaoId');
        
        res.status(200).json({ message: 'Ligação atualizada com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar ligação:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para excluir uma ligação
  app.delete('/ligacoes/:ligacaoId', verifyToken, async (req, res) => {
    const ligacaoId = req.params.ligacaoId;

    try {
        await pool.request()
            .input('ligacaoId', sql.Int, ligacaoId)
            .query('DELETE FROM ligacoes WHERE id = @ligacaoId');

        res.status(200).json({ message: 'Ligação excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir ligação:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

 // Rota para buscar todas as ligações com todos os campos
app.get('/todas-ligacoes', verifyToken, async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          cliente,
          inside,
          produto,
          programacao_ligacao AS programacaoLigacao,
          situacao_contato AS situacaoContato,
          comentarios,
          proximo_contato AS proximoContato,
          ocorrencia
        FROM ligacoes
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Erro ao buscar as ligações:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

  

  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

}).catch(err => {
  console.error('Erro ao conectar ao banco de dados SQL Server:', err);
});
