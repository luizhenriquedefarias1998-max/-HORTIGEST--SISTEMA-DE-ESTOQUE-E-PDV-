const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Pool de Conexão com MySQL (Ajustado para aceitar tanto DB_PASS quanto DB_PASSWORD)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'hortigest',
    waitForConnections: true,
    connectionLimit: 10
});

// --- ROTAS DE PRODUTOS & ESTOQUE ---

// Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM produtos');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar preço e estoque manualmente
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { preco, estoque } = req.body;
    try {
        await pool.query('UPDATE produtos SET preco = ?, estoque = ? WHERE id = ?', [preco, estoque, id]);
        res.json({ message: "Produto updated com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE PEDIDOS & PDV ---

// Criar novo pedido (PDV) - CORRIGIDO
app.post('/api/pedidos', async (req, res) => {
    const { itens, pagamento, total } = req.body;
    
    // Validação básica para evitar erros se o carrinho vier vazio
    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "O carrinho está vazio" });
    }

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction(); 

        // 1. Insere o Pedido (Removido forma_pagamento caso sua tabela não tenha, ou mantido padrão seguro)
        const [pedidoRes] = await connection.query(
            'INSERT INTO pedidos (cliente, total, status) VALUES (?, ?, "Pendente")',
            ['Consumidor Final', total]
        );
        const pedidoId = pedidoRes.insertId;

        // 2. Insere os Itens na tabela correta (itens_pedidos) e Deduz do Estoque
        for (const item of itens) {
            // Garante que as propriedades usem os nomes que vêm do React (item.id ou item.produto_id)
            const produtoId = item.id || item.produto_id;
            const quantidade = item.quantidade || item.qtd || 1;
            const precoUnitario = item.preco || item.preco_unitario || 0;

            await connection.query(
                'INSERT INTO itens_pedidos (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                [pedidoId, produtoId, quantidade, precoUnitario]
            );

            // Baixa automática no estoque
            await connection.query(
                'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
                [quantidade, produtoId]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, pedidoId });
    } catch (err) {
        await connection.rollback();
        console.error("Erro na transação de venda:", err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Listar pedidos para separação
app.get('/api/pedidos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pedidos ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar status do pedido
app.patch('/api/pedidos/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GERAÇÃO DO PDF DE SEPARAÇÃO - CORRIGIDO ---
app.get('/api/pedidos/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        // Busca os dados do pedido
        const [pedido] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [id]);
        if (pedido.length === 0) return res.status(404).send('Pedido não encontrado');

        // Busca itens vinculados ao produto na tabela correta (itens_pedidos)
        const [itens] = await pool.query(`
            SELECT i.*, p.descricao, p.unidade, p.codigo 
            FROM itens_pedidos i 
            JOIN produtos p ON i.produto_id = p.id 
            WHERE i.pedido_id = ?`, [id]);

        const doc = new PDFDocument({ margin: 30 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=separacao_pedido_${id}.pdf`);
        doc.pipe(res);

        // Cabeçalho do PDF
        doc.fontSize(18).text(' HortiGest - DOCUMENTO DE SEPARAÇÃO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(`Pedido ID: # ${id}`);
        doc.text(`Data do Pedido: ${new Date(pedido[0].data_criacao).toLocaleString('pt-BR')}`);
        doc.text(`Status Atual: ${pedido[0].status}`);
        doc.moveDown();
        
        doc.moveTo(30, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();

        // Tabela de itens
        doc.fontSize(12).text('ITENS PARA SEPARAÇÃO:');
        doc.moveDown(0.5);

        itens.forEach((item) => {
            doc.fontSize(11).text(`[  ]  Cod: ${item.codigo}  -  ${item.descricao}`);
            doc.fillColor('#bd2130').text(`      QTD A SEPARAR: ${item.quantidade} ${item.unidade}`, { underline: true });
            doc.fillColor('#000000').moveDown(0.5);
        });

        doc.moveDown();
        doc.moveTo(30, doc.y).lineTo(580, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(10).text('Concluído por: ________________________  Em: ____/____/______', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));