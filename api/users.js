const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { createUser } = require('../db');



const {getAllUsers, getUserByUsername} = require('../db');

usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

   // res.send({message: 'hello form /users!'});
   next();
});

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
    res.send({users});
});

usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    //set up body barser
  
    // request must have both
    if (!username || !password) {
      next({
        name: "MissingCredentialsError",
        message: "Please supply both a username and password"
      });
    }
    
    try {
      const user = await getUserByUsername(username);
  
      if (user && user.password == password) {
        //create token & return to user
        const token = jwt.sign({
          id: user.id,
          username: user.username}, 
          process.env.JWT_SECRET,
        );
        res.send({ message: "you're logged in!", token: token });
      } else {
        next({ 
          name: 'IncorrectCredentialsError', 
          message: 'Username or password is incorrect'
        });
      }
    } catch(error) {
      console.log(error);
      next(error);
    }
  });

//   Require the jsonwebtoken package, store it in a constant jwt
// Sign an object (something like jwt.sign({/* user data */}, process.env.JWT_SECRET)) with both the id and username from the user object with the secret in process.env.JWT_SECRET
// Add a key of token, with the token returned from step 2, to the object passed to res.send()


usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user by that username already exists'
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign({ 
      id: user.id, 
      username
    }, process.env.JWT_SECRET, {
      expiresIn: '1w'
    });

    res.send({ 
      message: "thank you for signing up",
      token 
    });
  } catch ({ name, message }) {
    next({ name, message })
  } 
});



module.exports = usersRouter;