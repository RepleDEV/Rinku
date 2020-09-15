const login_controller = require('./controllers/login_controller');

var currentUsers = 0;

// RPC Endpoint methods
exports.methods = {
    // Debugging
    hello: async function(name) {
        return {
            message: `Welcome ${name}!`
        }
    },
    connect: async function(password) {
        if (typeof password == "object" || typeof password == "boolean" || typeof password == "function")
            return "Invalid password type";
        
        currentUsers += 1;

        if (login_controller.authenticate(password))
            return `rinkuclient_${currentUsers}`;
        else 
            return "Invalid Password";
    },
    updateCurrentUsers: async function(n) {
        if (typeof n != "number")
            return new Error("Must provide amount of users to update.");
        
        currentUsers += n;

        return "Updated current users. Current Users: " + n;
    },
    getCurrentUsers: async function() {
        return currentUsers;
    },
    ping: async function() {
        return "Pong!";
    }
}

exports.auth = {
    setPassword: login_controller.setPassword
}