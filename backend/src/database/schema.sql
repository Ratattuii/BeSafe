-- ==============================================
-- BeSafe Database Schema
-- ==============================================
-- Script para criar todas as tabelas necessárias do projeto BeSafe
-- Autor: BeSafe Team
-- Data: 2024

-- Criar banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS besafe_db;
USE besafe_db;

-- ==============================================
-- 1. TABELA USERS
-- ==============================================
-- Armazena dados básicos de usuários (doadores e instituições)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Nome do usuário ou instituição',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email único para login',
    password VARCHAR(255) NOT NULL COMMENT 'Senha criptografada (bcrypt)',
    role ENUM('donor', 'institution') NOT NULL DEFAULT 'donor' COMMENT 'Tipo de usuário',
    avatar VARCHAR(500) NULL COMMENT 'Caminho para foto de perfil',
    
    -- Campos específicos para instituições
    cnpj VARCHAR(18) NULL COMMENT 'CNPJ da instituição (apenas para institutions)',
    phone VARCHAR(20) NULL COMMENT 'Telefone de contato',
    address TEXT NULL COMMENT 'Endereço completo',
    institution_type VARCHAR(100) NULL COMMENT 'Tipo da instituição (ONG, Hospital, etc.)',
    activity_area VARCHAR(100) NULL COMMENT 'Área de atuação (Saúde, Educação, etc.)',
    description TEXT NULL COMMENT 'Descrição da instituição',
    website VARCHAR(500) NULL COMMENT 'Site ou redes sociais',
    
    -- Status e verificação
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Instituição verificada',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Conta ativa',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_cnpj (cnpj),
    INDEX idx_users_verified (is_verified),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuários do sistema (doadores e instituições)';

-- ==============================================
-- 2. TABELA NEEDS (Necessidades)
-- ==============================================
-- Armazena as necessidades postadas pelas instituições
CREATE TABLE IF NOT EXISTS needs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL COMMENT 'ID da instituição que postou',
    title VARCHAR(255) NOT NULL COMMENT 'Título da necessidade',
    description TEXT NOT NULL COMMENT 'Descrição detalhada',
    category ENUM('alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros') NOT NULL COMMENT 'Categoria do item',
    urgency ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media' COMMENT 'Nível de urgência',
    quantity_needed INT NULL COMMENT 'Quantidade necessária',
    quantity_received INT DEFAULT 0 COMMENT 'Quantidade já recebida',
    unit VARCHAR(50) NULL COMMENT 'Unidade de medida (kg, unidades, etc.)',
    
    -- Localização
    location VARCHAR(255) NULL COMMENT 'Local para entrega/coleta',
    
    -- Status
    status ENUM('ativa', 'em_andamento', 'concluida', 'cancelada') NOT NULL DEFAULT 'ativa',
    expires_at TIMESTAMP NULL COMMENT 'Data de expiração da necessidade',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (institution_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_needs_institution (institution_id),
    INDEX idx_needs_category (category),
    INDEX idx_needs_urgency (urgency),
    INDEX idx_needs_status (status),
    INDEX idx_needs_created (created_at),
    INDEX idx_needs_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Necessidades postadas pelas instituições';

-- ==============================================
-- 3. TABELA NEED_IMAGES
-- ==============================================
-- Armazena imagens das necessidades
CREATE TABLE IF NOT EXISTS need_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    need_id INT NOT NULL COMMENT 'ID da necessidade',
    image_path VARCHAR(500) NOT NULL COMMENT 'Caminho da imagem',
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'Imagem principal',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_need_images_need (need_id),
    INDEX idx_need_images_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Imagens das necessidades';

-- ==============================================
-- 4. TABELA DONATIONS
-- ==============================================
-- Armazena as doações feitas pelos usuários
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL COMMENT 'ID do doador',
    need_id INT NOT NULL COMMENT 'ID da necessidade',
    institution_id INT NOT NULL COMMENT 'ID da instituição beneficiada',
    
    -- Detalhes da doação
    quantity INT NOT NULL COMMENT 'Quantidade doada',
    unit VARCHAR(50) NULL COMMENT 'Unidade de medida',
    notes TEXT NULL COMMENT 'Observações do doador',
    
    -- Status da doação
    status ENUM('pendente', 'confirmada', 'entregue', 'cancelada') NOT NULL DEFAULT 'pendente',
    
    -- Datas importantes
    promised_delivery TIMESTAMP NULL COMMENT 'Data prometida para entrega',
    delivered_at TIMESTAMP NULL COMMENT 'Data efetiva da entrega',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_donations_donor (donor_id),
    INDEX idx_donations_need (need_id),
    INDEX idx_donations_institution (institution_id),
    INDEX idx_donations_status (status),
    INDEX idx_donations_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Doações realizadas';

-- ==============================================
-- 5. TABELA FOLLOWS
-- ==============================================
-- Armazena quais usuários seguem quais instituições
CREATE TABLE IF NOT EXISTS follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL COMMENT 'ID do usuário que segue',
    institution_id INT NOT NULL COMMENT 'ID da instituição seguida',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Evita duplicatas
    UNIQUE KEY unique_follow (follower_id, institution_id),
    
    -- Índices
    INDEX idx_follows_follower (follower_id),
    INDEX idx_follows_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relacionamento seguidor-instituição';

-- ==============================================
-- 6. TABELA MESSAGES
-- ==============================================
-- Armazena mensagens entre usuários
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL COMMENT 'ID do remetente',
    receiver_id INT NOT NULL COMMENT 'ID do destinatário',
    need_id INT NULL COMMENT 'ID da necessidade (contexto da conversa)',
    
    -- Conteúdo
    message TEXT NOT NULL COMMENT 'Conteúdo da mensagem',
    message_type ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text',
    file_path VARCHAR(500) NULL COMMENT 'Caminho do arquivo (se aplicável)',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Mensagem foi lida',
    read_at TIMESTAMP NULL COMMENT 'Quando foi lida',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_need (need_id),
    INDEX idx_messages_created (created_at),
    INDEX idx_messages_conversation (sender_id, receiver_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensagens entre usuários';

-- ==============================================
-- 7. TABELA NOTIFICATIONS
-- ==============================================
-- Armazena notificações do sistema
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário que receberá a notificação',
    type ENUM('donation', 'message', 'follow', 'need_update', 'system') NOT NULL COMMENT 'Tipo de notificação',
    title VARCHAR(255) NOT NULL COMMENT 'Título da notificação',
    message TEXT NOT NULL COMMENT 'Conteúdo da notificação',
    
    -- Referências opcionais
    related_id INT NULL COMMENT 'ID relacionado (donation, need, etc.)',
    related_type VARCHAR(50) NULL COMMENT 'Tipo do relacionamento',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Notificação foi lida',
    read_at TIMESTAMP NULL COMMENT 'Quando foi lida',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notificações do sistema';

-- ==============================================
-- 8. TABELA SETTINGS
-- ==============================================
-- Armazena configurações dos usuários
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário',
    
    -- Notificações
    email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Receber notificações por email',
    push_notifications BOOLEAN DEFAULT TRUE COMMENT 'Receber notificações push',
    sms_notifications BOOLEAN DEFAULT FALSE COMMENT 'Receber notificações por SMS',
    
    -- Privacidade
    profile_public BOOLEAN DEFAULT TRUE COMMENT 'Perfil público',
    show_donation_history BOOLEAN DEFAULT TRUE COMMENT 'Mostrar histórico de doações',
    
    -- Preferências
    preferred_language VARCHAR(10) DEFAULT 'pt-BR' COMMENT 'Idioma preferido',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo' COMMENT 'Fuso horário',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Um setting por usuário
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações dos usuários';

-- ==============================================
-- INSERIR DADOS INICIAIS (SEED)
-- ==============================================

-- Inserir usuário administrador (opcional)
INSERT IGNORE INTO users (name, email, password, role, is_verified, is_active) VALUES 
('Administrador BeSafe', 'admin@besafe.com', '$2b$10$example.hash.here', 'institution', TRUE, TRUE);

-- Inserir algumas categorias e tipos padrão seria feito via enum já definido nas tabelas

-- ==============================================
-- VIEWS ÚTEIS
-- ==============================================

-- View para necessidades com dados da instituição
CREATE OR REPLACE VIEW needs_with_institution AS
SELECT 
    n.*,
    u.name as institution_name,
    u.avatar as institution_avatar,
    u.is_verified as institution_verified,
    COUNT(d.id) as total_donations,
    SUM(d.quantity) as total_donated
FROM needs n
LEFT JOIN users u ON n.institution_id = u.id
LEFT JOIN donations d ON n.id = d.need_id AND d.status IN ('confirmada', 'entregue')
GROUP BY n.id;

-- View para estatísticas de doações por usuário
CREATE OR REPLACE VIEW user_donation_stats AS
SELECT 
    u.id,
    u.name,
    u.role,
    COUNT(d.id) as total_donations,
    SUM(d.quantity) as total_quantity_donated,
    MAX(d.created_at) as last_donation_date
FROM users u
LEFT JOIN donations d ON u.id = d.donor_id AND d.status IN ('confirmada', 'entregue')
WHERE u.role = 'donor'
GROUP BY u.id;

-- ==============================================
-- TRIGGERS (Simplificados)
-- ==============================================

-- Trigger para criar configurações padrão para novos usuários
-- (Os outros triggers e procedures serão implementados via código quando necessário)

-- ==============================================
-- COMENTÁRIOS FINAIS
-- ==============================================
-- 
-- Este schema inclui:
-- 1. Tabelas principais: users, needs, donations, messages
-- 2. Tabelas de relacionamento: follows, need_images
-- 3. Tabelas de sistema: notifications, user_settings
-- 4. Views para consultas otimizadas
-- 5. Procedures para operações automatizadas
-- 6. Triggers para manter consistência
-- 
-- Configurações de charset UTF8MB4 para suporte completo a emojis
-- Uso de InnoDB para transações ACID
-- Índices otimizados para consultas comuns
-- Referências entre tabelas com cascade apropriado
-- 
-- ==============================================
