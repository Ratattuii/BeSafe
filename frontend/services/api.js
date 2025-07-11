// ==============================================
// API SERVICE - BESAFE APP
// Usando apenas axios como nos projetos de referência
// ==============================================

import axios from 'axios';

// URL base da API
const API_BASE_URL = 'http://localhost:3001';

// Criar instância do axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==============================================
// MÉTODOS BÁSICOS
// ==============================================

// Buscar dados
export const getData = async (endpoint) => {
    try {
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
};

// Enviar dados
export const postData = async (endpoint, data) => {
    try {
        const response = await api.post(endpoint, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        throw error;
    }
};

// Atualizar dados
export const putData = async (endpoint, data) => {
    try {
        const response = await api.put(endpoint, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        throw error;
    }
};

// Deletar dados
export const deleteData = async (endpoint) => {
    try {
        const response = await api.delete(endpoint);
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar dados:', error);
        throw error;
    }
};

// Export principal
export default api; 