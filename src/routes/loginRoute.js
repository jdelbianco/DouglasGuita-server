import express from 'express';
import { prisma }  from "../../lib/prisma.js";
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    // 1. Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // 2. Se o usuário não existir, retorna erro genérico por segurança
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // 3. Compara a senha em texto puro digitada com o hash salvo no banco
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // 4. Se a senha bater, remove o hash do objeto antes de devolver
    const { password: _, ...userWithoutPassword } = user;

    // 5. Retorna o usuário logado com sucesso
    return res.status(200).json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao realizar login.' });
  }
});



export default router;