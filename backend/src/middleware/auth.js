const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification manquant' });
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '
    
    // Vérifier le token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Compte désactivé' });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur lors de l\'authentification' });
  }
};

// Middleware pour vérifier les rôles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
