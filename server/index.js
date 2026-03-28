const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initDb, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'hospital_secret_key_2026';

// --- SEGURANÇA ---

// 1. Proteção de Headers (XSS, Clickjacking, etc.)
app.use(helmet());

// 2. Restrição de CORS (Apenas o frontend oficial pode acessar)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 3. Limite de Tentativas de Login (Prevenção de Brute Force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo de 10 tentativas por IP
  message: { message: 'Muitas tentativas de login. Tente novamente após 15 minutos.' }
});

// Inicializar Banco de Dados
initDb();

// Rota de Login (Com Rate Limit)
app.post('/api/login', loginLimiter, (req, res) => {
  const identificador = req.body.identificador ? req.body.identificador.trim() : "";
  const senha = req.body.senha ? req.body.senha.trim() : "";
  
  if (!identificador || !senha) {
    return res.status(400).json({ message: 'Identificador e senha são obrigatórios' });
  }

  db.get("SELECT * FROM users WHERE identificador = ?", [identificador], async (err, user) => {
    if (err) {
      console.error('Erro interno no servidor');
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos' });
    }

    try {
      const isMatch = await bcrypt.compare(senha, user.senha);

      if (!isMatch) {
        return res.status(401).json({ message: 'Usuário ou senha inválidos' });
      }

      const token = jwt.sign(
        { id: user.id, identificador: user.identificador, cargo: user.cargo, nome: user.nome },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Registrar Log de Login
      db.run("INSERT INTO logs (user_id, acao, data_hora) VALUES (?, ?, ?)", [user.id, 'Login', new Date().toISOString()], (logErr) => {
        if (logErr) console.error('Erro ao registrar log de login');
      });

      res.json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          identificador: user.identificador,
          cargo: user.cargo
        }
      });
    } catch (bcryptErr) {
      res.status(500).json({ message: 'Erro ao processar senha' });
    }
  });
});

// Middleware de Autenticação
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

// Middleware de verificação de Cargo
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.cargo)) {
    return res.status(403).json({ message: 'Permissão negada para este perfil' });
  }
  next();
};

const clinicalRoles = ['Medico', 'Enfermeiro', 'Tecnico', 'TI'];

// --- ROTAS DE GESTÃO DE USUÁRIOS ---

app.get('/api/users', authenticateToken, checkRole(['TI']), (req, res) => {
  db.all("SELECT id, nome, identificador, cargo, status FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar usuários' });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, checkRole(['TI']), async (req, res) => {
  const { nome, identificador, senha, cargo } = req.body;
  if (!nome || !identificador || !senha || !cargo) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    db.run("INSERT INTO users (nome, identificador, senha, cargo) VALUES (?, ?, ?, ?)",
      [nome, identificador, hashedPassword, cargo],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ message: 'Identificador já cadastrado' });
          return res.status(500).json({ message: 'Erro ao criar usuário' });
        }
        res.status(201).json({ id: this.lastID, message: 'Usuário criado com sucesso' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.delete('/api/users/:id', authenticateToken, checkRole(['TI']), (req, res) => {
  db.run("DELETE FROM users WHERE id = ? AND identificador != '000.000.000-00'", [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao excluir' });
    if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado ou protegido' });
    res.json({ message: 'Usuário excluído com sucesso' });
  });
});

app.post('/api/logout', authenticateToken, (req, res) => {
  db.run("INSERT INTO logs (user_id, acao, data_hora) VALUES (?, ?, ?)", [req.user.id, 'Logout', new Date().toISOString()], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao registrar logout' });
    res.json({ message: 'Logout registrado' });
  });
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

// --- ROTAS DE CONFIGURAÇÕES ---

app.get('/api/settings', authenticateToken, (req, res) => {
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar configurações' });
    const settingsMap = {};
    rows.forEach(row => {
      settingsMap[row.key] = row.value;
    });
    res.json(settingsMap);
  });
});

app.post('/api/settings', authenticateToken, checkRole(['TI']), (req, res) => {
  const settings = req.body;
  db.serialize(() => {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    Object.keys(settings).forEach(key => {
      stmt.run(key, String(settings[key]));
    });
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ message: 'Erro ao salvar configurações' });
      res.json({ message: 'Configurações salvas com sucesso' });
    });
  });
});

// --- ROTAS DE PACIENTES ---

app.get('/api/pacientes', authenticateToken, (req, res) => {
  db.all("SELECT * FROM pacientes WHERE status = 'internado'", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar pacientes' });
    res.json(rows);
  });
});

app.get('/api/pacientes/historico', authenticateToken, (req, res) => {
  db.all("SELECT * FROM pacientes WHERE status = 'alta' ORDER BY data_alta DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar histórico' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/alta', authenticateToken, checkRole(['Medico', 'TI']), (req, res) => {
  const { sumario } = req.body;
  const paciente_id = req.params.id;

  if (!sumario) return res.status(400).json({ message: 'O sumário de alta é obrigatório' });

  db.serialize(() => {
    // 1. Atualizar Paciente
    db.run("UPDATE pacientes SET status = 'alta', data_alta = CURRENT_TIMESTAMP, sumario_alta = ? WHERE id = ?", 
    [sumario, paciente_id], function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao processar alta' });
      
      // 2. Liberar Leito Automaticamente
      db.run("UPDATE leitos SET status = 'vago', paciente_id = NULL WHERE paciente_id = ?", [paciente_id], function(err) {
        if (err) return res.status(500).json({ message: 'Erro ao liberar leito' });
        res.json({ message: 'Alta médica realizada com sucesso e leito liberado!' });
      });
    });
  });
});

app.post('/api/pacientes', authenticateToken, checkRole(['Recepcao', 'TI']), (req, res) => {
  const { 
    nome, idade, rg, cpf, sexo, mae, pai, email, telefone, 
    cep, endereco, numero, complemento, bairro, cidade, uf 
  } = req.body;

  if (!nome || !cpf) return res.status(400).json({ message: 'Nome e CPF são obrigatórios' });

  db.run(`INSERT INTO pacientes (
    nome, idade, rg, cpf, sexo, mae, pai, email, telefone, 
    cep, endereco, numero, complemento, bairro, cidade, uf
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
  [nome, idade, rg, cpf, sexo, mae, pai, email, telefone, cep, endereco, numero, complemento, bairro, cidade, uf],
  function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ message: 'CPF já cadastrado' });
      return res.status(500).json({ message: 'Erro ao cadastrar paciente' });
    }
    res.status(201).json({ id: this.lastID, message: 'Paciente cadastrado com sucesso' });
  });
});

app.patch('/api/pacientes/:id/prioridade', authenticateToken, checkRole(['Medico', 'Enfermeiro', 'TI']), (req, res) => {
  const { prioridade } = req.body;
  if (!['Alta', 'Média', 'Baixa'].includes(prioridade)) {
    return res.status(400).json({ message: 'Prioridade inválida' });
  }
  db.run("UPDATE pacientes SET prioridade = ? WHERE id = ?", [prioridade, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao atualizar prioridade' });
    res.json({ message: 'Prioridade atualizada com sucesso' });
  });
});

// --- ROTAS DE LEITOS (CENSO) ---

app.get('/api/leitos', authenticateToken, (req, res) => {
  db.all(`
    SELECT l.*, p.nome as paciente_nome 
    FROM leitos l 
    LEFT JOIN pacientes p ON l.paciente_id = p.id
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar leitos' });
    res.json(rows);
  });
});

app.post('/api/leitos/:id/internar', authenticateToken, checkRole(['Recepcao', 'TI']), (req, res) => {
  const { paciente_id } = req.body;
  const leito_id = req.params.id;
  if (!paciente_id) return res.status(400).json({ message: 'Paciente é obrigatório' });
  db.serialize(() => {
    db.run("UPDATE leitos SET status = 'vago', paciente_id = NULL WHERE paciente_id = ?", [paciente_id]);
    db.run("UPDATE leitos SET status = 'ocupado', paciente_id = ? WHERE id = ?", [paciente_id, leito_id], function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao internar paciente' });
      res.json({ message: 'Paciente internado com sucesso' });
    });
  });
});

app.post('/api/leitos/:id/liberar', authenticateToken, checkRole(['Recepcao', 'Enfermeiro', 'TI']), (req, res) => {
  db.run("UPDATE leitos SET status = 'vago', paciente_id = NULL WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao liberar leito' });
    res.json({ message: 'Leito liberado com sucesso' });
  });
});

// --- ROTAS CLÍNICAS (PEP) ---

app.get('/api/pacientes/:id/evolucoes', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT e.*, u.nome as medico_nome FROM evolucoes e JOIN users u ON e.medico_id = u.id WHERE e.paciente_id = ? ORDER BY e.data_hora DESC", 
  [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar evoluções' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/evolucoes', authenticateToken, checkRole(['Medico']), (req, res) => {
  const { texto, assinado_digitalmente } = req.body;
  db.run("INSERT INTO evolucoes (paciente_id, medico_id, texto, assinado_digitalmente) VALUES (?, ?, ?, ?)", 
  [req.params.id, req.user.id, texto, assinado_digitalmente ? 1 : 0], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao salvar evolução' });
    res.status(201).json({ id: this.lastID });
  });
});

app.get('/api/pacientes/:id/prescricoes', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT p.*, u.nome as medico_nome FROM prescricoes p JOIN users u ON p.medico_id = u.id WHERE p.paciente_id = ? ORDER BY p.data_hora DESC", 
  [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar prescrições' });
    res.json(rows);
  });
});

app.get('/api/pacientes/:id/exames', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all(`
    SELECT e.*, u.nome as medico_nome 
    FROM exames e 
    JOIN users u ON e.medico_id = u.id 
    WHERE e.paciente_id = ? 
    ORDER BY e.data_solicitacao DESC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar exames' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/prescricoes', authenticateToken, checkRole(['Medico']), (req, res) => {
  const { item, dosagem, via, intervalo, tipo, doses_totais, assinado_digitalmente } = req.body;
  const doses = doses_totais || 1;
  db.run("INSERT INTO prescricoes (paciente_id, medico_id, item, dosagem, via, intervalo, tipo, doses_totais, doses_restantes, assinado_digitalmente) VALUES (?,?,?,?,?,?,?,?,?,?)", 
  [req.params.id, req.user.id, item, dosagem, via, intervalo, tipo, doses, doses, assinado_digitalmente ? 1 : 0], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao salvar prescrição' });
    res.status(201).json({ id: this.lastID });
  });
});

app.post('/api/prescricoes/:id/baixar-dose', authenticateToken, checkRole(['Enfermeiro', 'Tecnico']), (req, res) => {
  db.get("SELECT doses_restantes FROM prescricoes WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ message: 'Prescrição não encontrada' });
    if (row.doses_restantes <= 0) return res.status(400).json({ message: 'Esta medicação já foi finalizada' });
    const novasDoses = row.doses_restantes - 1;
    const status = novasDoses === 0 ? 'finalizado' : 'ativo';
    db.run("UPDATE prescricoes SET doses_restantes = ?, status = ? WHERE id = ?", 
      [novasDoses, status, req.params.id], function(err) {
        if (err) return res.status(500).json({ message: 'Erro ao descontar dose' });
        res.json({ message: 'Dose descontada com sucesso', doses_restantes: novasDoses, status });
      }
    );
  });
});

// --- ROTAS DE ENFERMAGEM (APRAZAMENTO) ---

app.get('/api/pacientes/:id/aprazamentos', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT a.*, p.item, p.dosagem, p.via, p.intervalo FROM aprazamentos a JOIN prescricoes p ON a.prescricao_id = p.id WHERE a.paciente_id = ?", 
  [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar aprazamentos' });
    res.json(rows);
  });
});

app.post('/api/aprazamentos', authenticateToken, checkRole(['Enfermeiro']), (req, res) => {
  const { prescricao_id, paciente_id, horarios } = req.body; 
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) return res.status(400).json({ message: 'Selecione ao menos um horário para aprazar' });
  db.get("SELECT doses_restantes FROM prescricoes WHERE id = ?", [prescricao_id], (err, row) => {
    if (err || !row) return res.status(404).json({ message: 'Prescrição não encontrada' });
    if (row.doses_restantes < horarios.length) return res.status(400).json({ message: `Saldo insuficiente (${row.doses_restantes} doses restantes)` });
    const novasDoses = row.doses_restantes - horarios.length;
    const novoStatus = novasDoses === 0 ? 'finalizado' : 'ativo';
    db.serialize(() => {
      const stmt = db.prepare("INSERT INTO aprazamentos (prescricao_id, paciente_id, horario_planejado) VALUES (?, ?, ?)");
      horarios.forEach(h => stmt.run(prescricao_id, paciente_id, h));
      stmt.finalize();
      db.run("UPDATE prescricoes SET doses_restantes = ?, status = ? WHERE id = ?", [novasDoses, novoStatus, prescricao_id], function(err) {
          if (err) return res.status(500).json({ message: 'Erro ao processar doses' });
          res.status(201).json({ message: 'Aprazamento realizado!', restantes: novasDoses });
        }
      );
    });
  });
});

// --- ROTAS DE EXAMES ---

app.get('/api/exames', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  let query = `
    SELECT e.*, p.nome as paciente_nome, p.cpf as paciente_cpf, u.nome as medico_nome 
    FROM exames e 
    JOIN pacientes p ON e.paciente_id = p.id
    JOIN users u ON e.medico_id = u.id
  `;
  const params = [];
  if (req.user.cargo === 'Medico') {
    query += ` WHERE e.medico_id = ?`;
    params.push(req.user.id);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar exames' });
    res.json(rows);
  });
});

app.post('/api/exames', authenticateToken, checkRole(['Medico', 'TI']), (req, res) => {
  const { paciente_id, tipo } = req.body;
  if (!paciente_id || !tipo) return res.status(400).json({ message: 'Paciente e tipo são obrigatórios' });
  db.run("INSERT INTO exames (paciente_id, medico_id, tipo, status) VALUES (?, ?, ?, 'Pendente')",
    [paciente_id, req.user.id, tipo],
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao solicitar exame' });
      res.status(201).json({ id: this.lastID, message: 'Solicitação criada' });
    }
  );
});

app.post('/api/exames/:id/encaminhar', authenticateToken, checkRole(['Enfermeiro', 'TI']), (req, res) => {
  db.run("UPDATE exames SET status = 'Aguardando Coleta', enfermeiro_id = ?, data_encaminhamento = CURRENT_TIMESTAMP WHERE id = ?",
    [req.user.id, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao encaminhar' });
      res.json({ message: 'Exame encaminhado' });
    }
  );
});

app.post('/api/exames/:id/coleta', authenticateToken, checkRole(['Tecnico', 'Enfermeiro', 'TI']), (req, res) => {
  db.run("UPDATE exames SET status = 'Em Coleta', tecnico_id = ?, data_coleta = CURRENT_TIMESTAMP WHERE id = ?",
    [req.user.id, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao iniciar coleta' });
      res.json({ message: 'Coleta iniciada' });
    }
  );
});

app.post('/api/exames/:id/concluir', authenticateToken, checkRole(['Tecnico', 'Enfermeiro', 'TI']), (req, res) => {
  db.run("UPDATE exames SET status = 'Concluído' WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao concluir exame' });
      res.json({ message: 'Exame concluído' });
    }
  );
});

app.post('/api/exames/:id/laudar', authenticateToken, checkRole(['Medico', 'TI']), (req, res) => {
  const { resultado } = req.body;
  db.run("UPDATE exames SET resultado = ?, status = 'Concluído' WHERE id = ?",
    [resultado, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao salvar laudo' });
      res.json({ message: 'Exame laudado com sucesso' });
    }
  );
});

// --- ROTAS DE TÉCNICO (APRAZAMENTOS) ---

app.post('/api/aprazamentos/:id/checar', authenticateToken, checkRole(['Tecnico', 'Enfermeiro']), (req, res) => {
  db.run("UPDATE aprazamentos SET status = 'realizado', executor_id = ?, data_realizacao = CURRENT_TIMESTAMP WHERE id = ?", 
  [req.user.id, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao checar medicação' });
    res.json({ message: 'Medicação checada com sucesso' });
  });
});

// --- ROTAS DE SINAIS VITAIS ---

app.get('/api/pacientes/:id/sinais', authenticateToken, checkRole(clinicalRoles), (req, res) => {
  db.all("SELECT * FROM sinais_vitais WHERE paciente_id = ? ORDER BY data_hora DESC LIMIT 20", 
  [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar sinais vitais' });
    res.json(rows);
  });
});

app.post('/api/pacientes/:id/sinais', authenticateToken, checkRole(['Medico', 'Tecnico', 'Enfermeiro', 'TI']), (req, res) => {
  const { temp, pa_sistolica, pa_diastolica, fc, fr, sato2, observacoes } = req.body;
  db.run(`INSERT INTO sinais_vitais (paciente_id, tecnico_id, temp, pa_sistolica, pa_diastolica, fc, fr, sato2, observacoes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [req.params.id, req.user.id, temp, pa_sistolica, pa_diastolica, fc, fr, sato2, observacoes], 
    function(err) {
      if (err) return res.status(500).json({ message: 'Erro ao salvar sinais vitais' });
      res.status(201).json({ id: this.lastID, message: 'Sinais vitais registrados' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
