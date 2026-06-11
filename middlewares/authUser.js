import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    let token = null;

    // Check cookie first
    if (req.cookies?.userToken) {
        token = req.cookies.userToken;
    }

    // Fallback to Authorization header (Bearer token) for mobile
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token)
        return res.json({success: false, message: "Not Authorized"});
    try {
        const secret = process.env.MOBILE_TOKEN_SECRET || process.env.JWT_SECRET;
        const tokenDecode = jwt.verify(token, secret);
        if(tokenDecode.id){
            req.userId = tokenDecode.id;
        }else{
            return res.json({success: false, message: "Not Authorized"});
        }
        next();
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export default authUser;