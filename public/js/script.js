const SERVER_HOST_URL = 'http://localhost:8080';

const searchMethod = document.getElementById("search-method");

const weatherDiv = document.getElementById("weather");

let latitude, longitude;

const personalDetails = document.getElementById('personal-details');

const fileInput = document.getElementById('file-input');
const responseUpload = document.getElementById('response-upload');

const avatar = document.getElementById('avatar');

const searchUsersDiv = document.getElementById('search-users-div');
const searchContentsDiv = document.getElementById('search-contents-div');

const searchUsers = document.getElementById('search-users');
const searchContents = document.getElementById('search-contents');

const searchFoodSpoonacularDiv = document.getElementById('search-food-spoonacular-div');

const searchRecipeNameSpoonacular = document.getElementById('search-recipe-name-spoonacular');

const searchFoodFatsecretDiv = document.getElementById('search-food-fatsecret-div');

const searchRecipeNameFatsecret = document.getElementById('search-recipe-name-fatsecret');

const responseDivSearch = document.getElementById('response-search');

const nameRegister = document.getElementById('name-register');
const emailRegister = document.getElementById('email-register');
const passwordRegister = document.getElementById('password-register');

const emailLogin = document.getElementById('email-login');
const passwordLogin = document.getElementById('password-login');

const emailLoginFollow = document.getElementById('email-login-follow');

const responseDivRegister = document.getElementById('response-register');
const responseDivLogin = document.getElementById('response-login');

const contentsDiv = document.getElementById('contents');

const text = document.getElementById('message-text');

// On initial window load loads personal details and default profile picture
window.onload = async () => {
    avatar.src = "Images/avatar.png";
    contentsDiv.innerHTML = "<center><h4>No contents to display.</h4></center>";

    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906`);
        
        let data;
        if(response.ok) {
            data = await response.json();

            personalDetails.innerHTML = `Name: ${data[0].name}<br>
            Email: ${data[0].email}<br>
            Student ID: ${data[0].studentId}`;
        } else {
            personalDetails.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);
        
    } catch(err) {
        personalDetails.innerHTML = err;
    }
}

/*
 emptyText function empties post textArea every time they open the post modal to enter a new post
 The same operation happens with emptyLoginFields and emptyRegistrationFields functions
*/

function emptyText() {
    text.value = "";
}

function emptyLoginFields() {
    emailLogin.value = "";
    passwordLogin.value = "";
    responseDivLogin.innerHTML = "";
}

function emptyRegisterFields() {
    nameRegister.value = "";
    emailRegister.value = "";
    passwordRegister.value = "";
    responseDivRegister.innerHTML = "";
}

async function uploadFile() {
    responseUpload.innerHTML = "";

    try {
        let myFiles = fileInput.files;
        if(myFiles.length !== 1) {
            responseUpload.innerHTML = "Files missing. Please select a file."
            return;
        }

        const fileOBJ = new FormData();
        fileOBJ.append('file', myFiles[0]);

        const response = await fetch(`${SERVER_HOST_URL}/M01008906/upload`, {
            method: 'POST',
            body: fileOBJ
        });
        
        let data;
        if(response.ok) {
            data = await response.json();
            avatar.src = `../uploads/${data.fileName}`;
            
            responseUpload.innerHTML = "Mesage: " + data.message + "<br>file name: " + data.fileName + "<br>upload: " + data.upload;
            
            
        }

        console.log(data);
    } catch (error) {
        responseUpload.innerHTML = `An error occurred ` + error;
    }
}

// Choose a search method by selecting an option of a select element (dropdown).
// Value of the picked option specifies which element gets displayed.

function searchMethodSelect() {
    const val = searchMethod.value;
    responseDivSearch.innerHTML = "";

    switch(val) {
        case 'users':
            searchUsersDiv.style.display = "block";

            searchContentsDiv.style.display = "none";
            searchFoodSpoonacularDiv.style.display = "none";
            searchFoodFatsecretDiv.style.display = "none";
            break;
        case 'contents':
            searchContentsDiv.style.display = "block";

            searchUsersDiv.style.display = "none";
            searchFoodSpoonacularDiv.style.display = "none";
            searchFoodFatsecretDiv.style.display = "none";
            break;
        case 'spoonacular-api':
            searchFoodSpoonacularDiv.style.display = "block";

            searchContentsDiv.style.display = "none";
            searchUsersDiv.style.display = "none";
            searchFoodFatsecretDiv.style.display = "none";
            break;
        case 'fatsecret-api':
            searchFoodFatsecretDiv.style.display = "block";

            searchContentsDiv.style.display = "none";
            searchUsersDiv.style.display = "none";
            searchFoodSpoonacularDiv.style.display = "none";
            break;
    }
}

// Sends a POST request to /M01008906/users path of web service and web service replies with a relavant response in JSON format

async function register() {
    if(nameRegister.value.length === 0 || emailRegister.value.length === 0 || passwordRegister.value.length === 0) {
        responseDivRegister.innerHTML =  `Bad request. New user must be a non-empty object.`;
        return;
    }

    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/users`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: nameRegister.value, email: emailRegister.value, password: passwordRegister.value })
        });
        
        let data;
        if(response.ok) {
            data = await response.json();
    
            responseDivRegister.innerHTML = data.message;
        } else {
            responseDivRegister.innerHTML += "HTTP error: " + response.status;
        }

        console.log(data);
        
        
    } catch(err) {
        responseDiv.innerHTML = err;
    }
}

// Sends a POST request to /M01008906/login path of web service and web service replies with a relavant response in JSON format

async function login() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailLogin.value, password: passwordLogin.value })
        });

        let data;
        if (response.ok) {
            data = await response.json();
    
            if(response.status === 404 || response.status === 503) {
                responseDivLogin.innerHTML = data.error;
            } else {
                if(data.login) {
                    responseDivLogin.innerHTML = "Login: " + data.login;
                } else {
                    responseDivLogin.innerHTML = "Login: " + data.login + ", message: " + data.message;
                }
                contentsDiv.innerHTML = "";
            }
        } else {
            responseDivLogin.innerHTML = "HTTP error: " + response.status;
        }

        contentsDiv.innerHTML = "";
        getContents();

        console.log(data);
        
    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
    
}

// Sends a GET request to /M01008906/login path of web service and web service replies with a relavant response in JSON format

async function checkStatus() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/login`);
        
        let data;
        contentsDiv.innerHTML = "";

        if(response.ok) {
            data = await response.json();
            if(data.email) {
                contentsDiv.innerHTML = "Loggedin: " + data.loggedIn + ", email: " + data.email;
            } else {
                contentsDiv.innerHTML = "Loggedin Status: " + data.loggedIn;
            }
            
        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        contentsDiv.innerHTML = err;
    }
    contentsDiv.innerHTML += '<br>';
    getContents();
    
}

// Sends a DELETE request to /M01008906/login path of web service and web service replies with a relavant response in JSON format

async function logout() {
    contentsDiv.innerHTML = "";

    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/login`, {
            method: 'DELETE'
        });

        let data;
        if(response.ok) {
            data = await response.json();

            if(!data.error) {
                contentsDiv.innerHTML = "Loggedin: " + data.login;
            } else {
                contentsDiv.innerHTML = "Error: " + data.error;
            }

        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        contentsDiv.innerHTML = err;
    }
}

// Sends a POST request to /M01008906/contents path of web service and web service replies with a relavant response in JSON format

async function setContent() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/contents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text.value })
        });
        
        let data;
        if(response.status === 400) {
            data = await response.json();
            contentsDiv.innerHTML = "Message: " + data.message;
        }
        else if(response.ok) {
            data = await response.json();
            contentsDiv.innerHTML = "Message: " + data.message;
            
        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        contentsDiv.innerHTML = err;
    }

    contentsDiv.innerHTML += "<br>";
    getContents();

}


// Sends a GET request to /M01008906/contents path of web service and web service replies with a relavant response in JSON format

async function getContents() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/contents`);
        
        let data;
        if(response.ok) {
            data = await response.json();
            if(data.contents) {
                let text = ``;
                data.contents.map((content) => (text += `
                    <div class="card" style="width: 18rem;">
                        <div class="card-body">
                            <h5 class="card-title" id="user-email">Email: ${content.email}</h5>
                            <p class="card-text" id="user-content">Text: ${content.text}</p>
                        </div>
                    </div>
                `));
                if(text.trim().length === 0) {
                    text = "<center><h4>No contents to display.</h4></center>";
                }
                contentsDiv.innerHTML += text;
            } else {
                contentsDiv.innerHTML += "Message: " + data.message;
            }
            
        } else {
            contentsDiv.innerHTML += "<center><h4>No contents to display.</h4></center>";
        }

        console.log(data);

    } catch(err) {
        contentsDiv.innerHTML += err;
    }
}

// Sends a POST request to /M01008906/follow path of web service and web service replies with a relavant response in JSON format

async function follow() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/follow`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailLoginFollow.value })
        });

        let data;
        if(response.status === 400 || response.status === 404 || response.status === 503) {
            try{
                data = await response.json();
                contentsDiv.innerHTML = data.message;
            } catch(err) {
                contentsDiv.innerHTML = "HTTP error: " + response.status;
            }
            
        } else if(response.ok) {
            data = await response.json();
            
            contentsDiv.innerHTML = `
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title" id="user-email">Email: ${data.email}</h5>
                        <p class="card-text" id="user-content">Follows: ${data.follows}</p>
                    </div>
                </div>
            `;
        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }

        
        console.log(data);
        
    } catch(err) {
        contentsDiv.innerHTML = err;
    }
    
    contentsDiv.innerHTML += "<br>";
    getContents();
    
}

// Sends a DELETE request to /M01008906/follow path of web service and web service replies with a relavant response in JSON format

async function unfollow() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/follow`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailLoginFollow.value })
        });

        let data;
        if(response.status === 400 || response.status === 404 || response.status === 503) {
            try{
                data = await response.json();
                contentsDiv.innerHTML = data.currentUserResult.message;
            } catch(err) {
                contentsDiv.innerHTML = "HTTP error: " + response.status;
            }
            
        } else if (response.ok) {
            data = await response.json();

            contentsDiv.innerHTML = `
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title" id="user-email">Email: ${data.currentUserResult.email}</h5>
                        <p class="card-text" id="user-content">Unfollows: ${data.currentUserResult.unfollows}</p>
                    </div>
                </div>
            `;
        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }
        

        console.log(data);
        
    } catch(err) {
        contentsDiv.innerHTML = err;
    }

    contentsDiv.innerHTML += "<br>";
    getContents();
    
}

// Sends a GET request to /M01008906/users/search/?search=<search_text> path of web service and web service replies with a relavant response in JSON format

async function searchUsersFunc() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/users/search/?search=${searchUsers.value}`);
        
        let data;
        if(response.ok || response.status === 404) {
            try{
                data = await response.json();
                if(data.users) {
                    let text = ``;
                    
                    data.users.map((user) => (text += `
                        <div class="card" style="width: 18rem;">
                            <div class="card-body">
                                <h5 class="card-title" id="user-email">Name: ${user.name}</h5>
                                <p class="card-text" id="user-content">Email: ${user.email}</p>
                            </div>
                        </div>
                    `));
                    responseDivSearch.innerHTML = text;
                } else {
                    responseDivSearch.innerHTML = "Message: " + data.message;
                }
            } catch(err) {
                responseDivSearch.innerHTML = "HTTP error: " + response.status;
            }
            
            console.log(data);
        } else {
            responseDivSearch.innerHTML = "HTTP error: " + response.status;
        }


    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
}

// Sends a GET request to /M01008906/contents/search/?search=<search_text> path of web service and web service replies with a relavant response in JSON format

async function searchContentsFunc() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/contents/search/?search=${searchContents.value}`);
        
        let data;
        if(response.ok || response.status === 404) {
            try{
                data = await response.json();

                if(data.posts) {
                    let text = ``;
                    data.posts.map((content) => (text += `
                        <div class="card" style="width: 18rem;">
                            <div class="card-body">
                                <h5 class="card-title" id="user-email">${content.email}</h5>
                                <p class="card-text" id="user-content">${content.text}</p>
                            </div>
                        </div>
                    `));
                    responseDivSearch.innerHTML = text;
                } else {
                    responseDivSearch.innerHTML = "Message: " + data.message;
                }
            } catch(err) {
                responseDivSearch.innerHTML = "HTTP error: " + response.status;
            }

            console.log(data);
            
        } else {
            responseDivSearch.innerHTML = "HTTP error: " + response.status;
        }


    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
}

// Sends a POST request to /M01008906/weather path of web service and web service replies with a relavant response in JSON format

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(showPosition);
        return;
    } else {
        weatherDiv.innerHTML = "Geolocation is not supported by this browser.";
    }
}

async function showPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    try {
        const response = await fetch('http://localhost:8080/M01008906/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lat:latitude,
                lon: longitude
            })
        });
        
        const data = await response.json();
        weatherDiv.innerHTML=`Latitude: ${latitude}<br>
        Longitude: ${longitude}<br>
        Precipitation accumulated over the past 24 hours in millimeter: ${data.value}`;
    } catch(error) {
        weatherDiv.innerHTML = error;
    }
}

// Sends a POST request to /M01008906/search-recipe-spoonacular path of web service and web service replies with a relavant response in JSON format

async function searchRecipesByFoodNameSpoonacular() {
    try {
        const response = await fetch('http://localhost:8080/M01008906/search-recipe-spoonacular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: searchRecipeNameSpoonacular.value })
        });
    
        const data = await response.json();
        console.log(data);

        let text = `
            <div class="container">
                <div class="row">
        
        `;

        data.recipes.map(async (r) => (text += `
            <div class="col-4">
                <div class="card" style="width: 18rem;">
                    <img src=${r.image} class="card-img-top" alt="...">
                    <div class="card-body">
                        <h5 class="card-title">${r.title}</h5>
                        <button class="btn btn-primary" onclick="searchRecipeByIDSpoonacular(${r.id})">View Details</button>
                    </div>
                </div>
            </div>
        `));
        text += `
                </div>
            </div>
        `;
        responseDivSearch.innerHTML = text;
    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
    
}

// Sends a GET request to /M01008906/recipe-spoonacular/:id path of web service and web service replies with a relavant response in JSON format

async function searchRecipeByIDSpoonacular(id) {
    try {
        const response = await fetch(`http://localhost:8080/M01008906/recipe-spoonacular/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        const data = await response.json();
        console.log(data);
        
        let text = ``;

        text = `
            <div class="card" style="width: 18rem;">
                <img src=${data.recipe.image} class="card-img-top" alt="...">
                <div class="card-body">
                    <h5 class="card-title">${data.recipe.title}</h5>
                    <p class="card-text">${data.recipe.summary}</p>
                </div>
            </div>
        `;
        responseDivSearch.innerHTML = text;
    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
}

// Sends a POST request to /M01008906/download path of web service and web service replies with a relavant response in JSON format
// A very important point to note: Fatsecret API requires IP restriction. In your fatsecret account with free plan you need to manage IP restrictions by adding your IP to white listed source IP to pass the IP restriction.

async function  searchRecipesByFoodNameFatsecret() {
            
    try {
        const response = await fetch('http://localhost:8080/M01008906/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: searchRecipeNameFatsecret.value })
        });
    
        const data = await response.json();
        console.log(data);

        let text = `
            <div class="container">
                <div class="row">
        
        `;

        data.recipe.map((r) => (text += `
            <div class="col-4">
                <div class="card" style="width: 18rem;">
                    <img src=${r.recipe_image} class="card-img-top" alt="...">
                    <div class="card-body">
                        <h5 class="card-title">${r.recipe_name}</h5>
                        <p class="card-text">${r.recipe_description}</p>
                    </div>
                </div>
            </div>
        `));
        text += `
                </div>
            </div>
        `;
        responseDivSearch.innerHTML = text;
    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
    
}