require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const { parseReceivedMessage, parseSentMessage } = require('./src/parser');
const pool = require('./src/db');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.json({ message: 'M-PESA Expense Tracker API is running' });
});

app.post('/webhook', async (req, res) => {

const providedSecret = req.headers['x-webhook-secret'];
const expectedSecret = process.env.WEBHOOK_SECRET;

if (!expectedSecret || !providedSecret) {
  return res.status(401).json({
    error: 'Unauthorized request',
  });
}

const providedBuffer = Buffer.from(providedSecret);
const expectedBuffer = Buffer.from(expectedSecret);

if (
  providedBuffer.length !== expectedBuffer.length ||
  !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
) {
  return res.status(401).json({
    error: 'Unauthorized request',
  });
}

  const { message } = req.body;

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'A valid message is required',
    });
  }

  let transaction = parseReceivedMessage(message);

  if (!transaction) {
    transaction = parseSentMessage(message);
  }

  if (!transaction) {
    return res.status(400).json({
      error: 'Could not parse M-PESA message',
    });
  }

  try {
    

const result = await pool.query(
  `INSERT INTO transactions
   (reference, type, amount, sender, recipient, transaction_date, category_id)
   VALUES (
     $1, $2, $3, $4, $5, $6,
     (SELECT id FROM categories WHERE name = 'Uncategorized')
   )
   ON CONFLICT (reference) DO NOTHING
   RETURNING *`,
  [
    transaction.reference,
    transaction.type,
    transaction.amount,
    transaction.sender ?? null,
    transaction.recipient ?? null,
    transaction.transactionDate,
  ]
);


    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Transaction already exists',
      });
    }

    return res.status(201).json({
      success: true,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Database operation failed:', error.message);

    return res.status(500).json({
      error: 'Unable to save transaction',
    });
  }
});


app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Failed to fetch categories:', error.message);
    return res.status(500).json({
      error: 'Unable to fetch categories',
    });
  }
    })


app.post('/categories', async (req, res) => {
  const { name } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      error: 'Category name is required'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name`,
      [name.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This category already exists'
      });
    }

    console.error('Failed to create category:', error.message);
    return res.status(500).json({
      error: 'Unable to create category'
    });
  }
});


app.delete('/categories/:id', async (req, res) => {
  const categoryId = Number(req.params.id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({
      error: 'Invalid category ID',
    });
  }

  try {
    // Find the category first
    const categoryResult = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }

    const category = categoryResult.rows[0];

    // Protect the default Uncategorized category
    if (category.name.toLowerCase() === 'uncategorized') {
      return res.status(403).json({
        error: 'The Uncategorized category cannot be deleted',
      });
    }

    // Check whether any transactions use this category
    const transactionResult = await pool.query(
      'SELECT 1 FROM transactions WHERE category_id = $1 LIMIT 1',
      [categoryId]
    );

    if (transactionResult.rows.length > 0) {
      return res.status(409).json({
        error: 'This category cannot be deleted because it is assigned to one or more transactions. Reassign those transactions first.',
      });
    }

    // Delete the unused category
    await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [categoryId]
    );

    return res.status(200).json({
      message: 'Category deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete category:', error.message);

    return res.status(500).json({
      error: 'Unable to delete category',
    });
  }
});


app.patch('/transactions/:reference/category', async (req, res) => {
  const { reference } = req.params;
  const { category_id } = req.body;

  if (
    category_id === undefined ||
    !Number.isInteger(category_id) ||
    category_id <= 0
  ) {
    return res.status(400).json({
      error: 'A valid category_id is required',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET category_id = $1
       WHERE reference = $2
       RETURNING reference, type, amount, category_id`,
      [category_id, reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Category does not exist',
      });
    }

    console.error('Failed to update transaction category:', error.message);

    return res.status(500).json({
      error: 'Unable to update transaction category',
    });
  }
});


app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.reference,
         t.type,
         t.amount,
         t.sender,
         t.recipient,
         t.transaction_date,
         c.id AS category_id,
         c.name AS category
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       ORDER BY t.transaction_date DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Failed to fetch transactions:', error.message);

    return res.status(500).json({
      error: 'Unable to retrieve transactions',
    });
  }
});


app.get('/summary', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN type = 'received' THEN amount ELSE 0 END), 0) AS "totalReceived",
                COALESCE(SUM(CASE WHEN type = 'sent' THEN amount ELSE 0 END), 0) AS "totalSent",
                COUNT(*) AS "transactionCount"
            FROM transactions;
        `);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error fetching summary:', error.message);
        res.status(500).json({
            error: 'Could not retrieve transaction summary'
        });
    }
});


module.exports = app;