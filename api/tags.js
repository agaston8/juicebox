const express = require('express');
const { reset } = require('nodemon');
const tagsRouter = express.Router();
const {getAllTags, getPostsByTagName} = require('../db');

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    // read the tagname from the params
    const { tagName } = req.params;
    try {
        const allPosts = await getPostsByTagName(tagName);
        if (allPosts) {
            const posts = allPosts.filter(post => {
                return post.active || (req.user && post.author.id === req.user.id);
            })
            console.log(posts)
            res.send({posts:posts});
        } else {
            next({
                name: "Error on getPostsByTagName",
                message: "Could not get posts by tag name"
            })
        }
    } catch ({ name, message }) {
      next({name, message})
    }
  });

tagsRouter.use((req, res, next) => {
    console.log('making tags request....');
    next();
});

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();
    res.send({tags});

});

module.exports = tagsRouter;