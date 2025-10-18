# 🚀 BeSafe Feed - Instruções de Setup

## 📋 Sobre o Feed Principal

O Feed Principal do BeSafe é uma tela totalmente funcional que exibe necessidades urgentes de instituições, com filtros avançados e integração completa com o backend.

### ✨ Funcionalidades Implementadas

- **Feed de Necessidades**: Lista necessidades com dados reais do banco
- **Filtros Dinâmicos**: Por urgência, tipo e localização
- **Instituições Seguidas**: Seção lateral com instituições que o usuário segue
- **Pull to Refresh**: Atualização dos dados por gesto
- **Loading States**: Estados de carregamento e erro tratados
- **Design Responsivo**: Layout adaptado ao design do app

## 🗄️ Banco de Dados

### Tabelas Criadas
- **`institutions`**: Dados das instituições (nome, localização, avatar, verificação)
- **`needs`**: Necessidades publicadas (título, descrição, urgência, tipo, quantidade)
- **`follows`**: Relacionamentos de seguir entre usuários e instituições

### Views Criadas
- **`needs_with_institution`**: Join otimizado entre needs e institutions
- **`followed_institutions`**: Instituições seguidas com contagem de necessidades

## 🔧 Como Rodar

### 1. Backend Setup

```bash
# Entre na pasta do backend
cd backend

# Instale dependências (se não instalou ainda)
npm install

# Configure o banco de dados do feed
npm run feed:setup

# Inicie o servidor
npm run dev
```

### 2. Frontend Setup

```bash
# Entre na pasta do frontend
cd frontend

# Instale dependências (se não instalou ainda)
npm install

# Inicie o projeto
npm start
```

### 3. Teste a Integração

Acesse as rotas da API:

**Necessidades:**
- `GET http://localhost:3000/needs` - Lista todas as necessidades
- `GET http://localhost:3000/needs?urgency=critica` - Filtro por urgência
- `GET http://localhost:3000/needs?type=alimento` - Filtro por tipo
- `GET http://localhost:3000/needs/types` - Tipos disponíveis

**Instituições:**
- `GET http://localhost:3000/institutions` - Lista instituições
- `GET http://localhost:3000/me/follows` - Instituições seguidas

## 📱 Tela Home.jsx

### Componentes
- **Header**: Título do app e subtítulo
- **FilterBar**: Filtros deslizantes horizontais
- **FollowedInstitutions**: Cards das instituições seguidas
- **NeedCard**: Cards das necessidades com todas as informações

### Estados Gerenciados
- `needs`: Lista de necessidades carregadas
- `followedInstitutions`: Instituições que o usuário segue
- `loading`: Estado de carregamento inicial
- `refreshing`: Estado do pull-to-refresh
- `filters`: Filtros aplicados (urgency, type, location)

### Integração com API
- Usa `api.get()` para fazer requisições
- Trata erros com `showError()`
- Atualiza automaticamente quando filtros mudam
- Suporte a pull-to-refresh

## 🎨 Design System

### Cores Utilizadas
- **Primária**: `#FF1434` (Vermelho BeSafe)
- **Background**: `#F5F5F5` (Cinza claro)
- **Cards**: `#FFFFFF` (Branco)
- **Textos**: `#212121` (Cinza escuro), `#757575` (Cinza médio)

### Urgência (Cores)
- **Crítica**: `#FF1744` (Vermelho)
- **Alta**: `#FF9800` (Laranja)
- **Média**: `#FFC107` (Amarelo)
- **Baixa**: `#4CAF50` (Verde)

### Componentes de UI
- **Cards com sombra**: `elevation: 3`
- **Bordas arredondadas**: `borderRadius: 12`
- **Espaçamentos**: Múltiplos de 4 (8, 12, 16, 20px)

## 🔗 Endpoints da API

### GET /needs
**Filtros opcionais:**
- `urgency`: critica, alta, media, baixa
- `type`: alimento, medicamento, roupa, material, higiene
- `location`: qualquer string (busca em location e institution_location)
- `limit`: número de resultados (padrão: 20)
- `offset`: paginação (padrão: 0)

**Resposta:**
```json
{
  "success": true,
  "message": "Necessidades encontradas",
  "data": {
    "needs": [...],
    "pagination": {
      "total": 8,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### GET /me/follows
**Resposta:**
```json
{
  "success": true,
  "message": "Instituições seguidas", 
  "data": {
    "institutions": [
      {
        "institution_id": 1,
        "institution_name": "Cruz Vermelha Brasileira",
        "institution_avatar": "/uploads/institutions/cruz_vermelha.jpg",
        "institution_location": "São Paulo, SP",
        "institution_verified": true,
        "active_needs_count": 3
      }
    ]
  }
}
```

## 🧪 Dados de Teste

O sistema vem com dados de teste pré-configurados:

### Instituições
- Cruz Vermelha Brasileira
- Hospital das Clínicas  
- Casa do Zezinho
- Fundação SOS Mata Atlântica
- APAC

### Necessidades (8 itens)
- Alimentos não perecíveis (Crítica)
- Medicamentos para UTI (Crítica)
- Roupas de inverno (Alta)
- Cobertores (Alta)
- Mudas de árvores (Média)
- Fraldas geriátricas (Alta)
- EPIs (Crítica)
- Material escolar (Média)

### Relacionamentos
- Usuário ID 1 segue 3 instituições

## 🐛 Troubleshooting

### Erro de Conexão com MySQL
```bash
# Verifique se o MySQL está rodando
sudo service mysql start

# Verifique se o usuário besafe_user existe
mysql -u root -p
> CREATE USER 'besafe_user'@'localhost' IDENTIFIED BY 'besafe_db';
> GRANT ALL PRIVILEGES ON besafe_db.* TO 'besafe_user'@'localhost';
```

### Erro "Tabela não encontrada"
```bash
# Execute o setup do banco principal primeiro
npm run db:init

# Depois execute o setup do feed
npm run feed:setup
```

### Frontend não consegue conectar na API
- Verifique se o backend está rodando na porta 3000
- Confirme se a `API_BASE_URL` em `services/api.js` está correta
- Teste as rotas diretamente no navegador ou Postman

## 📈 Próximos Passos

Para expandir o feed, considere implementar:

1. **Paginação Infinita**: Carregar mais necessidades ao chegar no final
2. **Cache Local**: Armazenar dados offline
3. **Push Notifications**: Notificar sobre necessidades críticas
4. **Filtro por Localização**: Usar GPS para filtrar por proximidade
5. **Sistema de Favoritos**: Marcar necessidades para acompanhar
6. **Compartilhamento**: Compartilhar necessidades em redes sociais

## ✅ Status da Implementação

- ✅ **Banco de Dados**: Tabelas e dados de teste criados
- ✅ **Backend**: Rotas funcionais com filtros
- ✅ **Frontend**: Tela Home.jsx totalmente funcional
- ✅ **Integração**: API conectada e funcionando
- ✅ **Design**: Layout seguindo padrões do app
- ✅ **Filtros**: Urgência, tipo e localização funcionais
- ✅ **Estados**: Loading, erro e vazio tratados
- ✅ **Refresh**: Pull-to-refresh implementado

🎉 **O Feed Principal do BeSafe está 100% funcional e pronto para uso!**

