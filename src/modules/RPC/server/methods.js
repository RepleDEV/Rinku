// RPC Endpoint methods
module.exports = {
    hello: async function(name) {
        return {
            message: `Welcome ${name}!`
        }
    },
    connect: async function(username, password) {
        if (!username.length || !password.length || typeof username != "string" || typeof password != "string");
            return "Invalid username / password";
        
    }
}