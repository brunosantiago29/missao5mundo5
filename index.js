require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(helmet());

const secretKey = process.env.SECRET_KEY || 'uma_chave_secreta_forte';
const port = process.env.PORT || 3000;

// Mock de dados
const users = [
  { username: "admin", password: "senha123", id: 1, perfil: "admin" },
  { username: "user", password: "senha456", id: 2, perfil: "user" }
];

function generateToken(user) {
  return jwt.sign({ userId: user.id, perfil: user.perfil }, secretKey, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });
  
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(400).json({ message: 'Token inválido' });
    
    req.user = decoded;
    next();
  });
}

function protectRoute(perfilRequired) {
  return function(req, res, next) {
    verifyToken(req, res, () => {
      if (perfilRequired && req.user.perfil !== perfilRequired) {
        return res.status(403).json({ message: 'Permissão negada' });
      }
      next();
    });
  };
}

function getContracts(empresa) {
  // Tratamento contra injection
  const sanitizedEmpresa = empresa.replace(/[^a-zA-Z0-9]/g, '');
  
  // Simulação de consulta ao banco de dados
  return [{ empresa: sanitizedEmpresa, contrato: "Contrato 1" }];
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) return res.status(401).json({ message: 'Usuário ou senha incorretos' });
  
  const token = generateToken(user);
  res.json({ token });
});

app.get('/api/users', protectRoute('admin'), (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username, perfil: u.perfil })));
});

app.get('/api/me', verifyToken, (req, res) => {
  const { userId } = req.user;
  const user = users.find(u => u.id === userId);
  res.json({ id: userId, perfil: user.perfil });
});

app.get('/api/contracts/:empresa', protectRoute('admin'), (req, res) => {
  const { empresa } = req.params;
  
  const contracts = getContracts(empresa);
  res.json(contracts);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
