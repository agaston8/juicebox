const express = require('express');
const tagsRouter = express.Router();


const {getAllTags} = require('../db');

tagsRouter.use((req, res, next) => {
    console.log('making tags request....');
    next();
});

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();
    res.send({tags});

});

module.exports = tagsRouter;