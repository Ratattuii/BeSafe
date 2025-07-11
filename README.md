# BeSafe - Sistema de Doações Humanitárias 🏥

## 📱 Sobre o Projeto

BeSafe é um sistema completo (Frontend + Backend) desenvolvido para conectar doadores e instituições de ajuda humanitária. A plataforma facilita o processo de doação, permitindo que pessoas encontrem e apoiem causas importantes de forma simples e direta.

## 🎯 Objetivo

Criar uma ponte eficiente entre pessoas que desejam doar e instituições que necessitam de recursos, tornando o processo de doação mais acessível, transparente e eficaz.

## 📁 Estrutura do Projeto

```
📁 BeSafe/
├── 📁 backend/          # API REST (Node.js + Express + MySQL)
│   ├── server.js        # Servidor principal
│   ├── db.js           # Configuração do banco
│   ├── package.json    # Dependências do backend
│   └── package-lock.json
├── 📁 frontend/         # Interface web (HTML + CSS + JS)
│   ├── *.html          # Páginas da aplicação
│   └── package.json    # Dependências do frontend
├── 📁 docs/            # Documentação
│   ├── README-API.md   # Documentação da API
│   ├── TESTES-API.md   # Exemplos de teste
│   └── README-MYSQL.md # Configuração do banco
├── README.md           # Este arquivo
├── package.json        # Gerenciamento geral
└── .gitignore
```

## 🛠️ Tecnologias Utilizadas

### Backend:
- **Node.js + Express.js** - Servidor da API
- **MySQL2** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **CORS + Express Validator** - Validação e segurança

### Frontend:
- **HTML5 + CSS3 + JavaScript** - Interface
- **Font Awesome** - Ícones
- **Live Server** - Servidor de desenvolvimento

## 💡 Principais Funcionalidades

### Para Doadores:
- Busca de instituições e causas
- Visualização de pedidos de doação
- Cadastro de itens para doação
- Chat direto com instituições
- Acompanhamento de doações

### Para Instituições:
- Perfil institucional detalhado
- Cadastro de necessidades
- Gestão de doações recebidas
- Comunicação com doadores
- Histórico de atividades

## 🚀 Como Executar

### 1. **Instalação Completa**
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/besafe-app.git
cd besafe-app

# Instalar todas as dependências
npm run install:all
```

### 2. **Configurar o Banco de Dados**
```bash
# Consulte o arquivo docs/README-MYSQL.md para instruções detalhadas
```

### 3. **Executar o Sistema Completo**
```bash
# Frontend (porta 3000) + Backend (porta 3001)
npm start
```

### 4. **Ou executar separadamente:**

**Backend apenas:**
```bash
npm run backend
# ou
cd backend && npm start
```

**Frontend apenas:**
```bash
npm run frontend
# ou
cd frontend && npm start
```

## 🔧 Scripts Disponíveis

```bash
npm start           # Executa frontend + backend
npm run dev         # Modo desenvolvimento
npm run backend     # Apenas backend
npm run frontend    # Apenas frontend
npm run install:all # Instala todas as dependências
```

## 📱 Interfaces Implementadas

1. **Tela Inicial** - Feed de pedidos e filtros
2. **Perfis** - Doador e Instituição
3. **Mensagens** - Chat em tempo real
4. **Doações** - Cadastro e acompanhamento
5. **Busca** - Filtros avançados

## 👥 Autores

- **Desenvolvedor Principal Fullstack** - [Arthur Selegar](https://github.com/Ratattuii)