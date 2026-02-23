const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key';

/**
 * Authentication Middleware
 * Now using async/await for better error handling and scalability.
 */
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  const token = auth.slice(7);

  try {
    // jwt.verify can be wrapped in a promise if you want to be strictly async,
    // but in a standard async function, this works perfectly.
    const payload = await jwt.verify(token, JWT_SECRET);
    
    // Attach the decoded user data to the request object
    req.user = payload;
    
    next();
  } catch (e) {
    return res.status(401).json({ error: '无效token' });
  }
}

module.exports = authMiddleware;
