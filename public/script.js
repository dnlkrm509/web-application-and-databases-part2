const SERVER_HOST_URL = 'http://localhost:8080';

const registerForm = document.getElementById('register');
const loginForm = document.getElementById('login');

const personalDetails = document.getElementById('personal-details');

const fileInput = document.getElementById('file-input');
const responseUpload = document.getElementById('response-upload');

const avatar = document.getElementById('avatar');

const searchUsers = document.getElementById('search-users');
const searchContents = document.getElementById('search-contents');

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

window.onload = async () => {
    avatar.src = "Images/avatar.png";
    loginForm.style.display = "none";
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

function registerDisplay() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
}

function loginDisplay() {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
}

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

        getContents();

        console.log(data);
        
    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
    
}

async function checkStatus() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/login`);
        
        let data;
        if(response.ok) {
            data = await response.json();
            if(data.email) {
                responseDivLogin.innerHTML = "Loggedin: " + data.loggedIn + ", email: " + data.email;
            } else {
                responseDivLogin.innerHTML = "Loggedin Status: " + data.loggedIn;
            }
            
        } else {
            responseDivLogin.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
    
}

async function logout() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/login`, {
            method: 'DELETE'
        });

        let data;
        if(response.ok) {
            data = await response.json();
            if(!data.error) {
                responseDivLogin.innerHTML = "Loggedin: " + data.login;
            } else {
                responseDivLogin.innerHTML = "Error: " + data.error;
            }

            contentsDiv.innerHTML = "";
            
        } else {
            responseDivLogin.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
}

async function getContents() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/contents`);
        
        let data;
        if(response.ok) {
            data = await response.json();
            if(data.contents) {
                let text = ``;
                data.contents.map((content) => (text += `Contents: {<br>
                    Email: ${content.email}<br>
                    Text: ${content.text}<br>
                },<br>`));
                contentsDiv.innerHTML = text;
            } else {
                contentsDiv.innerHTML = "Message: " + data.message;
            }
            
        } else {
            contentsDiv.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        contentsDiv.innerHTML = err;
    }
}

async function follow() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/follow`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailLoginFollow.value })
        });

        let data;
        if(response.status === 400 || response.status === 404 || response.status === 503) {
            data = await response.json();
            responseDivLogin.innerHTML = data.message;
        } else if (response.ok) {
            data = await response.json();
            responseDivLogin.innerHTML = "Email: " + data.email + ", follows: " + data.follows + ", message: " + data.message;
        } else {
            responseDivLogin.innerHTML = "HTTP error: " + response.status;
        }
        
        console.log(data);
        
    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
    
}

async function unfollow() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/follow`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailLoginFollow.value })
        });

        let data;
        if(response.status === 400 || response.status === 404 || response.status === 503) {
            data = await response.json();
            responseDivLogin.innerHTML = data.message;
        } else if (response.ok) {
            data = await response.json();
            responseDivLogin.innerHTML = `Current user: {<br>
                unfollows: ${data.currentUserResult.unfollows},<br>
                message: ${data.currentUserResult.message}<br>
            }<br>
            Other user: {<br>
                unfollows: ${data.otherUserResult.unfollows},<br>
                message: ${data.otherUserResult.message}<br>
            }`;
        } else {
            responseDivLogin.innerHTML = "HTTP error: " + response.status;
        }
        
        console.log(data);
        
    } catch(err) {
        responseDivLogin.innerHTML = err;
    }
    
}

async function searchUsersFunc() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/users/search/?search=${searchUsers.value}`);
        
        let data;
        if(response.ok || response.status === 404) {
            data = await response.json();
            if(data.users) {
                let text = ``;
                data.users.map((user) => (text += `Users: {<br>
                    Name: ${user.name}<br>
                    Email: ${user.email}<br>
                },<br>`));
                responseDivSearch.innerHTML = text + "message: " + data.message;
            } else {
                responseDivSearch.innerHTML = "Message: " + data.message;
            }
            
        } else {
            responseDivSearch.innerHTML = "HTTP error: " + response.status;
        }

        console.log(data);

    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
}

async function searchContentsFunc() {
    try {
        const response = await fetch(`${SERVER_HOST_URL}/M01008906/contents/search/?search=${searchContents.value}`);
        
        let data;
        if(response.ok || response.status === 404) {
            data = await response.json();

            if(data.posts) {
                let text = ``;
                data.posts.map((content) => (text += `Contents: {<br>
                    Email: ${content.email}<br>
                    Text: ${content.text}<br>
                },<br>`));
                responseDivSearch.innerHTML = text + "message: " + data.message;
            } else {
                responseDivSearch.innerHTML = "Message: " + data.message;
            }

            console.log(data);
            
        } else {
            responseDivSearch.innerHTML = "HTTP error: " + response.status;
        }


    } catch(err) {
        responseDivSearch.innerHTML = err;
    }
}
