const jwt = require('jsonwebtoken');

function verifyJWT(req, res, next){
    var token = req.headers['x-access-token'] || req.cookies['authToken'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      // se tudo estiver ok, salva no request para uso posterior
      req.userId = decoded.id;
      req.user = decoded;
      next();
    });
}

module.exports = {verifyJWT}