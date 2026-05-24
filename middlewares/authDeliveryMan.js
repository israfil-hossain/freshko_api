import jwt from 'jsonwebtoken';

const authDeliveryMan = async (req, res, next) => {
    const {deliveryManToken} = req.cookies;
    if(!deliveryManToken)
        return res.json({success: false, message: "Not Authorized"});
    try {
        const tokenDecode = jwt.verify(deliveryManToken, process.env.JWT_SECRET);
        if(tokenDecode.id){
            req.deliveryManId = tokenDecode.id;
        }else{
            return res.json({success: false, message: "Not Authorized"});
        }
        next();
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export default authDeliveryMan;
