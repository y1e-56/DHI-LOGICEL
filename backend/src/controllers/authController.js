const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const ActionLog = require('../models/ActionLog');

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

    // Validation des données
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Valider le rôle
    const validRoles = ['admin', 'test_lead', 'tester', 'developer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role
    });

    // Générer le token
    const token = generateToken(user.id, user.role);

    // Logger l'action
    await ActionLog.create({
      user_id: user.id,
      action_type: 'user_created',
      entity_type: 'user',
      entity_id: user.id,
      description: `Création du compte utilisateur ${email}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
};

// Connexion d'un utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Vérifier si le compte est verrouillé
    const isLocked = await User.isAccountLocked(email);
    if (isLocked) {
      return res.status(423).json({ message: 'Compte temporairement verrouillé. Veuillez réessayer plus tard.' });
    }

    // Trouver l'utilisateur
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(401).json({ message: 'Ce compte a été désactivé' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      const attempts = await User.incrementFailedAttempts(email);
      
      // Verrouiller le compte après 5 tentatives
      if (attempts.failed_login_attempts >= 5) {
        await User.lockAccount(email);
        return res.status(423).json({ message: 'Trop de tentatives échouées. Compte verrouillé temporairement.' });
      }

      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Réinitialiser les tentatives échouées
    await User.resetFailedAttempts(email);

    // Générer le token
    const token = generateToken(user.id, user.role);

    // Logger la connexion
    await ActionLog.create({
      user_id: user.id,
      action_type: 'user_login',
      entity_type: 'user',
      entity_id: user.id,
      description: `Connexion de l'utilisateur ${email}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// Obtenir le profil de l'utilisateur connecté
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

// Lister tous les utilisateurs (admin)
const listUsers = async (req, res) => {
  try {
    const { role, is_active } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    const users = await User.findAll(filters);
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Bloquer un utilisateur (admin)
const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    await User.deactivate(id);
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'user_blocked',
      entity_type: 'user',
      entity_id: parseInt(id),
      description: `Blocage du compte ${user.email}`,
      ip_address: req.ip
    });
    res.json({ message: 'Utilisateur bloqué avec succès' });
  } catch (error) {
    console.error('Erreur lors du blocage:', error);
    res.status(500).json({ message: 'Erreur lors du blocage de l\'utilisateur' });
  }
};

// Débloquer un utilisateur (admin)
const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    // Réactiver + réinitialiser les tentatives échouées
    await User.update(id, {
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: true
    });
    await User.resetFailedAttempts(user.email);
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'user_unblocked',
      entity_type: 'user',
      entity_id: parseInt(id),
      description: `Déblocage du compte ${user.email}`,
      ip_address: req.ip
    });
    res.json({ message: 'Utilisateur débloqué avec succès' });
  } catch (error) {
    console.error('Erreur lors du déblocage:', error);
    res.status(500).json({ message: 'Erreur lors du déblocage de l\'utilisateur' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  listUsers,
  blockUser,
  unblockUser
};
