const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

module.exports = (io) => {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!token) {
      console.log('❌ Token não enviado no socket');
      return next(new Error('TOKEN_REQUIRED'));
    }

    const extractedToken = token.startsWith('Bearer ')
      ? token.split(' ')[1]
      : token;

    jwt.verify(extractedToken, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('❌ JWT inválido no socket:', err.message);
        return next(new Error('INVALID_TOKEN'));
      }

      socket.user = decoded; // Igual ao req.user
      console.log('✔️ Socket autenticado:', decoded.id);
      next();
    });
  });
};
