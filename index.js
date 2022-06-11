const PORT =3000;
const express=require('express');
const app = express();
const { append } = require('express/lib/response');
const server=express();
const morgan=require('morgan');
server.use(morgan('dev')); //logs incoming req getting the method, rt, and how long
server.use(express.json());// reads json from req
const{client}=require('./db');
const bodyParser = require('body-parser');


client.connect();

server.use(bodyParser.json());

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
  });

  server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
  
    next();
  });

// POST /api/users/register
// POST /api/users/login
// DELETE /api/users/:id

// GET /api/posts
// POST /api/posts
// PATCH /api/posts/:id
// DELETE /api/posts/:id

// GET /api/tags
// GET /api/tags/:tagName/posts
//can add all this info by doing this
// server.post('/api/users/register', () => {});
// server.post('/api/users/login', () => {});
// server.delete('/api/users/:id', () => {});
// ecttt/...
//OR
const apiRouter=require('./api');
server.use('/api', apiRouter);
