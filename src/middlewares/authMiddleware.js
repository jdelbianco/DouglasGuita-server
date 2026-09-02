import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers['authorization'];
  
  // O padrão é vir escrito "Bearer meutoken.gigante.aqui"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    // 2. Verifica se o token é válido usando o mesmo segredo da criação
    // IMPORTANTE: Use a mesma variável de ambiente que você usou no login!
    const secret = process.env.JWT_SECRET || '918612';
    const decoded = jwt.verify(token, secret);

    // 3. Coloca os dados do usuário (id e role) dentro da requisição
    // Assim, as próximas rotas saberão exatamente qual usuário está fazendo a ação
    req.user = decoded;

    // 4. Libera a passagem para a rota final
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};