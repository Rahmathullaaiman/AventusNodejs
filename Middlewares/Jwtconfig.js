const jwt = require('jsonwebtoken');

const jwtmiddleware = (req, res, next) => {
    console.log('Inside JWT middleware');

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token missing' });
    }

    console.log('Token:', token);

    try {
        const jwtresponse = jwt.verify(token, 'secretkey'); 
        req.user = { _id: jwtresponse.userId }; 
        next();
    } catch (err) {
        console.error('jwt verification error:', err);
        res.status(401).json({ error: 'Authorization failed, please login' });
    }
};

module.exports = jwtmiddleware;
