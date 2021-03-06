require('dotenv').config();
const express = require('express');
const apiRouter = express.Router();

const jwt = require('jsonwebtoken');
//const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;

// set `req.user` if possible
apiRouter.use(async (req, res, next) => {
  //console.log(req);
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');

  if (!auth) { // nothing to see here
    console.log("noUser")
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);

    try {
      const { id } = jwt.verify(token, JWT_SECRET);

      if (id) {
        req.user = await getUserById(id);
        console.log(req.user)
        next();
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  } else {
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${ prefix }`
    });
  }
});

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user);
  }
  next();
});


const userRouter=require('./users');
apiRouter.use('/users', userRouter);

const postRouter=require('./posts');
apiRouter.use('/posts', postRouter);

const tagRouter=require('./tags');
const { getUserById } = require('../db');
apiRouter.use('/tags', tagRouter);

apiRouter.use((error, req, res, next) => {
    res.send({
      name: error.name,
      message: error.message
    });
  });

module.exports = apiRouter;
