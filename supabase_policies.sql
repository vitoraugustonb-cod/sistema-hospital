-- Desabilitar RLS ou criar políticas de acesso público para teste inicial

-- Tabela: users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público para users" ON users FOR SELECT USING (true);
CREATE POLICY "Inserção pública para users" ON users FOR INSERT WITH CHECK (true);

-- Tabela: pacientes
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público para pacientes" ON pacientes FOR SELECT USING (true);
CREATE POLICY "Inserção pública para pacientes" ON pacientes FOR INSERT WITH CHECK (true);

-- Tabela: leitos
ALTER TABLE leitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público para leitos" ON leitos FOR SELECT USING (true);
CREATE POLICY "Inserção pública para leitos" ON leitos FOR INSERT WITH CHECK (true);
