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
=======
# 🚨 BeSafe - Plataforma de Conexão para Doadores e Receptores

## 📋 Descrição

BeSafe é uma plataforma web/mobile desenvolvida em React Native que conecta doadores e instituições receptoras em situações de emergência e desastres. O sistema facilita a coordenação de ajuda humanitária permitindo que doadores encontrem instituições que precisam de doações específicas.

## ✨ Funcionalidades

### 🎯 Para Doadores
- ✅ Cadastro e login de doadores
- ✅ Visualização de necessidades urgentes
- ✅ Sistema de busca e filtros
- ✅ Perfil personalizado com histórico de doações
- ✅ Chat direto com instituições

### 🏥 Para Instituições
- ✅ Cadastro e login de instituições
- ✅ Publicação de necessidades
- ✅ Gestão de doações recebidas
- ✅ Perfil institucional completo
- ✅ Sistema de seguidores

### 🌐 Geral
- ✅ Interface responsiva (web e mobile)
- ✅ Sistema de autenticação completo
- ✅ Navegação intuitiva
- ✅ Splash screen personalizada
- ✅ Notificações em tempo real

## 🏗️ Arquitetura

```
BeSafe/
├── frontend/          # React Native (Expo)
│   ├── src/
│   │   ├── screens/   # Telas da aplicação
│   │   ├── contexts/  # Context API (AuthContext)
│   │   ├── components/# Componentes reutilizáveis
│   │   ├── navigation/# Configuração de navegação
│   │   ├── services/  # APIs e serviços
│   │   ├── styles/    # Estilos globais
│   │   └── utils/     # Utilitários
│   └── App.js         # Entrada principal
└── backend/           # Node.js + Express + PostgreSQL
    ├── src/
    │   ├── controllers/
    │   ├── database/
    │   ├── middleware/
    │   └── routes/
    └── server.js
```

## 🚀 Como Executar

### Frontend (React Native)

```bash
cd frontend
npm install
npx expo start web
```

### Backend (Node.js)

```bash
cd backend
npm install
npm run dev
```

## 🔐 Sistema de Autenticação

- **Doadores**: Cadastro com email/senha
- **Instituições**: Cadastro com CNPJ e verificação
- **Persistência**: AsyncStorage para manter login
- **Simulação**: Login funcional para desenvolvimento

### Credenciais de Teste

**Doador:**
- Email: `joao@teste.com`
- Senha: `123456`

**Instituição:**
- Email: `contato@instituicao.org`
- Senha: `123456`

## 🎨 Telas Principais

1. **SplashScreen** - Tela inicial com opções de login/cadastro
2. **LoginScreen** - Autenticação de usuários
3. **RegisterScreen** - Cadastro de doadores e instituições
4. **Home** - Feed principal com necessidades
5. **SearchScreen** - Busca e filtros avançados
6. **ProfileScreens** - Perfis de doadores e instituições
7. **ChatScreen** - Comunicação direta
8. **NotificationsScreen** - Alertas e notificações

## 🛠️ Tecnologias

### Frontend
- **React Native** - Framework principal
- **Expo** - Plataforma de desenvolvimento
- **React Navigation** - Navegação entre telas
- **AsyncStorage** - Persistência local
- **Context API** - Gerenciamento de estado

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Multer** - Upload de arquivos

## 🎯 Fluxo de Uso

1. **Início**: Usuário abre app na SplashScreen
2. **Autenticação**: Login ou cadastro
3. **Dashboard**: Visualiza necessidades ou publica
4. **Interação**: Chat, doações, seguir instituições
5. **Perfil**: Gestão de dados e histórico

## 📱 Compatibilidade

- ✅ **Web** - Navegadores modernos
- ✅ **iOS** - iPhone/iPad (via Expo)
- ✅ **Android** - Smartphones/tablets (via Expo)

## 🚧 Status do Projeto

- ✅ **Frontend**: Interface completa e funcional
- ✅ **Autenticação**: Sistema completo com simulação
- ✅ **Navegação**: Fluxo completo implementado
- ⚠️ **Backend**: APIs em desenvolvimento
- ⚠️ **Banco de Dados**: Schema criado, população pendente

## 👥 Desenvolvedores

Projeto desenvolvido para **Projeto de Pesquisa 2024**.

## 📄 Licença

Este projeto está sob licença MIT.
>>>>>>> 3880e63 (Initial commit - BeSafe Platform)
