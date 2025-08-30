import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

function verifyJWT(req, res, next) {
    const header = req.headers["authorization"];

    if(header != null){
      const token = header.replace("Bearer ", "");
      jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
          req.user = decoded;
      })
    }
    next();
}

export default verifyJWT;
