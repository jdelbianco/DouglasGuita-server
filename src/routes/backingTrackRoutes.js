import express from 'express';
// Apagamos a importação do PrismaClient e trazemos o nosso db.js
import { prisma } from "../../lib/prisma.js";

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // 1. Captura os dados enviados no corpo da requisição
    const { title, description, youtubeUrl } = req.body;

    // 2. Validação: garante que o frontend enviou todos os dados necessários
    if (!title || !description || !youtubeUrl) {
      return res.status(400).json({ 
        error: 'Os campos title, description e youtubeUrl são obrigatórios.' 
      });
    }

    // 3. Salva a backing track no banco de dados
    const backingTrack = await prisma.backingTrack.create({
      data: {
        title,
        description,
        youtubeUrl
      }
    });

    // 4. Retorna sucesso e os dados recém-criados
    return res.status(201).json(backingTrack);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao criar a backing track.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const tracks = await prisma.backingTrack.findMany({
      orderBy: {
        createdAt: 'desc' // Mostra as mais recentes primeiro
      }
    });

    return res.status(200).json(tracks);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao buscar as backing tracks.' });
  }
});



router.put('/:track_id', async (req, res) => {
  try {
    const { track_id } = req.params;
    const { title, description, youtubeUrl } = req.body;

    // 1. Monta o objeto de atualização apenas com os campos enviados
    const dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (description) dataToUpdate.description = description;
    if (youtubeUrl) dataToUpdate.youtubeUrl = youtubeUrl;

    // 2. Valida se o usuário enviou pelo menos alguma coisa para atualizar
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }

    // 3. Executa a atualização no banco de dados
    const updatedTrack = await prisma.backingTrack.update({
      where: { id: track_id },
      data: dataToUpdate
    });

    return res.status(200).json(updatedTrack);

  } catch (error) {
    // Se o Prisma não encontrar o ID da track no banco
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Backing track não encontrada.' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao atualizar a backing track.' });
  }
});


router.delete('/:track_id', async (req, res) => {
  try {
    const { track_id } = req.params;

    // O Prisma exclui o registro com base no ID
    await prisma.backingTrack.delete({
      where: { id: track_id }
    });

    return res.status(200).json({ message: 'Backing track deletada com sucesso.' });

  } catch (error) {
    // Código P2025 do Prisma para "registro não encontrado"
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Backing track não encontrada ou já deletada.' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao deletar a backing track.' });
  }
});




export default router;