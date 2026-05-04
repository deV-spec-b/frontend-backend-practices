const { Pool } = require('pg');
const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3003;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
app.use(express.json());

app.post('/users', async (req, res) => {
    const { first_name, last_name, age } = req.body;
    
    const result = await pool.query(
        'INSERT INTO users (first_name, last_name, age) VALUES ($1, $2, $3) RETURNING *',
        [first_name, last_name, age]
    );
    
    res.status(201).json(result.rows[0]);
});

app.get('/users', async (req, res) => {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
});

app.patch('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, age } = req.body;
    
    const current = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = current.rows[0];
    
    const newFirstName = first_name !== undefined ? first_name : user.first_name;
    const newLastName = last_name !== undefined ? last_name : user.last_name;
    const newAge = age !== undefined ? age : user.age;
    
    const result = await pool.query(
        'UPDATE users SET first_name = $1, last_name = $2, age = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [newFirstName, newLastName, newAge, id]
    );
    
    res.json(result.rows[0]);
});

app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({ message: 'Пользователь удалён' });
});

app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});