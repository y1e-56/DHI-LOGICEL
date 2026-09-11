import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve('uploads/evidence');

export async function listEvidencePaginated(filters = {}) {
  return db.evidence.findByEntityPaginated(filters);
}

export async function listByEntity(entityType, entityId) {
  return db.evidence.findByEntity(entityType, entityId);
}

export async function getEvidence(id) {
  const ev = await db.evidence.findById(id);
  if (!ev) throw new AppError('Preuve non trouvée', 404);
  return ev;
}

export async function createEvidence(data, file = null) {
  if (!data.entity_type) throw new AppError('entity_type requis', 400);
  if (!data.entity_id) throw new AppError('entity_id requis', 400);

  const fileData = file ? {
    file_path: file.path,
    file_name: file.originalname,
    file_type: file.mimetype,
    file_size: String(file.size),
  } : {
    file_path: data.file_path,
    file_name: data.file_name,
    file_type: data.file_type || null,
    file_size: data.file_size || null,
  };

  return db.evidence.create({
    ...data,
    ...fileData,
  });
}

export async function deleteEvidence(id) {
  const ev = await db.evidence.findById(id);
  if (!ev) throw new AppError('Preuve non trouvée', 404);

  if (ev.file_path && fs.existsSync(ev.file_path)) {
    fs.unlinkSync(ev.file_path);
  }

  return db.evidence.remove(id);
}
