const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

app.use(express.json());

app.use(async (req, res, next) => {
  global.db = await mysql.createConnection({ 
    host: 'xxxxxxx', 
    user: 'root', 
    password: 'xxxxxxxx', 
    database: 'bvt_demo', 
    multipleStatements: true 
  });

  global.db.query(`SET time_zone = '-8:00'`);
  await next();
});

app.get('/:id', async (req, res) => {
  const [data] = await global.db.query(`SELEcT * FROM car WHERE id = ?`, [req.params.id]);

  res.send({
    data
  });
});

app.post('/', async (req, res) => {
  await global.db.query(`INSERT INTO car (make_id, color) VALUES (?, ?)`, [
    req.body.makeId, 
    req.body.color
  ]);

  res.send('I am posting data!')
});

app.put('/', (req, res) => {
  // You can pretty much do the same thing with POSTs
});

app.delete('/:id', async (req, res) => {
  await global.db.query(`DELETE FROM car WHERE id = ?`, [req.params.id]);
  res.send('I am deleting data!')
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});