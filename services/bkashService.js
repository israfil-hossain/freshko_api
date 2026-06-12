import axios from 'axios';

// bKash API Configuration
const BKASH_BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;

let bKashToken = null;
let tokenExpiry = null;

// Get bKash Token
const getToken = async () => {
    try {
        // Check if token is still valid
        if (bKashToken && tokenExpiry && new Date() < tokenExpiry) {
            return bKashToken;
        }
        
        const response = await axios.post(
            `${BKASH_BASE_URL}/v1.2.0-beta/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_APP_KEY,
                app_secret: BKASH_APP_SECRET,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'username': BKASH_USERNAME,
                    'password': BKASH_PASSWORD,
                },
            }
        );
        
        if (response.data.statusCode === '0000') {
            bKashToken = response.data.id_token;
            tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
            return bKashToken;
        } else {
            throw new Error(response.data.statusMessage);
        }
    } catch (error) {
        console.error('bKash Token Error:', error.message);
        throw error;
    }
};

// Create Payment
export const createPayment = async (amount, merchantInvoiceNumber, callbackURL) => {
    try {
        const token = await getToken();
        
        const response = await axios.post(
            `${BKASH_BASE_URL}/v1.2.0-beta/tokenized/checkout/create`,
            {
                mode: '0011',
                payerReference: merchantInvoiceNumber,
                callbackURL,
                merchantAssociationInfo: '',
                amount,
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token,
                    'X-APP-Key': BKASH_APP_KEY,
                },
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('bKash Create Payment Error:', error.message);
        throw error;
    }
};

// Execute Payment
export const executePayment = async (paymentID) => {
    try {
        const token = await getToken();
        
        const response = await axios.post(
            `${BKASH_BASE_URL}/v1.2.0-beta/tokenized/checkout/execute`,
            {
                paymentID,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token,
                    'X-APP-Key': BKASH_APP_KEY,
                },
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('bKash Execute Payment Error:', error.message);
        throw error;
    }
};

// Query Payment
export const queryPayment = async (paymentID) => {
    try {
        const token = await getToken();
        
        const response = await axios.post(
            `${BKASH_BASE_URL}/v1.2.0-beta/tokenized/checkout/payment/status`,
            {
                paymentID,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token,
                    'X-APP-Key': BKASH_APP_KEY,
                },
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('bKash Query Payment Error:', error.message);
        throw error;
    }
};

// Refund Payment
export const refundPayment = async (paymentID, amount, trxID, sku) => {
    try {
        const token = await getToken();
        
        const response = await axios.post(
            `${BKASH_BASE_URL}/v1.2.0-beta/tokenized/checkout/payment/refund`,
            {
                paymentID,
                amount,
                trxID,
                sku,
                reason: 'Customer refund',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token,
                    'X-APP-Key': BKASH_APP_KEY,
                },
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('bKash Refund Error:', error.message);
        throw error;
    }
};

// Check if bKash is enabled
export const isBkashEnabled = () => {
    return process.env.BKASH_ENABLED === 'true' && BKASH_APP_KEY && BKASH_APP_SECRET;
};

export default {
    createPayment,
    executePayment,
    queryPayment,
    refundPayment,
    isBkashEnabled,
};
