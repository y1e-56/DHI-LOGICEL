const Project = require('../models/Project');
const ActionLog = require('../models/ActionLog');

// Créer un nouveau projet
const createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    // Validation des données
    if (!name || !start_date) {
      return res.status(400).json({ message: 'Le nom et la date de début sont obligatoires' });
    }

    // Créer le projet
    const project = await Project.create({
      name,
      description,
      start_date,
      end_date,
      created_by: req.user.id
    });

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'project_created',
      entity_type: 'project',
      entity_id: project.id,
      description: `Création du projet ${name}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Projet créé avec succès',
      project
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la création du projet' });
  }
};

// Obtenir un projet par ID
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du projet' });
  }
};

// Mettre à jour un projet
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, is_archived } = req.body;

    const project = await Project.update(id, {
      name,
      description,
      start_date,
      end_date,
      is_archived
    });

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'project_updated',
      entity_type: 'project',
      entity_id: project.id,
      description: `Mise à jour du projet ${name}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Projet mis à jour avec succès',
      project
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du projet' });
  }
};

// Archiver un projet
const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.archive(id);

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'project_archived',
      entity_type: 'project',
      entity_id: project.id,
      description: `Archivage du projet ${project.name}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Projet archivé avec succès',
      project
    });
  } catch (error) {
    console.error('Erreur lors de l\'archivage du projet:', error);
    res.status(500).json({ message: 'Erreur lors de l\'archivage du projet' });
  }
};

// Lister tous les projets
const getProjects = async (req, res) => {
  try {
    const { is_archived } = req.query;
    const filters = {};

    if (is_archived !== undefined) {
      filters.is_archived = is_archived === 'true';
    }

    const projects = await Project.findAll(filters);
    res.json(projects);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des projets' });
  }
};

// Supprimer un projet
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.delete(id);

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'project_deleted',
      entity_type: 'project',
      entity_id: parseInt(id),
      description: `Suppression du projet ID ${id}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du projet' });
  }
};

module.exports = {
  createProject,
  getProject,
  updateProject,
  archiveProject,
  getProjects,
  deleteProject
};
