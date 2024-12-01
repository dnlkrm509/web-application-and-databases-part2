import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import expressSession from 'express-session';
import { MongoClient, ServerApiVersion } from 'mongodb';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import request from 'request';
import querystring from 'querystring';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(fileUpload());

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
    const personalDetailsCollection = database.collection('personal-details');
    const weatherCollection = database.collection('weather');

    return {client, usersCollection, postsCollection, followsCollection, personalDetailsCollection, weatherCollection}
}

app.get('/M01008906', async (req, res) => {
    const { client, personalDetailsCollection } = getClientDatabaseCollection();
    try {
        const details = await personalDetailsCollection.find().toArray();

        res.status(200).send(details);
        
    } catch(err) {
        error = "Connection to database failed with a " + err;
        console.log(error);

        // status 503 service unavailable error, if system has internal server error like issues making connection to a database
        res.status(503).json({ message: err });
    } finally {
        await client.close();
    }
    
});

app.post('/M01008906/users', async (req, res) => {
    const newUser = req.body;
    if(!newUser) {
        res.status(400).json({ message: `Bad request. New user must be a non-empty object.` });
        return;
    } 
    
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
            res.status(503).json({ error: err });
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

    // get user out of sessoin
    if(req.session.email === undefined) {
        res.status(400).send({ message: `Only logged in users can post a new content.` });
        return;
    }

    if(!newPost) {
        res.status(400).json({ message: `Bad request. New post must be a non-empty object.` });
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
            const conditions = followingList.map((userEmail) => ({ email: userEmail }));
            const posts = await postsCollection.find({$or: conditions }).toArray();
            let contents = [];

            for(let post of posts) {
                contents.push(post);
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

    // Log in and have the email to follow
    const { client, followsCollection, usersCollection } = getClientDatabaseCollection();
    try {
        // Firstly I need to check if the entered email is registered before taking any ferther action

        const otherUser = await usersCollection.find({email: email}).toArray();

        if(otherUser.length === 0) {
            res.status(404).send({message: "User is not registered."});
            return;
        }

        if (email === req.session.email) {
            //If we get to here there is an error
            //Details wrong
            res.status(404).send({message: "Users cannot follow themselves."});
            return;
        }

        const loggedinUserFollows = await followsCollection.find({email: req.session.email}).toArray();

        const loggedinUserUpdateQuery = { email: req.session.email };
        let loggedinUserUpdateDoc;

        
        // Calculate logged in user follow list length to identify and invoke the right method (whether to use post or update method)
        
        if(loggedinUserFollows.length  === 0){//No entry, create one
            const newFollows = {
                email: req.session.email,
                follows: [email]
            };

            followsCollection.insertOne(newFollows);
            res.status(200).send({ ...newFollows, message: 'Successfully followed the user.' });
            
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
            res.status(result.status).send({ email: req.session.email, ...result.body });

            return;

        }

        // Sysetm error - multiple users returned - we should have checked this earlier. Two users with same email address
        res.status(503).send({message: "Multiple users with same email have been found."})
        return;


    } catch (err) {
        console.error("Error: ", err);

        // status 503 service unavailable error, if system has internal server error like issues making connection to a database
        res.status(503).send({ message: err });
    } finally {
        client.close();
    }

});


app.delete('/M01008906/follow', async (req, res) => {
    const email = req.body.email;//Delete this later
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
        const loggedinUserFollowings = await followsCollection.find({ email: req.session.email }).toArray();

        if(req.session.email === email) {
            // The user is the logged in user
            res.status(400).send({ message: `Users cannot unfollow themselves.`});
            return;
        }

        if (loggedinUserFollowings.length === 0) {
            res.status(404).send({ message: 'User has not been found.' });
            return;
        }

        if(loggedinUserFollowings.length === 1){
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
            if(followed) {
                try {
                    // Calculate userFollowings length to specify whether to use delete or update method
                    if(loggedinUserFollowings[0].follows.length === 1) {
                        // Delete
                        const resultedFollows = await followsCollection.deleteOne({ email: req.session.email });
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

            res.status(result.status).send({currentUserResult: result.body });
            return;

        }


        // Sysetm error - multiple users returned - we should have checked this earlier. Two users with same email address
        res.status(404).send({message: "multiple users with same email."});
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
                // Posts have not been found
                res.status(404).send({ message: "Posts have not been found." });
            }
            else {
                res.status(200).send({ posts: existingPosts, message: "Posts have been found." });
            }
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        }

});

app.post('/M01008906/upload', (req, res) => {
    if(!req.files || Object.keys(req.files).length === 0) {
        res.status(404).send({ upload: false, message: `File is missing. Please select a file.` });
        return;
    }

    let file = req.files.file;

    const uploadDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadDir, file.name);
    
    // Create uploads directory if it does not exist
    fs.mkdir(uploadDir, { recursive: true });

    file.mv(filePath, (error) => {
        if(error) {
            res.status(503).send({ upload: false, message: JSON.stringify(error), fileName: file.name });
            return;
        }
        res.status(200).send({ upload: true, message: `File successfully uploaded`, fileName: file.name });
    });
});

app.post('/M01008906/weather', async (req, res) => {
    const coords = req.body;
    if(!coords) {
        res.status(400).json({ message: `Latitude and longitude parameters are required.` });
        return;
    }

    try {
        const date = new Date().toISOString();

        // Inspect MongoDB for recorded dates
        const { client, weatherCollection } = getClientDatabaseCollection();
        try {
            const response = await axios.get(`${process.env.WEATHER_API_URL}/${date}/precip_24h:mm/${coords.lat},${coords.lon}/json`, {
                auth: {
                    username: process.env.WEATHER_API_USERNAME,
                    password: process.env.WEATHER_API_PASSWORD
                }
            });
            const query = { date: date };
            const existingDate = await weatherCollection.find(query).toArray();
            
            // If obtained data does not exist in database insert it
            // but if it exists replace it
            if(!existingDate || existingDate.length === 0) {
                const result = await weatherCollection.insertOne({ date, value: response.data.data[0].coordinates[0].dates[0].value });
                console.log(result);
                
                res.status(200).json({ message:  `New data added.`, date, value: response.data.data[0].coordinates[0].dates[0].value});
            } else {
                const result = await weatherCollection.replaceOne(query, { date, value: response.data.data[0].coordinates[0].dates[0].value });
                console.log(`Modified ${result.modifiedCount} documents`);
                res.status(200).json({ message:  `Data updated.`, date, value: response.data.data[0].coordinates[0].dates[0].value});
            }
            
        } catch(err) {
            error = "Connection to database failed with a " + err;
            console.log(error);

            // status 503 service unavailable error, if system has internal server error like issues making connection to a database
            res.status(503).json({ message: err });
        } finally {
            await client.close();
        }
        
    } catch(err) {
        res.status(503).send({ message: 'An Error occurred connecting to weather server ' + err });
    }
});

app.post('/M01008906/search-recipe-spoonacular', async (req, res) => {
    const {query} = req.body;
    if(!query || query.length === 0) {
        res.status(400).json({ message: `Query parameters is required.` });
        return;
    }

    try {
        const response = await axios.get(`${process.env.SPOONACULAR_API_URL}?query=${query}&maxFat=25&number=12&apiKey=${process.env.SPOONACULAR_API_KEY}`)
        const recipes = response.data.results;
        console.log(recipes);
        res.status(200).json({ message:  `Search recipes was successful.`, recipes });
        
        
    } catch(err) {
        res.status(503).send({ message: 'An Error occurred connecting to spoonacular server ' + err });
    }
});

app.get('/M01008906/recipe-spoonacular/:id', async (req, res) => {
    const id = req.params.id;
    if(!id || id.length === 0) {
        res.status(400).json({ message: `Id is not identified.` });
        return;
    }

    try {
        const SPOONACULAR_API_RECIPE_INFORMATION = `https://api.spoonacular.com/recipes/${id}/information`;
        const response = await axios.get(`${SPOONACULAR_API_RECIPE_INFORMATION}?includeNutrition=false&apiKey=${process.env.SPOONACULAR_API_KEY}`);
        const recipe = response.data;
        console.log(recipe);
        res.status(200).json({ message:  `Search recipe was successful.`, recipe });
        
        
    } catch(err) {
        res.status(503).send({ message: 'An Error occurred connecting to spoonacular server ' + err });
    }

});

let accessToken;
let accessTokenExpiresIn;
let lastTokenMillis;

// Function to refresh the access token
async function refreshAccessToken() {
    const currentMillis = new Date().getTime();
    
    // Refresh the token if it's missing or about to expire
    if (!accessToken || accessTokenExpiresIn === undefined || currentMillis - lastTokenMillis > (accessTokenExpiresIn - 2 * 60 * 60) * 1000) {
        const options = {
            method: 'POST',
            url: 'https://oauth.fatsecret.com/connect/token',
            auth: {
                user: process.env.CLIENT_ID,
                password: process.env.CLIENT_SECRET,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            form: {
                grant_type: 'client_credentials',
                scope: 'basic',
            },
            json: true,
        };
        
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) return reject(error);
                
                accessToken = body.access_token;
                accessTokenExpiresIn = body.expires_in;
                lastTokenMillis = currentMillis;
                console.log('Access token refreshed:', accessToken);
                resolve();
            });
        });
    }
}

// POST route to download recipe data
app.post('/M01008906/download', async (req, res) => {
    const query = req.body.query;

    try {
        // Ensure the access token is refreshed before making the API request
        await refreshAccessToken(); // Ensure token is refreshed

        const params = {
            format: 'json',
            page_number: 0,
            max_results: 10,
            search_expression: query, // Ensure search_expression is set correctly
            recipe_types_matchall: true
        };

        // Log the full request URL to verify correctness
        const requestUrl = `${process.env.FATSECRET_API_URL}/recipes/search/v3?${querystring.stringify(params)}`;
        console.log('Request URL:', requestUrl);

        const options = {
            method: 'GET',
            url: requestUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`, // Ensure the token is included
            },
            json: true,
        };
        
        request(options, (error, response, body) => {
            if (error) {
                console.error('Error making request:', error);
                return res.status(500).send('Error making request to FatSecret');
            }

            // Log the response body for debugging purposes
            console.log('Response:', body);

            if (body && body.recipes) {
                // Return the response data to the client
                return res.json(body.recipes);
            } else {
                // Handle case where no recipes are found
                return res.json({ message: 'No results found' });
            }
        });
        
    } catch (error) {
        console.error('Error in /download route:', error);
        return res.status(500).send('Error in making the request');
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