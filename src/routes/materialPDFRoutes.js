import express from 'express';
// Apagamos a importação do PrismaClient e trazemos o nosso db.js
import { prisma } from "../../lib/prisma.js";
import multer from 'multer';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB por arquivo (ajuste se necessário)
});

// ==========================================
// 1. POST - Upload e criação do Material PDF
// ==========================================
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ 
        error: 'O campo title e o arquivo PDF são obrigatórios.' 
      });
    }

    // Salva o PDF como Bytes no PostgreSQL
    const newMaterial = await prisma.materialPDF.create({
      data: {
        title,
        fileData: file.buffer
      },
      select: {
        id: true,
        title: true,
        createdAt: true
        // Omitimos fileData no retorno JSON para a resposta não ficar pesada
      }
    });

    return res.status(201).json(newMaterial);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao fazer upload do PDF.' });
  }
});

// ==========================================
// 2. GET - Listar todos os materiais (Sem o binário do arquivo)
// ==========================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const materials = await prisma.materialPDF.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(materials);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao listar materiais.' });
  }
});

// ==========================================
// 3. GET - Buscar detalhes de um material específico pelo ID
// ==========================================
router.get('/:material_id', verifyToken, async (req, res) => {
  try {
    const { material_id } = req.params;

    const material = await prisma.materialPDF.findUnique({
      where: { id: material_id },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    return res.status(200).json(material);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao buscar o material.' });
  }
});

// ==========================================
// 4. GET - Baixar/Visualizar o arquivo PDF propriamente dito
// ==========================================
router.get('/:material_id/download', verifyToken,async (req, res) => {
  try {
    const { material_id } = req.params;

    const material = await prisma.materialPDF.findUnique({
      where: { id: material_id }
    });

    if (!material) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado.' });
    }

    // Define os cabeçalhos para o navegador reconhecer como um arquivo PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${material.title}.pdf"`);

    // Envia o buffer binário diretamente
    return res.send(material.fileData);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao baixar o PDF.' });
  }
});

// ==========================================
// 5. PUT - Atualizar título ou o arquivo do material
// ==========================================
router.put('/:material_id', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { material_id } = req.params;
    const { title } = req.body;
    const file = req.file;

    const dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (file) dataToUpdate.fileData = file.buffer;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }

    const updatedMaterial = await prisma.materialPDF.update({
      where: { id: material_id },
      data: dataToUpdate,
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });

    return res.status(200).json(updatedMaterial);

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao atualizar o material.' });
  }
});

// ==========================================
// 6. DELETE - Remover o material do banco
// ==========================================
router.delete('/:material_id', verifyToken, async (req, res) => {
  try {
    const { material_id } = req.params;

    await prisma.materialPDF.delete({
      where: { id: material_id }
    });

    return res.status(200).json({ message: 'Material PDF deletado com sucesso.' });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Material não encontrado ou já deletado.' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor ao deletar o material.' });
  }
});


export default router;