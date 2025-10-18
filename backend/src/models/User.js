// Modelo de usuário em memória - stub inicial
// TODO: Migrar para banco de dados quando definido

// Armazenamento em memória temporário
let users = [];
let nextId = 1;

/**
 * Modelo de usuário
 */
class User {
  constructor({ name, email, password, role, phone, address }) {
    this.id = nextId++;
    this.name = name;
    this.email = email;
    this.password = password; // TODO: Hash da senha quando implementar auth
    this.role = role; // 'doador' ou 'receptor'
    this.phone = phone;
    this.address = address;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = true;
    
    // Campos específicos para receptores/instituições
    if (role === 'receptor') {
      this.institutionType = null; // Ex: 'hospital', 'escola', 'abrigo'
      this.description = null;
      this.followers = [];
    }
    
    // Campos específicos para doadores
    if (role === 'doador') {
      this.following = [];
      this.donations = [];
    }
  }

  // Métodos estáticos para simular operações de banco
  static create(userData) {
    const user = new User(userData);
    users.push(user);
    return user;
  }

  static findById(id) {
    return users.find(user => user.id === parseInt(id));
  }

  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  static findAll() {
    return users;
  }

  static findByRole(role) {
    return users.filter(user => user.role === role);
  }

  // Métodos de instância
  update(newData) {
    Object.assign(this, newData);
    this.updatedAt = new Date();
    return this;
  }

  delete() {
    const index = users.findIndex(user => user.id === this.id);
    if (index > -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = User;
