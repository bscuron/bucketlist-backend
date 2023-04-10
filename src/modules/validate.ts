import { db } from './database';
import { GeneratedSecret } from 'speakeasy';
import qrcode from 'qrcode';

/**
 * Validates user input data submitted into signup form
 *
 * @param {string} username Username to validate
 * @param {string} email Email to validate
 * @param {string} password Password to validate
 * @returns {Promise<boolean>} Determines whether or not user data is valid
 */
const validate = async (
    username: string,
    email: string,
    password: string
): Promise<boolean> => {
    return (
        (await validateUsername(username)) &&
        (await validateEmail(email)) &&
        (await validatePassword(password))
    );
};

const validateUsername = async (username: string): Promise<boolean> => {
    if (username == undefined || username.length < 6) {
        return false;
    }
    return !(await db('users')
        .select('user_id')
        .where({
            username: username
        })
        .first());
};

const validateEmail = async (email: string): Promise<boolean> => {
    const regex: RegExp =
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (email === undefined || !regex.test(email)) {
        return false;
    }

    return !(await db('users')
        .select('user_id')
        .where({
            email: email
        })
        .first());
};

const validatePassword = async (password: string): Promise<boolean> => {
    const regex: RegExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}/;
    if (password === undefined || password.match(regex) == null) {
        return false;
    }
    return true;
};

/**
 * Generates a QR Code URL
 *
 * @param {GeneratedSecret} secret Speakeasy secret generated with username to be stored in database
 * @returns {Promise<string>} Returns the QR Code URL as a promise
 */
const generateQRCode = async (secret: GeneratedSecret): Promise<string> => {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

export { validate, generateQRCode };
