const express = require('express');
const apiRouter = express.Router();

const userRouter=require('./users');
apiRouter.use('/users', userRouter);

const postRouter=require('./posts');
apiRouter.use('/posts', postRouter);

const tagRouter=require('./tags');
apiRouter.use('/tags', tagRouter);

module.exports = apiRouter;