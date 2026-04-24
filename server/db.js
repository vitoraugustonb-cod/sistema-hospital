const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(() => {
    // Tabela de Usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      identificador TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT CHECK(cargo IN ('TI', 'Medico', 'Enfermeiro', 'Tecnico', 'Recepcao')) NOT NULL,
      status TEXT DEFAULT 'ativo'
    )`);

    // Tabela de Pacientes (Com coluna de solicitação de internação)
    db.run(`CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      idade INTEGER,
      rg TEXT,
      cpf TEXT UNIQUE,
      sexo TEXT,
      mae TEXT,
      pai TEXT,
      email TEXT,
      telefone TEXT,
      cep TEXT,
      endereco TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      status TEXT DEFAULT 'internado',
      prioridade TEXT CHECK(prioridade IN ('Alta', 'Média', 'Baixa')) DEFAULT 'Alta',
      data_internacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_alta DATETIME,
      sumario_alta TEXT
    )`);

    // Tabela de Leitos (Com vínculo de paciente)
    db.run(`CREATE TABLE IF NOT EXISTS leitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      ala TEXT NOT NULL,
      status TEXT CHECK(status IN ('vago', 'ocupado', 'limpeza', 'manutencao')) DEFAULT 'vago',
      paciente_id INTEGER REFERENCES pacientes(id)
    )`);

    // Tabela de Exames
    db.run(`CREATE TABLE IF NOT EXISTS exames (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico_id INTEGER NOT NULL,
      enfermeiro_id INTEGER,
      tecnico_id INTEGER,
      tipo TEXT NOT NULL DEFAULT 'Exame de Sangue',
      status TEXT CHECK(status IN ('Pendente', 'Aguardando Coleta', 'Em Coleta', 'Concluído')) DEFAULT 'Pendente',
      data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_encaminhamento DATETIME,
      data_coleta DATETIME,
      FOREIGN KEY(paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY(medico_id) REFERENCES users(id)
    )`);

    // Tabelas Clínicas (Evoluções, Prescrições, Aprazamentos)
    db.run(`CREATE TABLE IF NOT EXISTS evolucoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico_id INTEGER NOT NULL,
      texto TEXT NOT NULL,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY(medico_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prescricoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico_id INTEGER NOT NULL,
      item TEXT NOT NULL,
      dosagem TEXT,
      via TEXT,
      intervalo TEXT,
      tipo TEXT CHECK(tipo IN ('medicamento', 'dieta', 'cuidado')) NOT NULL,
      doses_totais INTEGER DEFAULT 1,
      doses_restantes INTEGER DEFAULT 1,
      status_assinatura INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ativo',
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY(medico_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS aprazamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescricao_id INTEGER NOT NULL,
      paciente_id INTEGER NOT NULL,
      horario_planejado TEXT NOT NULL,
      status TEXT CHECK(status IN ('pendente', 'realizado', 'atrasado', 'suspenso')) DEFAULT 'pendente',
      executor_id INTEGER,
      data_realizacao DATETIME,
      FOREIGN KEY(prescricao_id) REFERENCES prescricoes(id),
      FOREIGN KEY(paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY(executor_id) REFERENCES users(id)
    )`);

    // Tabela de Sinais Vitais
    db.run(`CREATE TABLE IF NOT EXISTS sinais_vitais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      tecnico_id INTEGER NOT NULL,
      temp REAL,
      pa_sistolica INTEGER,
      pa_diastolica INTEGER,
      fc INTEGER,
      fr INTEGER,
      sato2 INTEGER,
      observacoes TEXT,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY(tecnico_id) REFERENCES users(id)
    )`);

    // Tabela de Configurações
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    // Inserir configurações padrão
    const defaultSettings = [
      { key: 'notificacao_sinais', value: 'true' },
      { key: 'notificacao_evolucao', value: 'true' },
      { key: 'viacep_status', value: 'true' },
      { key: 'icp_brasil_status', value: 'false' },
      { key: 'timeout_inatividade', value: '15' }
    ];

    defaultSettings.forEach(s => {
      db.get("SELECT key FROM settings WHERE key = ?", [s.key], (err, row) => {
        if (!row) {
          db.run("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, s.value]);
        }
      });
    });

    // Criar Usuários Iniciais
    const profiles = [
      { nome: 'Dr. Lucas (Médico)', id: 'medico', cargo: 'Medico' },
      { nome: 'Enf. Juliana', id: 'enfer', cargo: 'Enfermeiro' },
      { nome: 'Tec. Ricardo', id: 'tec', cargo: 'Tecnico' },
      { nome: 'Ana (Recepção)', id: 'recep', cargo: 'Recepcao' },
      { nome: 'Desenvolvedor', id: 'admin', cargo: 'TI' }
    ];

    profiles.forEach(async (p) => {
      db.get("SELECT id FROM users WHERE identificador = ?", [p.id], async (err, row) => {
        if (!row) {
          const hash = await bcrypt.hash('123', 10);
          db.run("INSERT INTO users (nome, identificador, senha, cargo) VALUES (?, ?, ?, ?)", [p.nome, p.id, hash, p.cargo]);
        }
      });
    });

    // Criar Leitos Iniciais
    db.get("SELECT COUNT(*) as count FROM leitos", [], (err, row) => {
      if (row && row.count === 0) {
        const leitosIniciais = [
          { numero: '101-A', ala: 'Ala A - Clínica Médica' },
          { numero: '101-B', ala: 'Ala A - Clínica Médica' },
          { numero: '102-A', ala: 'Ala A - Clínica Médica' },
          { numero: '102-B', ala: 'Ala A - Clínica Médica' },
          { numero: '201-A', ala: 'Ala B - Cirúrgica' },
          { numero: 'UTI-01', ala: 'UTI Adulto' },
        ];
        leitosIniciais.forEach(l => {
          db.run("INSERT INTO leitos (numero, ala, status) VALUES (?, ?, ?)", [l.numero, l.ala, 'vago']);
        });
      }
    });
  });
};

module.exports = { db, initDb };
