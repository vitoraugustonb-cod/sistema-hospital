# 🏥 SISTEMA-HOSPITAL

Um sistema completo de gestão hospitalar focado em fluxos clínicos, internação e administração. Desenvolvido com uma arquitetura moderna para garantir segurança, rapidez e usabilidade em ambientes de saúde.

## 🚀 Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React (ícones), React Router 7.
- **Backend:** Node.js, Express 5.
- **Banco de Dados:** SQLite (leve e sem necessidade de configuração externa).
- **Segurança:** Autenticação JWT, Bcrypt para senhas, Helmet (proteção de headers), Express Rate Limit e Validação de Dados (Zod).

## 🛠️ Funcionalidades por Perfil

O sistema utiliza RBAC (Role-Based Access Control) para garantir que cada profissional acesse apenas o que é pertinente à sua função:

- **TI (Administrador):** Gestão de usuários, auditoria completa de logs e configurações do sistema.
- **Recepção:** Cadastro de pacientes (com validação de CPF) e gestão de ocupação de leitos.
- **Médico:** Prontuário Eletrônico (PEP), prescrições, solicitações de exames, evoluções clínicas e alta médica.
- **Enfermagem:** Censo da unidade, aprazamento de medicações e acompanhamento de exames.
- **Técnico:** Registro de sinais vitais e checagem de medicações aprazadas.

## 🛡️ Segurança Enterprise Implementada

- **Validação Rigorosa:** Todos os dados (como evoluções e sinais vitais) são validados via Zod antes de chegarem ao banco.
- **Auditoria de Logs:** Cada ação sensível (excluir usuário, dar alta, prescrever) é registrada com o autor da ação.
- **Rate Limiting:** Proteção global contra ataques de negação de serviço (DoS) e força bruta no login.
- **Princípio do Menor Privilégio:** Perfis técnicos (TI) não possuem acesso direto a dados clínicos dos pacientes.

## 📦 Como Instalar e Rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/vitoraugustonb-cod/sistema-hospital.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:**
   Copie o arquivo `.env.example` para `.env` e preencha a chave secreta:
   ```bash
   cp .env.example .env
   ```

4. **Inicie o projeto (Frontend + Backend):**
   ```bash
   npm run dev
   ```

## 🔑 Acessos Padrão (Teste)

O sistema já vem pré-configurado com os seguintes usuários (Senha padrão: `123`):

| Perfil | Identificador |
| :--- | :--- |
| **TI** | `admin` |
| **Médico** | `medico` |
| **Enfermeiro** | `enfer` |
| **Técnico** | `tec` |
| **Recepção** | `recep` |

---
Desenvolvido por [Vitor Augusto](https://github.com/vitoraugustonb-cod) 🚀
