const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
const app = express();
const port = 3000;

app.use(express.json());

const JWT_KEY = 'THIS_IS_TOP_SECRET';

const authenticateJWT = (req, res, next) =>{
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(404);
  }
};

app.use(async (req, res, next) => {
  global.db = await mysql.createConnection({ 
    host: process.env.host, 
    user: process.env.user, 
    password: process.env.password, 
    database: process.env.database, 
    port: process.env.port,
    multipleStatements: true 
  });

  global.db.config.namedPlaceholders = true;

  global.db.query(`SET time_zone = '-8:00'`);
  await next();
});

app.post('/login', async (req, res) => {
  console.log('login.req.body', req.body);

  const {email, password} = req.body;

  // Filter user from the users array by username and password
  const [[user]] = await global.db.query('SELECT * FROM user WHERE email = ?', [email]);

  const match = await bcrypt.compare(password, user.password);

  if (user && match) {
    // Generate an access token
    const token = jwt.sign({ id:user.id, email: user.email }, JWT_KEY);

    res.json({
      jwt: token
    });
  } else {
    res.send('Email or password incorrect');
  }
});

app.post('/user/create', async (req, res) => {
  console.log("req.body", req.body);

  try {
    const hash = await bcrypt.hash(req.body.password, 10);

    const [user] = await global.db.query(`
      INSERT INTO user (email, password) VALUES (:email, :password);
      `, {
      email: req.body.email,
      password: hash
    })

    console.log(user)

    res.send({message: "New user created!", user})
  }
  catch( err ) {
    console.log(err);
    res.status(500).json({
      message: err.message
    })
  };
});

app.get('/', authenticateJWT, async(req, res) => {
  console.log('req.user', req.user);

  const [data] = await global.db.query(`SELECT * FROM car WHERE user_id = ?`, [req.user.id]);

  res.send({
    data
  });
});

app.get('/car/:id',authenticateJWT, async (req, res) => {
  const [data] = await global.db.query(`SELECT * FROM car WHERE id = ?`, [req.params.id]);

  res.send({
    data
  });
});

app.post('/car',authenticateJWT, async (req, res) => {
  try {
    const [[makeId]] = await global.db.query(`
    SELECT id FROM car_make WHERE name = ?
    `, [
      req.body.make
    ]);
  
    const [car] = await global.db.query(`
    INSERT INTO car (make_id, color, date_entered, user_id) 
    VALUES (:makeId, :color, SUBTIME(now(), "8:00:00"), :userId)
    `, {
      makeId: makeId.id, 
      color: req.body.color,
      userId: req.user.id
    });
  
    res.send({message: 'I am posting data!', car});
  } catch (err) {
    console.log(err);
    res.status(500).json({message: err.message})
  };
});

app.put('/car/:id',authenticateJWT, async (req, res) => {
  // You can pretty much do the same thing with POSTs

  try {
    
    const [[make]] = await global.db.query(`
      SELECT id
      FROM car_make
      WHERE name = ?
      `,[
        req.body.make
      ]);

    const car = await global.db.query(`
      UPDATE car 
      SET make_id = ?, color = ?, date_entered = SUBTIME(now(), "8:00:00")
      WHERE id = ? AND user_id = ?
      `,[
        make.id,
        req.body.color,
        req.params.id,
        req.user.id
    ])

    res.send({message: "Updated car"});
  } catch (err) {
    console.log(err);
    res.status(500).json({message: err.message})
  }

});

app.delete('/:id', authenticateJWT, async (req, res) => {
  await global.db.query(`DELETE FROM car WHERE id = ?`, [req.params.id]);
  res.send('I am deleting data!')
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

/*
TO DO:
-Refactor code:
-Seperate routes (user, car)
-Seperate middleware
-Authorization: User can only edit their own inputted data
-Error handling: different situations
*/