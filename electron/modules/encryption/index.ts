import * as crypto from "crypto";

/**
 * Public and private key pairs.
 */
interface KeyPair {
    /**
     * Public key.
     */
    public: string;
    /**
     * Private key
     */
    private: string;
}

/**
 * Generates RSA public and private keys.
 * @param passphrase Passphrase for private key.
 */
function generateKeys(passphrase: string): Promise<KeyPair> {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair(
            "rsa",
            {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: "pkcs1",
                    format: "pem",
                },
                privateKeyEncoding: {
                    type: "pkcs1",
                    format: "pem",
                    cipher: "aes-256-cbc",
                    passphrase: passphrase,
                },
            },
            (err, publicKey, privateKey) => {
                if (err) return reject(err);

                resolve({
                    public: publicKey,
                    private: privateKey,
                });
            }
        );
    });
}

/**
 * Encrypt a string of text using a public key.
 * @param str String to encrypt.
 * @param publicKey Public Key.
 * 
 * @returns Encrypted text in base64 format.
 */
function encrypt(str: string, publicKey: string) {
    const buf = Buffer.from(str, "utf-8");

    const encrypted = crypto.publicEncrypt(publicKey, buf);
    return encrypted.toString("base64");
}

/**
 * Decrypt an encrypted, base64 formatted string using a private key.
 * @param str Base64 string to decrypt.
 * @param privateKey Private Key.
 * @param passphrase Passphrase for the private key.
 */
function decrypt(str: string, privateKey: string, passphrase: string): string {
    const buf = Buffer.from(str, "base64");

    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            passphrase: passphrase
        },
        buf
    );

    return decrypted.toString("utf-8");
}

export { encrypt, decrypt, generateKeys };