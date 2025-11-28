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

## 👥 Desenvolvedores

Ratatui - https://github.com/Ratattuii