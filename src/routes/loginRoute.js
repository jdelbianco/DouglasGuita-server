import express from 'express';
import { prisma }  from "../../lib/prisma.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // 2. Compara a senha digitada com o Hash do banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // 3. Gera o Token JWT válido por 1 dia
    // IMPORTANTE: No futuro, coloque um JWT_SECRET forte no seu arquivo .env da VPS
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || '918612', 
      { expiresIn: '1d' }
    );

    // 4. Remove a senha do objeto antes de devolver para o frontend
    const { password: _, ...userWithoutPassword } = user;

    // 5. Retorna o formato EXATO que o nosso frontend React está esperando
    return res.status(200).json({
      message: "Login realizado com sucesso",
      token: token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

export default router;