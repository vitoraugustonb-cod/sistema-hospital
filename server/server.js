const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const supabase = require('./supabaseClient');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 20) {
  console.error('ERRO CRÍTICO: JWT_SECRET fraco ou não definido no arquivo .env');
  process.exit(1);
}

// --- CONFIGURAÇÃO DE SEGURANÇA ---
app.use(helmet()); 
app.use(cors({
  origin: 'http://localhost:5173', // Restringe apenas ao seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Limitador de requisições para evitar ataques de força bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas por IP
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- ESQUEMAS DE VALIDAÇÃO (ZOD) ---
const userSchema = z.object({
  nome: z.string().trim().min(3).max(100),
  identificador: z.string().trim().min(3).max(50),
  senha: z.string().min(4),
  cargo: z.enum(['TI', 'Medico', 'Enfermeiro', 'Tecnico', 'Recepcao'])
});

const loginSchema = z.object({
  identificador: z.string().trim().min(1),
  senha: z.string().min(1)
});

// --- MIDDLEWARES DE PROTEÇÃO ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Acesso negado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Sessão expirada' });
    req.user = user;
    next();
  });
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.cargo)) {
    return res.status(403).json({ message: 'Acesso negado: Permissão insuficiente' });
  }
  next();
};

// --- ROTA DE LOGIN ---
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { identificador, senha } = loginSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, identificador, senha, cargo')
      .eq('identificador', identificador)
      .single();

    if (error || !user) {
      // Mensagem genérica para evitar enumeração de usuários
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      JWT_SECRET,
      { expiresIn: '8h', algorithm: 'HS256' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        identificador: user.identificador,
        cargo: user.cargo
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Dados inválidos' });
    console.error('[ERRO LOGIN]:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});


app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// --- ROTAS DE USUÁRIOS (Protegidas: Apenas TI) ---
app.get('/api/users', authenticateToken, checkRole(['TI']), async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, nome, identificador, cargo');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateToken, checkRole(['TI']), async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);
    validatedData.senha = await bcrypt.hash(validatedData.senha, 10);

    const { data, error } = await supabase.from('users').insert([validatedData]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ error: error.message });
  }
});

// --- ROTAS DE PACIENTES (Protegidas: Clínicos e Recepção) ---
const clinicalRoles = ['TI', 'Medico', 'Enfermeiro', 'Tecnico', 'Recepcao'];

app.get('/api/pacientes', authenticateToken, checkRole(clinicalRoles), async (req, res) => {
  try {
    const { data, error } = await supabase.from('pacientes').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pacientes/:id', authenticateToken, checkRole(clinicalRoles), async (req, res) => {
  try {
    const { data, error } = await supabase.from('pacientes').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Paciente não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pacientes', authenticateToken, checkRole(['TI', 'Recepcao']), async (req, res) => {
  try {
    const validatedData = pacienteSchema.parse(req.body);
    const { data, error } = await supabase.from('pacientes').insert([validatedData]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pacientes/:id', authenticateToken, checkRole(['TI', 'Medico', 'Enfermeiro']), async (req, res) => {
  try {
    const { data, error } = await supabase.from('pacientes').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: 'Paciente não encontrado' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/pacientes/:id', authenticateToken, checkRole(['TI']), async (req, res) => {
  try {
    const { error } = await supabase.from('pacientes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Paciente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Seguro Supabase rodando na porta ${PORT}`);
});
