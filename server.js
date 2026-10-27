const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'M-PESA Expense Tracker API is running'})
});

app.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.status(200).json({ received: true });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});