var loginPassword;

function authenticate(password) {
    return password == loginPassword;
}

function setPassword(password) {
    if (typeof password != "string" || !password.length)
        return new Error("Password parameter not provided.");
    
    loginPassword = password;
    return "Succesfully set the password.";
}

exports.setPassword = setPassword;
exports.authenticate = authenticate;