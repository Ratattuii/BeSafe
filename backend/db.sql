-- ===========================================
-- ESTRUTURA DO BANCO DE DADOS - BESAFE APP
-- ===========================================

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS besafe;
USE besafe;

-- ===========================================
-- TABELA: Usuarios
-- ===========================================
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('doador', 'receptor') NOT NULL,
    bio TEXT,
    imagem_perfil VARCHAR(500),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================================
-- TABELA: Instituicoes
-- ===========================================
CREATE TABLE Instituicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    endereco TEXT NOT NULL,
    contato VARCHAR(255),
    usuario_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- ===========================================
-- TABELA: Necessidades
-- ===========================================
CREATE TABLE Necessidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instituicao_id INT NOT NULL,
    item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    urgencia ENUM('baixa', 'media', 'alta', 'urgente') NOT NULL,
    descricao TEXT,
    status ENUM('ativa', 'atendida', 'cancelada') DEFAULT 'ativa',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instituicao_id) REFERENCES Instituicoes(id) ON DELETE CASCADE
);

-- ===========================================
-- TABELA: Doacoes
-- ===========================================
CREATE TABLE Doacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doador_id INT NOT NULL,
    receptor_id INT NULL,
    item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('pendente', 'aceita', 'rejeitada', 'concluida', 'cancelada') DEFAULT 'pendente',
    data_doacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doador_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receptor_id) REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- ===========================================
-- TABELA: Mensagens
-- ===========================================
CREATE TABLE Mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remetente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    conteudo TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (remetente_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- ===========================================
-- TABELA: Notificacoes
-- ===========================================
CREATE TABLE Notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo ENUM('doacao', 'mensagem', 'avaliacao', 'sistema') NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- ===========================================
-- TABELA: Avaliacoes
-- ===========================================
CREATE TABLE Avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    avaliador_id INT NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (avaliador_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_avaliacao (usuario_id, avaliador_id)
);

-- ===========================================
-- TABELA: Favoritos
-- ===========================================
CREATE TABLE Favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    instituicao_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (instituicao_id) REFERENCES Instituicoes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, instituicao_id)
);

-- ===========================================
-- TABELA: HistoricoDoacoes
-- ===========================================
CREATE TABLE HistoricoDoacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doador_id INT NOT NULL,
    receptor_id INT NULL,
    item VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('concluida', 'cancelada') NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (doador_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receptor_id) REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- ===========================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ===========================================

-- Índices para consultas frequentes
CREATE INDEX idx_usuarios_email ON Usuarios(email);
CREATE INDEX idx_usuarios_tipo ON Usuarios(tipo);
CREATE INDEX idx_instituicoes_usuario ON Instituicoes(usuario_id);
CREATE INDEX idx_necessidades_instituicao ON Necessidades(instituicao_id);
CREATE INDEX idx_necessidades_status ON Necessidades(status);
CREATE INDEX idx_doacoes_doador ON Doacoes(doador_id);
CREATE INDEX idx_doacoes_receptor ON Doacoes(receptor_id);
CREATE INDEX idx_doacoes_status ON Doacoes(status);
CREATE INDEX idx_mensagens_remetente ON Mensagens(remetente_id);
CREATE INDEX idx_mensagens_destinatario ON Mensagens(destinatario_id);
CREATE INDEX idx_notificacoes_usuario ON Notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON Notificacoes(lida);
CREATE INDEX idx_avaliacoes_usuario ON Avaliacoes(usuario_id);
CREATE INDEX idx_favoritos_usuario ON Favoritos(usuario_id);
CREATE INDEX idx_historico_doador ON HistoricoDoacoes(doador_id);

-- ===========================================
-- DADOS INICIAIS (OPCIONAL)
-- ===========================================

-- Inserir usuário administrador padrão
INSERT INTO Usuarios (nome, email, senha, tipo, bio) VALUES 
('Administrador', 'admin@besafe.com', '$2b$10$example_hash', 'doador', 'Administrador do sistema BeSafe');

-- Comentários finais
-- Este script cria toda a estrutura do banco de dados BeSafe
-- Certifique-se de ter as permissões necessárias para executar
-- Recomenda-se fazer backup antes de executar em produção 