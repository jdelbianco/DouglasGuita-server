import express from 'express';
import { prisma }  from "../../lib/prisma.js";
import bcrypt from 'bcrypt';
import multer from 'multer';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configuração do Multer para guardar a imagem temporariamente na memória
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB para a foto de perfil
});
// ==========================================
// 1. POST - Criar Usuário (Com senha criptografada)
// ==========================================
router.post('/', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const file = req.file;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Os campos name, email e password são obrigatórios.' });
    }

    // Gerando o hash da senha usando o bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
      name,
      email,
      password: hashedPassword, // Substitui a senha em texto puro pelo hash seguro
      role: role || 'STUDENT'
    };

    // Se o usuário enviou uma foto no cadastro, adiciona ao banco
    if (file) {
      userData.profilePicture = file.buffer;
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
        // Ocultamos a senha e o binário da foto no retorno por segurança/performance
      }
    });

    return res.status(201).json(user);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});
// ==========================================
// 2. GET - Listar todos os usuários
// ==========================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// ==========================================
// 3. GET - Buscar detalhes de um usuário específico
// ==========================================
router.get('/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar o usuário.' });
  }
});

// ==========================================
// 4. GET - Rota exclusiva para visualizar/carregar a foto de perfil
// ==========================================
router.get('/:user_id/picture', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { profilePicture: true }
    });

    if (!user || !user.profilePicture) {
      return res.status(404).json({ error: 'Foto de perfil não encontrada.' });
    }

    // Retorna a imagem diretamente para o navegador/frontend
    res.setHeader('Content-Type', 'image/jpeg'); // Pode ser ajustado para png dependendo do envio
    return res.send(user.profilePicture);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao carregar a foto de perfil.' });
  }
});

// ==========================================
// 5. PUT - Atualizar Usuário (Aceitando troca de foto)
// ==========================================
router.put('/:user_id', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, email, password, role } = req.body;
    const file = req.file;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (password) dataToUpdate.password = password;
    if (role) dataToUpdate.role = role;
    if (file) dataToUpdate.profilePicture = file.buffer;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user_id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return res.status(200).json(updatedUser);

  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar o usuário.' });
  }
});

// ==========================================
// 6. DELETE - Deletar Usuário
// ==========================================
router.delete('/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    await prisma.user.delete({ where: { id: user_id } });
    return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar o usuário.' });
  }
});

export default router;