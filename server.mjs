import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import expressSession from 'express-session';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use(express.static('public'));

app.use(expressSession({
    secret: process.env.SECRET,
    cookie: { maxAge: 60*60000, secure: false },
    resave: false,
    saveUninitialized: true
}));

let error;

function connectAtlas() {
    const encodedUsername = encodeURIComponent(process.env.DATABASE_USERNAME);
    const encodedPassword = encodeURIComponent(process.env.DATABASE_PASSWORD);
    const server = "cluster0.m9wsj.mongodb.net";

    const connectionURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority`;

    const client = new MongoClient(connectionURI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: false,
            deprecationErrorse: true,
        }
    });

    return client;
}



function connect() {
    const connectionURL = "mongodb://127.0.0.1:27017?retryWrites=true&w=majority";

    const client = new MongoClient(connectionURL, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: false,
            deprecationErrorse: true,
        }
    });

    return client;
}

function getClientDatabaseCollection() {

    let client =connect();
    console.log("Connection made");

    // Selection database and collection
    const database = client.db('recipe');

    const usersCollection = database.collection('users');
    const postsCollection = database.collection('posts');
    const followsCollection = database.collection('follows');

    return {client, usersCollection, postsCollection, followsCollection}
}

app.get('/M01008906', (req, res) => {
    //res.status(200).send("{ name: 'Daniel Karimi', email: 'DK807@live.mdx.ac.uk', studentId: 'M01008906' }");
    res.status(200).json({ name: 'Daniel Karimi', email: 'DK807@live.mdx.ac.uk', studentId: 'M01008906' });
});

app.post('/M01008906/users', async (req, res) => {
    const newUser = req.body;
    if(!newUser) {
        res.status(400).json({ message: `Bad request. New user must be a non-empty object.` });
    } else {

        const { client, usersCollection } = getClientDatabaseCollection();
        try {
            const query = { email: newUser.email };

            const existingUser = await usersCollection.find(query).toArray();
            
            if(!existingUser || existingUser.length === 0) {
                const result = await usersCollection.insertOne(newUser);
                console.log(result);
                
                res.status(200).json({ message:  `user added.`});
            } else {
                res.status(200).json({ message:  `user exists.`});
            }
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        } 

    }
});

app.get('/M01008906/login', (req, res) => {
    if(req.session.email !== undefined){
        res.send({loggedIn: true, email: req.session.email});
    }
    else{
        res.send({loggedIn: false});
    }
});

app.post('/M01008906/login', async (req, res) => {
    // status 400 bad request, if user is an empty object

    const user = req.body;

    if(!user || user.length === 0) {
        res.status(400).json({ message: `Bad request. User must be a non-empty object.` });
    } else {
        
        const { client, usersCollection } = getClientDatabaseCollection();
        try {

            const query = {$and: [ { email: user.email }, {password: user.password}]};

            const existingUsers = await usersCollection.find(query).toArray();
            if(existingUsers.length === 1){
                req.session.email = user.email;
                // Found one user - login correct
                res.send({login: true})
            }
            else if(existingUsers.length === 0){
                //Details wrong username/password combination wrong
                res.send({login: false, message: "username and/or password incorrect."})
            }
            else {
                // Sysetm error - multiple users returned - we should have checked this earlier. Two users with same email address
                res.status(404).send({error: "multiple users with same email."})
            }
            return;
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        }
        
    }

});

app.delete('/M01008906/login', (req, res) => {
    req.session.destroy( err=>{
        if(err)
            res.send({error: JSON.stringify(err)});
        else{
            res.send({login: false});
        }
    });

});

app.post('/M01008906/contents', async (req, res) => {
    const newPost = req.body;
    if(!newPost) {
        res.status(400).json({ message: `Bad request. New user must be a non-empty object.` });
    } else {

        const { client, postsCollection } = getClientDatabaseCollection();
        try {
            const result = await postsCollection.insertOne(newPost);
            console.log(result);
            
            res.status(200).json({ message:  `New post added.`});
        
            return;
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        } 

    }
});

app.get('/M01008906/contents', async (req, res) => {
    if(req.session.email === undefined) {
        res.status(400).send({ message: `Contents cannot be accessed because you are not logged in.` });
    } else {
        
        const { client, followsCollection, postsCollection } = getClientDatabaseCollection();
        try {
            
            // Commence with finding list of followings
            const currentUser = await followsCollection.find({ email: req.session.email }).toArray();
            const followingList = currentUser[0].follows;
            
            // Now that I have list of followings I can access their contents
            const conditions = followingList.map((user) => ({ email: user.email }));
            const posts = await postsCollection.find({$or: conditions }).toArray();
            let contents = [];

            for(let post of posts) {
                contents.push(post.text);
            }
            

            res.status(200).json({ contents });
        
            return;
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        } 

    }
});

app.post('/M01008906/follow', async (req, res) => {
    const email = req.body.email;//Person we want to follow

    if (req.session.email === undefined) {
        res.status(400).send({ message: `Follow request cannot be made because you are not logged in.` });
        return;
    } 
    if (!email) {
        res.status(400).send({ message: `Follow request cannot be made because your request does not include an email address.` });
        return;
    }

    // Logged in and have the email to follow
    const { client, followsCollection } = getClientDatabaseCollection();
    try {

        // Identify both logged in user and user being followed to perform the follow action mutually
        
        const loggedinUserFollows = await followsCollection.find({email: req.session.email}).toArray();
        const otherUserFollows = await followsCollection.find({email: email}).toArray();


        const otherUserUpdateQuery = { email: email };
        let otherUserUpdateDoc;

        const loggedinUserUpdateQuery = { email: req.session.email };
        let loggedinUserUpdateDoc;

        if (email !== req.session.email) {
            // In each cases I insert / update TWO documents. One for the logged in user
            // and the other one for the user being followed.


            if(loggedinUserFollows.length  === 0){//No entry, create one
                const newFollows = {
                    email: req.session.email,
                    follows: [email]
                };

                followsCollection.insertOne(newFollows);
                //Send back reseponse to client


                // Chech if the other user has followed anyone to specify the http request method
                if(otherUserFollows.length !== 0) {
                    otherUserUpdateDoc = {$set : { email: req.session.email, follows: [...otherUserFollows[0].follows, email ] } };

                    let followedUsers = otherUserFollows[0].follows;
                    let followed = false;

                    for(let e of followedUsers) {
                        if(e === email) {
                            followed = true;
                        }
                    }

                    let otherResult = {};
                    if(!followed) {
                        try {
                            const resultedFollows = await followsCollection.updateOne(otherUserUpdateQuery, otherUserUpdateDoc);
                            console.log(`${resultedFollows.modifiedCount} documents updated.`);
                            
                            otherResult = { status: 200, body: { follows: email, message: 'Successfully followed the user.' } };
                        } catch (err) {
                            otherResult = { status: 503, body: { message: 'Error updating follow', error: err.message } };
                        }
                    } else {
                        otherResult = { status: 400, body: { message: `The user has already been followed.` } };
                    }
                    res.status(otherResult.status).send({ email: req.session.email, ...otherResult.body });
                    
                } else {
                    followsCollection.insertOne({ email: email, follows: [req.session.email] });
                    res.status(200).send({ ...newFollows, message: 'Successfully followed the user.' });
                }


                
                return;
            }


    
            if(loggedinUserFollows.length === 1){
                let followedUsers = loggedinUserFollows[0].follows;
                let followed = false;

                for(let e of followedUsers) {
                    if(e === email) {
                        followed = true;
                    }
                }

                let result = {};
                if(!followed) {
                    try {
                        loggedinUserUpdateDoc = {$set : { follows: [ ...loggedinUserFollows[0].follows, email ] } };

                        const resultedFollows = await followsCollection.updateOne(loggedinUserUpdateQuery, loggedinUserUpdateDoc);
                        console.log(`${resultedFollows.modifiedCount} documents updated.`);
            
                        result = { status: 200, body: { follows: email, message: 'Successfully followed the user.' } };
                    } catch (err) {
                        result = { status: 503, body: { message: 'Error updating follow', error: err.message } };
                    }
                } else {
                    result = { status: 400, body: { message: `The user has already been followed.` } };
                }




                
                // Chech if the other user has followed anyone to specify the http request method
                if(otherUserFollows.length !== 0) {
                    otherUserUpdateDoc = {$set : { follows: [ ...otherUserFollows[0].follows, email ] } };
                    
                    followedUsers = otherUserFollows[0].follows;
                    followed = false;

                    for(let e of followedUsers) {
                        if(e === req.session.email) {
                            followed = true;
                        }
                    }

                    let otherResult = {};
                    if(!followed) {
                        try {
                            const resultedFollows = await followsCollection.updateOne(otherUserUpdateQuery, otherUserUpdateDoc);
                            console.log(`${resultedFollows.modifiedCount} documents updated.`);
                            
                            otherResult = { status: 200, body: { follows: email, message: 'Successfully followed the user.' } };
                        } catch (err) {
                            otherResult = { status: 503, body: { message: 'Error updating follow', error: err.message } };
                        }
                    } else {
                        otherResult = { status: 400, body: { follows: email, message: `The user has already been followed.` } };
                    }
                    res.status(otherResult.status).send({ email: req.session.email, ...otherResult.body });


                } else {
                    followsCollection.insertOne({ email: email, follows: [req.session.email] });
                    res.status(200).send({ email: req.session.email, follows: email, message: 'Successfully followed the user.' });
                }
                
    
                //Update data by adding new email
    
                //Replace in database 
    
                //~Return 
    
                return;
    
            }

            // Sysetm error - multiple users returned - we should have checked this earlier. Two users with same email address
            res.status(503).send({error: "Multiple users with same email have been found."})
            return;

        }

        //If we get to here there is an error
        //Details wrong
        res.status(404).send({message: "Users cannot follow themselves."})

    } catch (err) {
        console.error("Error: ", err);

        // status 503 service unavailable error, if system has internal server error like issues making connection to a database
        res.status(503).send({ message: err });
    } finally {
        client.close();
    }

});


app.delete('/M01008906/follow', async (req, res) => {
    const email = req.body.email;//Deklete this later
    if (req.session.email === undefined) {
        res.status(400).send({ message: `Unfollow request cannot be made because you are not logged in.` });
        return;
    }
    
    if (!email) {
        res.status(400).send({ message: `Unfollow request cannot be made because your request does not include an email address.` });
        return;
    }


    // Unfollow request was sent
    const { client, followsCollection } = getClientDatabaseCollection();
    try {
        // Login, unfollow and update the user in the user following list
        

        const otherUserFollowings = await followsCollection.find({ email: email }).toArray();
        const loggedinUserFollowings = await followsCollection.find({ email: req.session.email }).toArray();

        if(req.session.email === email) {
            // The user is the logged in user
            res.status(400).send({ message: `Users cannot unfollow themselves.`});
            return;
        }

        if (loggedinUserFollowings.length === 0 || otherUserFollowings.length === 0) {
            res.status(404).send({ message: 'User has not been found.' });
            return;
        }

        if(loggedinUserFollowings.length === 1){
            const otherUserUpdateQuery = { email: email };
            let otherUserUpdateDoc;


            const loggedinUserUpdateQuery = { email: req.session.email };
            let loggedinUserUpdateDoc;
            
                const updatedFollowing = loggedinUserFollowings[0].follows.filter((follow) => follow !== email);

                loggedinUserUpdateDoc = {$set : { follows: updatedFollowing } };

                
                let followedUsers;
                let followed = false;

                followedUsers = loggedinUserFollowings[0].follows;

                for(let e of followedUsers) {
                    if(e === email) {
                        followed = true;
                    }
                }
    

                let result = {};
                let resultOther = {};

                if(followed) {
                    try {
                        // Calculate userFollowings length to specify whether to use delete or update method
                        if(loggedinUserFollowings[0].follows.length === 1) {
                            // Delete
                            const resultedFollows = await followsCollection.deleteOne({ follows: email });
                            console.log(`${resultedFollows.deletedCount} documents deleted.`);

                            result = { status: 200, body: { unfollows: email, message: 'Successfully unfollowed the user.' } };
                        } else if(!loggedinUserFollowings || loggedinUserFollowings.length === 0) {
                            result = { status: 404, body: { message: 'User has not been found.' } };
                        } else {
                            // Update
                            const resultedFollows = await followsCollection.updateOne(loggedinUserUpdateQuery, loggedinUserUpdateDoc);
                            console.log(`${resultedFollows.modifiedCount} documents updated.`);

                            result = { status: 200, body: { unfollows: email, message: 'Successfully unfollowed the user.' } };
                        }
                    } catch (err) {
                        result = { status: 503, body: { message: 'Error updating unfollow', error: err.message } };
                    }
            
                    
                } else {
                    result = { status: 400, body: { message: `The user has not been followed.`  } };
                }


                // Chech if the other user has followed anyone
                if(result.status === 200) {
                    if(otherUserFollowings.length !== 0) {
                        const updatedFollowing = otherUserFollowings[0].follows.filter((follow) => follow !== req.session.email);
    
                        otherUserUpdateDoc = {$set : { follows: updatedFollowing } };
                        
                        let followedUsers;
                        let followed = false;
    
                        followedUsers = otherUserFollowings[0].follows;
    
                        for(let e of followedUsers) {
                            if(e === req.session.email) {
                                followed = true;
                            }
                        }

                        if(followed) {
                            try {
                                // Calculate userFollowings length to specify whether to use delete or update method
                                if(otherUserFollowings[0].follows.length === 1) {
                                    // Delete
                                    const resultedFollows = await followsCollection.deleteOne({ follows: req.session.email });
                                    console.log(`${resultedFollows.deletedCount} documents deleted.`);
    
                                    resultOther = { status: 200, body: { unfollows: req.session.email, message: 'Successfully unfollowed the user.' } };
                                } else if(!loggedinUserFollowings || loggedinUserFollowings.length === 0) {
                                    resultOther = { status: 404, body: { message: 'User has not been found.' } };
                                } else {
                                    // Update
                                    const resultedFollows = await followsCollection.updateOne(otherUserUpdateQuery, otherUserUpdateDoc);
                                    console.log(`${resultedFollows.modifiedCount} documents updated.`);
    
                                    resultOther = { status: 200, body: { unfollows: req.session.email, message: 'Successfully unfollowed the user.' } };
                                    return;
                                }
                            } catch (err) {
                                resultOther = { status: 503, body: { message: 'Error updating unfollow', error: err.message } };
                            }
                
                        
                        } else {
                            resultOther = { status: 400, body: { message: `The user has not been followed.`  } };
                        }
                        
                    }

                }

                 res.status(resultOther.status).send({currentUserResult: result.body, otherUserResult: resultOther.body});
                 return;

        }


        // Sysetm error - multiple users returned - we should have checked this earlier. Two users with same email address
        res.status(404).send({error: "multiple users with same email."});
        return;

    } catch (err) {
        error = "Connection to database failed with a " + err;
        console.log(error);

        // status 503 service unavailable error, if system has internal server error like issues making connection to a database
        res.status(503).send({ message: err });
    } finally {
        await client.close();
    }
    
});

app.get('/M01008906/users/search', async (req, res) => {
    const searchText = req.query.search;

    const { client, usersCollection } = getClientDatabaseCollection();
        try {
            const query = { $text: { $search:  searchText } };

            const existingUsers = await usersCollection.find(query).toArray();
            
            if(existingUsers.length === 0){
                //Users have not been found
                res.status(404).send({ message: "Users have not been found." });
            }
            else {
                res.status(200).send({ users: existingUsers, message: "Users have been found." });
            }
            return;
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        }

});

app.get('/M01008906/contents/search', async (req, res) => {
    const searchText = req.query.search;

    const { client, postsCollection } = getClientDatabaseCollection();
        try {
            const query = { $text: { $search:  searchText } };

            const existingPosts = await postsCollection.find(query).toArray();
            
            if(existingPosts.length === 0){
                // Posts have not benn found
                res.status(404).send({ message: "Posts have not been found." });
            }
            else {
                res.status(200).send({ posts: existingPosts, message: "Posts have been found." });
            }
            return;
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        }

});

const PORT = process.env.PORT || 80;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
});

server.on('error', (error) => {
    if(error == 'EADDINUSE') {
        console.log(`Port ${process.env.PORT} is already in use. Please use a different port.`);
        process.exit(1);
    } else {
        console.error(`Server error`, error);
    }
});