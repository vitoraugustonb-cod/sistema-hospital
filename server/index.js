const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
require('dotenv').config();
const { initDb, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não definido no arquivo .env');
  process.exit(1);
}

// --- ESQUEMAS DE VALIDAÇÃO (ZOD) ---

const userSchema = z.object({
  nome: z.string().min(3).max(100),
  identificador: z.string().min(3).max(20),
  senha: z.string().min(3).max(50),
  cargo: z.enum(['TI', 'Medico', 'Enfermeiro', 'Tecnico', 'Recepcao'])
});

const pacienteSchema = z.object({
  nome: z.string().min(3).max(100),
  cpf: z.string().length(14),
  idade: z.number().min(0).max(150).optional(),
  rg: z.string().optional(),
  sexo: z.string().optional(),
  mae: z.string().optional(),
  pai: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional()
});

const evolucaoSchema = z.object({
  texto: z.string().min(10).max(10000),
  assinado_digitalmente: z.boolean().optional()
});

const sinaisVitaisSchema = z.object({
  temp: z.number().min(30).max(45).optional(),
  pa_sistolica: z.number().min(40).max(300).optional(),
  pa_diastolica: z.number().min(30).max(200).optional(),
  fc: z.number().min(20).max(300).optional(),
  fr: z.number().min(5).max(100).optional(),
  sato2: z.number().min(0).max(100).optional(),
  observacoes: z.string().max(500).optional()
});

// Middleware de Validação
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
  }
};

// Função de Auditoria Centralizada
const registrarLog = (userId, acao, detalhes = '') => {
  const dataHora = new Date().toISOString();
  db.run("INSERT INTO logs (user_id, acao, data_hora) VALUES (?, ?, ?)", 
    [userId, `${acao}${detalhes ? ': ' + detalhes : ''}`], 
    (err) => {
      if (err) console.error('Erro ao registrar log de auditoria:', err);
    }
  );
};

// --- SEGURANÇA ---

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.' }
});
app.use(globalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Muitas tentativas de login. Tente novamente após 15 minutos.' }
});

initDb();

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/login', loginLimiter, (req, res) => {
  const identificador = req.body.identificador ? req.body.identificador.trim() : "";
  const senha = req.body.senha ? req.body.senha.trim() : "";
  
  if (!identificador || !senha) {
    return res.status(400).json({ message: 'Identificador e senha são obrigatórios' });
  }

  db.get("SELECT * FROM users WHERE identificador = ?", [identificador], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Erro interno do servidor' });
    if (!user) return res.status(401).json({ message: 'Usuário ou senha inválidos' });

    try {
      const isMatch = await bcrypt.compare(senha, user.senha);
      if (!isMatch) return res.status(401).json({ message: 'Usuário ou senha inválidos' });

      const token = jwt.sign(
        { id: user.id, identificador: user.identificador, cargo: user.cargo, nome: user.nome },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      registrarLog(user.id, 'Login');

      res.json({
        token,
        user: { id: user.id, nome: user.nome, identificador: user.identificador, cargo: user.cargo }
      });
    } catch (bcryptErr) {
      res.status(500).json({ message: 'Erro ao processar senha' });
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Acesso negado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.cargo)) {
    return res.status(403).json({ message: 'Permissão negada para este perfil' });
  }
  next();
};

const clinicalRoles = ['Medico', 'Enfermeiro', 'Tecnico'];

// --- GESTÃO DE USUÁRIOS (TI) ---

app.get('/api/users', authenticateToken, checkRole(['TI']), (req, res) => {
  db.all("SELECT id, nome, identificador, cargo, status FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar usuários' });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, checkRole(['TI']), validate(userSchema), async (req, res) => {
  const { nome, identificador, senha, cargo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    db.run("INSERT INTO users (nome, identificador, senha, cargo) VALUES (?, ?, ?, ?)",
      [nome, identificador, hashedPassword, cargo],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ message: 'Identificador já cadastrado' });
          return res.status(500).json({ message: 'Erro ao criar usuário' });
        }
        registrarLog(req.user.id, 'Criou Usuário', identificador);
        res.status(201).json({ id: this.lastID, message: 'Usuário criado com sucesso' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.delete('/api/users/:id', authenticateToken, checkRole(['TI']), (req, res) => {
  db.run("DELETE FROM users WHERE id = ? AND identificador != 'admin'", [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao excluir' });
    if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado ou protegido' });
    registrarLog(req.user.id, 'Excluiu Usuário', `ID: ${req.params.id}`);
    res.json({ message: 'Usuário excluído com sucesso' });
  });
});

app.post('/api/logout', authenticateToken, (req, res) => {
  registrarLog(req.user.id, 'Logout');
  res.json({ message: 'Logout registrado' });
});

app.get('/api/logs', authenticateToken, checkRole(['TI']), (req, res) => {
  db.all(`
    SELECT l.*, u.nome as user_nome, u.cargo as user_cargo 
    FROM logs l 
    JOIN users u ON l.user_id = u.id 
    ORDER BY l.data_hora DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar logs' });
    res.json(rows);
  });
});

// --- CONFIGURAÇÕES (TI) ---

app.get('/api/settings', authenticateToken, checkRole(['TI']), (req, res) => {
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar configurações' });
    const settingsMap = {};
    rows.forEach(row => settingsMap[row.key] = row.value);
    res.json(settingsMap);
  });
});

app.post('/api/settings', authenticateToken, checkRole(['TI']), (req, res) => {
  const settings = req.body;
  db.serialize(() => {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    Object.keys(settings).forEach(key => stmt.run(key, String(settings[key])));
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ message: 'Erro ao salvar configurações' });
      registrarLog(req.user.id, 'Alterou Configurações');
      res.json({ message: 'Configurações salvas com sucesso' });
    });
  });
});

// --- PACIENTES ---

app.get('/api/pacientes', authenticateToken, checkRole([...clinicalRoles, 'Recepcao']), (req, res) => {
  db.all("SELECT * FROM pacientes WHERE status = 'internado'", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar pacientes' });
    res.json(rows);
  });
});

app.get('/api/pacientes/historico', authenticateToken, checkRole([...clinicalRoles, 'Recepcao']), (req, res) => {
  db.all("SELECT * FROM pacientes WHERE status = 'alta' ORDER BY data_alta DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar histórico' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/alta', authenticateToken, checkRole(['Medico']), (req, res) => {
  const { sumario } = req.body;
  if (!sumario) return res.status(400).json({ message: 'Sumário obrigatório' });

  db.serialize(() => {
    db.run("UPDATE pacientes SET status = 'alta', data_alta = CURRENT_TIMESTAMP, sumario_alta = ? WHERE id = ?", 
      [sumario, req.params.id], function(err) {
        if (err) return res.status(500).json({ message: 'Erro na alta' });
        db.run("UPDATE leitos SET status = 'vago', paciente_id = NULL WHERE paciente_id = ?", [req.params.id]);
        registrarLog(req.user.id, 'Alta Médica', `Paciente ID: ${req.params.id}`);
        res.json({ message: 'Alta realizada' });
      }
    );
  });
});

app.post('/api/pacientes', authenticateToken, checkRole(['Recepcao']), validate(pacienteSchema), (req, res) => {
  const p = req.body;
  db.run(`INSERT INTO pacientes (nome, idade, rg, cpf, sexo, mae, pai, email, telefone, cep, endereco, numero, complemento, bairro, cidade, uf) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
    [p.nome, p.idade, p.rg, p.cpf, p.sexo, p.mae, p.pai, p.email, p.telefone, p.cep, p.endereco, p.numero, p.complemento, p.bairro, p.cidade, p.uf],
    function(err) {
      if (err) return res.status(400).json({ message: 'Erro ao cadastrar (CPF já existe?)' });
      registrarLog(req.user.id, 'Cadastrou Paciente', p.nome);
      res.status(201).json({ id: this.lastID, message: 'Sucesso' });
    }
  );
});

app.patch('/api/pacientes/:id/prioridade', authenticateToken, checkRole(['Medico', 'Enfermeiro']), (req, res) => {
  const { prioridade } = req.body;
  db.run("UPDATE pacientes SET prioridade = ? WHERE id = ?", [prioridade, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro' });
    registrarLog(req.user.id, 'Alterou Prioridade', `ID: ${req.params.id} -> ${prioridade}`);
    res.json({ message: 'Prioridade atualizada' });
  });
});

// --- LEITOS ---

app.get('/api/leitos', authenticateToken, (req, res) => {
  db.all("SELECT l.*, p.nome as paciente_nome FROM leitos l LEFT JOIN pacientes p ON l.paciente_id = p.id", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro' });
    res.json(rows);
  });
});

app.post('/api/leitos/:id/internar', authenticateToken, checkRole(['Recepcao']), (req, res) => {
  const { paciente_id } = req.body;
  db.serialize(() => {
    db.run("UPDATE leitos SET status = 'vago', paciente_id = NULL WHERE paciente_id = ?", [paciente_id]);
    db.run("UPDATE leitos SET status = 'ocupado', paciente_id = ? WHERE id = ?", [paciente_id, req.params.id], function(err) {
      if (err) return res.status(500).json({ message: 'Erro' });
      registrarLog(req.user.id, 'Internou Paciente', `Leito: ${req.params.id}, Paciente: ${paciente_id}`);
      res.json({ message: 'Sucesso' });
    });
  });
});

// --- CLÍNICO (EVOLUÇÕES, SINAIS VITAIS, PRESCRIÇÕES) ---

app.get('/api/pacientes/:id/evolucoes', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT e.*, u.nome as medico_nome FROM evolucoes e JOIN users u ON e.medico_id = u.id WHERE e.paciente_id = ? ORDER BY e.data_hora DESC", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/evolucoes', authenticateToken, checkRole(['Medico']), validate(evolucaoSchema), (req, res) => {
  db.run("INSERT INTO evolucoes (paciente_id, medico_id, texto, assinado_digitalmente) VALUES (?, ?, ?, ?)", 
    [req.params.id, req.user.id, req.body.texto, req.body.assinado_digitalmente ? 1 : 0], function(err) {
      if (err) return res.status(500).json({ message: 'Erro' });
      registrarLog(req.user.id, 'Salvou Evolução', `Paciente ID: ${req.params.id}`);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.post('/api/pacientes/:id/sinais', authenticateToken, checkRole([...clinicalRoles]), validate(sinaisVitaisSchema), (req, res) => {
  const s = req.body;
  db.run(`INSERT INTO sinais_vitais (paciente_id, tecnico_id, temp, pa_sistolica, pa_diastolica, fc, fr, sato2, observacoes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [req.params.id, req.user.id, s.temp, s.pa_sistolica, s.pa_diastolica, s.fc, s.fr, s.sato2, s.observacoes], 
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro' });
      registrarLog(req.user.id, 'Registrou Sinais Vitais', `Paciente ID: ${req.params.id}`);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/pacientes/:id/sinais', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT * FROM sinais_vitais WHERE paciente_id = ? ORDER BY data_hora DESC LIMIT 20", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro' });
    res.json(rows);
  });
});

// --- PRESCRIÇÕES E APRAZAMENTOS ---

app.get('/api/pacientes/:id/prescricoes', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT p.*, u.nome as medico_nome FROM prescricoes p JOIN users u ON p.medico_id = u.id WHERE p.paciente_id = ? ORDER BY p.data_hora DESC", [req.params.id], (err, rows) => {
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/prescricoes', authenticateToken, checkRole(['Medico']), (req, res) => {
  const { item, doses_totais } = req.body;
  db.run("INSERT INTO prescricoes (paciente_id, medico_id, item, doses_totais, doses_restantes, status) VALUES (?,?,?,?,?, 'ativo')", 
    [req.params.id, req.user.id, item, doses_totais, doses_totais], function(err) {
      registrarLog(req.user.id, 'Prescreveu Item', `${item} para Paciente ${req.params.id}`);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.post('/api/aprazamentos', authenticateToken, checkRole(['Enfermeiro']), (req, res) => {
  const { prescricao_id, horarios } = req.body;
  db.serialize(() => {
    const stmt = db.prepare("INSERT INTO aprazamentos (prescricao_id, paciente_id, horario_planejado) VALUES (?, ?, ?)");
    horarios.forEach(h => stmt.run(prescricao_id, req.body.paciente_id, h));
    stmt.finalize();
    registrarLog(req.user.id, 'Realizou Aprazamento', `Prescrição ID: ${prescricao_id}`);
    res.status(201).json({ message: 'Sucesso' });
  });
});

app.post('/api/aprazamentos/:id/checar', authenticateToken, checkRole(['Tecnico', 'Enfermeiro']), (req, res) => {
  db.run("UPDATE aprazamentos SET status = 'realizado', executor_id = ?, data_realizacao = CURRENT_TIMESTAMP WHERE id = ?", 
    [req.user.id, req.params.id], function(err) {
      registrarLog(req.user.id, 'Checou Medicação', `Aprazamento ID: ${req.params.id}`);
      res.json({ message: 'Sucesso' });
    }
  );
});

// --- EXAMES ---

app.post('/api/exames', authenticateToken, checkRole(['Medico']), (req, res) => {
  db.run("INSERT INTO exames (paciente_id, medico_id, tipo, status) VALUES (?, ?, ?, 'Pendente')",
    [req.body.paciente_id, req.user.id, req.body.tipo], function(err) {
      registrarLog(req.user.id, 'Solicitou Exame', req.body.tipo);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/exames', authenticateToken, (req, res) => {
  db.all("SELECT e.*, p.nome as paciente_nome FROM exames e JOIN pacientes p ON e.paciente_id = p.id", (err, rows) => {
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Servidor seguro rodando na porta ${PORT}`));
