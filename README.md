# 📌 SISTEMA-HOSPITAL

## 📖 Descrição

O **SISTEMA-HOSPITAL** é uma plataforma robusta e profissional de gestão hospitalar, desenvolvida para otimizar a administração de leitos, o fluxo de atendimento a pacientes e a organização de equipes multidisciplinares. O projeto resolve o problema da fragmentação de informações em ambientes hospitalares, oferecendo uma interface centralizada para recepção, corpo clínico (médicos e enfermeiros), técnicos e administradores de TI.

## 🎯 Objetivo

Centralizar a gestão operacional e clínica de uma unidade de saúde, garantindo a integridade dos dados, o controle rigoroso de acesso por cargos e a eficiência na visualização do censo hospitalar em tempo real.

## 🚀 Funcionalidades

*   **Autenticação Segura:** Sistema de login com criptografia `bcrypt` e tokens `JWT` (JSON Web Token).
*   **Controle de Acesso por Perfil (RBAC):** Funcionalidades e menus personalizados para os cargos: TI, Médico, Enfermeiro, Técnico e Recepção.
*   **Gestão de Pacientes:** CRUD completo de pacientes, incluindo busca por CPF, validação de documentos e detalhes administrativos.
*   **Mapa de Leitos:** Visualização e gestão da ocupação hospitalar (Recepção).
*   **Censo Clínico e Enfermagem:** Painéis específicos para acompanhamento de pacientes, pendências médicas, exames e históricos.
*   **Gestão de Usuários:** Painel administrativo restrito ao setor de TI para criação e auditoria de usuários.
*   **Segurança Avançada:** Implementação de `Rate Limiting` (proteção contra força bruta), proteção de cabeçalhos com `Helmet`, sanitização de dados com `Zod` e políticas de CORS.

## 🛠️ Tecnologias utilizadas

*   **Frontend:**
    *   [React](https://react.dev/) (v19) com [TypeScript](https://www.typescriptlang.org/)
    *   [Vite](https://vitejs.dev/) (Ferramenta de build)
    *   [Tailwind CSS](https://tailwindcss.com/) (Estilização)
    *   [Lucide React](https://lucide.dev/) (Ícones)
    *   [Axios](https://axios-http.com/) (Requisições HTTP)
    *   [React Router Dom](https://reactrouter.com/) (Navegação)
    *   [Recharts](https://recharts.org/) (Gráficos)
*   **Backend:**
    *   [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/)
    *   [Supabase](https://supabase.com/) (Cliente para PostgreSQL e Persistência)
    *   [Bcryptjs](https://www.npmjs.com/package/bcryptjs) (Hash de senhas)
    *   [JSON Web Token](https://jwt.io/) (Sessões e segurança)
    *   [Zod](https://zod.dev/) (Validação de esquemas e tipos)
    *   [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit) (Segurança de API)
    *   [Helmet](https://helmetjs.github.io/) (Segurança HTTP)
*   **Banco de Dados:**
    *   [PostgreSQL](https://www.postgresql.org/) (via Supabase)

## 📂 Estrutura do projeto

```text
C:\Users\vitor\eclipse-workspace\aula\src\aula\SISTEMA-HOSPITAL\
├── server/             # Backend Node.js (Express e Integração Supabase)
│   ├── server.js       # Core do servidor e Endpoints
│   └── supabaseClient.js # Configuração do cliente do banco de dados
├── src/                # Frontend React
│   ├── components/     # Componentes reutilizáveis (Sidebar, Layout, etc)
│   ├── hooks/          # Hooks customizados (useAuth para autenticação)
│   ├── pages/          # Páginas principais separadas por cargo
│   ├── App.tsx         # Roteamento e Provedores
│   └── main.tsx        # Ponto de entrada da aplicação
├── public/             # Arquivos estáticos
└── supabase_policies.sql # Definições de segurança RLS do banco de dados
```

## ⚙️ Como executar o projeto

### 🔧 Pré-requisitos

*   [Node.js](https://nodejs.org/) (Versão LTS recomendada)
*   [Git](https://git-scm.com/)
*   Conta no [Supabase](https://supabase.com/) (para o banco de dados)

### 📥 Instalação

```bash
# Clone o repositório
git clone https://github.com/vitoraugustonb-cod/sistema-hospital

# Acesse a pasta
cd sistema-hospital

# Instale as dependências
npm install
```

### ▶️ Execução

O projeto utiliza `concurrently` para rodar o frontend e o backend simultaneamente com um único comando:

```bash
# Inicia Frontend (Porta 5173) e Backend (Porta 3001)
npm run dev
```

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_anon_do_supabase
PORT=3001
JWT_SECRET=uma_chave_secreta_longa_e_segura
```

*   `SUPABASE_URL`: URL do endpoint do seu projeto no Supabase.
*   `SUPABASE_KEY`: Chave pública (anon) para conexão com o banco.
*   `PORT`: Porta onde o servidor backend será executado.
*   `JWT_SECRET`: Segredo utilizado para assinar os tokens de autenticação.

## 📡 Endpoints da API

*   **Autenticação:**
    *   `POST /api/login`: Realiza autenticação e retorna Token + Dados do usuário.
    *   `POST /api/logout`: Finaliza sessão.
*   **Usuários (Apenas TI):**
    *   `GET /api/users`: Lista todos os usuários.
    *   `POST /api/users`: Cadastra um novo funcionário.
*   **Pacientes (Equipe Clínica/Recepção):**
    *   `GET /api/pacientes`: Lista todos os pacientes internados/cadastrados.
    *   `GET /api/pacientes/:id`: Detalhes de um paciente específico.
    *   `POST /api/pacientes`: Realiza a admissão (cadastro) de um novo paciente.
    *   `PUT /api/pacientes/:id`: Atualiza dados clínicos ou administrativos.
    *   `DELETE /api/pacientes/:id`: Remove registro de paciente (Restrito a TI).

## 🧪 Testes

Não foram identificados testes automatizados no código atual.

## 📌 Melhorias futuras

1.  **Módulo de Medicamentos:** Adicionar controle de estoque e aprazamento de doses.
2.  **Dashboard de BI:** Implementar gráficos de taxa de ocupação e tempo médio de permanência.
3.  **Logs de Auditoria:** Criar uma tabela específica no Supabase para registrar todas as ações críticas.
4.  **Recuperação de Senha:** Implementar fluxo de "Esqueci minha senha" via e-mail.

## 🤝 Contribuição

1.  Faça um Fork do projeto.
2.  Crie uma Branch para sua Feature (`git checkout -b feature/NovaFeature`).
3.  Faça o Commit das alterações (`git commit -m 'Adicionando nova funcionalidade'`).
4.  Faça o Push para a Branch (`git push origin feature/NovaFeature`).
5.  Abra um Pull Request.

## 🧑‍💻 Desenvolvedor

Este projeto foi desenvolvido com foco em excelência técnica e segurança hospitalar por **Vitor**.

---
*Este sistema é de uso restrito e monitorado.*
