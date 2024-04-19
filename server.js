const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const app = express();
const port = 3001;

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

// Inicialização do Passport
app.use(passport.initialize());

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
