const {Client} =require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev')

async function createUser({username, password, name, location}) {
    try {
        const {rows: [user]} = await client.query(`
            INSERT INTO users(username, password, name, location) 
            Values ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;`,
            [username, password, name, location]);
    return user;
    } catch (error){
        throw(error)
    }
}

async function updateUser(id, fields = {}) {

    const setString=Object.keys(fields).map(
        (key, index) => `"${key}"=$${index+1}`).join (', ');

    if (setString.length === 0) {
        return;
    }

    try {
        const {rows: [user]} = await client.query(`
        UPDATE users
        SET ${setString}
        WHERE id= ${id}
        RETURNING *;`, 
        Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    try {
      const { rows } = await client.query(`
        SELECT id, username, name, location, active 
        FROM users;
      `);
  
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async function getUserById(userId) {
    try{
        const {rows:[user]} = await client.query(`
            SELECT id, username, name, location, active
            FROM users
            WHERE id=${userId}
        `);

        if (!user) {
            return null
        }

        user.posts =await getPostsByUser(userId);

        return user;
     } catch(error) {
        throw error
    }
}

//POST METHODS

async function createPost({
    authorId,
    title,
    content,
    tags = []
  }) {
      //console.log("im in the function createPost")
      //console.log("these are getting passed in :", authorId, title, content, tags)
    try {
      const { rows: [ post ] } = await client.query(`
        INSERT INTO posts("authorId", title, content) 
        VALUES($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);
      //console.log(post)

      const tagList = await createTags(tags);
       // console.log(tagList)//this is undefined
      return await addTagsToPost(post.id, tagList);
    } catch (error) {
      throw error;
    }
  }

  async function updatePost(postId, fields = {}) {

    //read off the tags and remove that field
    const {tags} = fields;
    delete fields.tags;

    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    try {
        //update any fields that need to be updated
        if (setString.length > 0) {
      //const { rows: [ post ] } = 
            await client.query(`
                UPDATE posts
                SET ${ setString }
                WHERE id=${ postId }
                RETURNING *;
            `, Object.values(fields));
        }
        //return early if no tags to update
        if (tags=== undefined) {
            return await getPostById(postId);
        }  
        //make new tags that need to be made
        const tagList = await createTags(tags);
        console.log(tagList)
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');
        
        //delete any post_tags from the database which arent in that tagList
        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${tagListIdString})
        AND "postId"=$1;`,
        [postId]);
        
        //and create post_tags as necessary
        await addTagsToPost(postId, tagList);
        
        return await getPostById(postId)
      //return post;
    } catch (error) {
      throw error;
    }
  }

async function getAllPosts() {

    try {
      const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
      `);

      const posts= await Promise.all(postIds.map(
          post => getPostById(post.id)
      ));
        
      //console.log("THESE SHOULD BE THE POSTS", posts)
      return posts;
    } catch (error) {
      throw error;
    }
  }

  async function getPostById(postId) {
    try {
        const {rows:[post]} = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;`, [postId]);

        if (!post) {
            throw {
                name: "postnotfound",
                message: "couldn't find post with that id"
            }
        }

        const {rows: tags} = await client.query(`
            SELECT tags.*
            FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1;`,
            [postId])

        const {rows: [author]} = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;`, 
        [post.authorId])
        
        post.tags=tags;
        post.author=author;

        delete post.authorId;

        return post;
    } catch(error) {
        throw error
    }
}



async function getPostsByUser(userId) {
   
    try {
        const {rows: postIds} = await client.query(`
        SELECT id
        FROM posts
        WHERE "authorId"=${userId};`);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;//THIS IS NOT WORKING RIGHT
    } catch (error){
        throw error;
    }
}

async function getPostsByTagName(tagName) {
    try{
        const {rows: postIds} = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;`, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    } catch (error) {
        throw error;
    }

}

//TAG METHODS

async function createTags(tagList) {
   // console.log("im in createTags function and this is the tagList", tagList)
    
    if (tagList.length === 0) {
        //console.log("Taglist length 0")
        return;
    }

    const insertValues =tagList.map ((
         tag, index) => `$${index +1}`).join('),(');

         
    
    const selectValues = tagList.map((tag,index)=> `$${index+1}`).join(',');

   // console.log("--------------", selectValues, insertValues)

    try {
        await client.query(`
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;
        `, tagList);

        const {rows} = await client.query(`
        SELECT * FROM tags
        WHERE name
        IN (${selectValues});`,
        tagList);

       // console.log( "__________________", rows) //THIS IS NOT WORKING RIGHT
        return rows
    } catch(error) {
        error
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId])
    } catch (error) {
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}

async function getAllTags (){
    try {
        const {rows} = await client.query(`
        SELECT *
        FROM tags;`);
        return rows;
    } catch (error) {
        throw error;
    }
}

async function getUserByUsername(username) {
    try {
        const {rows: [user]} = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
        `, [username]);

        return user;
    } catch (error) {
        throw error;
    }
}


module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser, 
    addTagsToPost,
    createTags,
    getPostsByTagName,
    getAllTags, 
    getUserByUsername
}