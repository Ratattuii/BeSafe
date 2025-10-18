// Modelo de necessidade em memória - stub inicial
// TODO: Migrar para banco de dados quando definido

// Armazenamento em memória temporário
let needs = [];
let nextId = 1;

/**
 * Modelo de necessidade (postada por receptores)
 */
class Need {
  constructor({ title, description, quantity, urgency, category, userId, location }) {
    this.id = nextId++;
    this.title = title;
    this.description = description;
    this.quantity = quantity;
    this.urgency = urgency; // 'baixa', 'media', 'alta', 'critica'
    this.category = category; // Ex: 'alimentos', 'roupas', 'medicamentos', 'abrigo'
    this.userId = userId; // ID do receptor que postou
    this.location = location;
    this.status = 'ativa'; // 'ativa', 'atendida', 'cancelada'
    this.donations = []; // Array de doações recebidas
    this.images = []; // Array de URLs de imagens
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Métodos estáticos
  static create(needData) {
    const need = new Need(needData);
    needs.push(need);
    return need;
  }

  static findById(id) {
    return needs.find(need => need.id === parseInt(id));
  }

  static findAll() {
    return needs;
  }

  static findByUserId(userId) {
    return needs.filter(need => need.userId === parseInt(userId));
  }

  static findByCategory(category) {
    return needs.filter(need => need.category === category);
  }

  static findByUrgency(urgency) {
    return needs.filter(need => need.urgency === urgency);
  }

  static findByStatus(status) {
    return needs.filter(need => need.status === status);
  }

  // Métodos de instância
  update(newData) {
    Object.assign(this, newData);
    this.updatedAt = new Date();
    return this;
  }

  close() {
    this.status = 'atendida';
    this.updatedAt = new Date();
    return this;
  }

  cancel() {
    this.status = 'cancelada';
    this.updatedAt = new Date();
    return this;
  }

  addDonation(donationData) {
    this.donations.push({
      ...donationData,
      createdAt: new Date()
    });
    this.updatedAt = new Date();
    return this;
  }

  delete() {
    const index = needs.findIndex(need => need.id === this.id);
    if (index > -1) {
      needs.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = Need;
