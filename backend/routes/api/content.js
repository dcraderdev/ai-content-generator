const express = require('express');
const { body, validationResult } = require('express-validator');
const { GeneratedContent } = require('../../db/models');
const { requireAuth, optionalAuth } = require('../../middleware/auth');

const router = express.Router();

// Validation middleware
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/content
 * List all content (optionally filtered by type)
 */
router.get('/', optionalAuth, async (req, res) => {
  const { type, status, limit = 50, offset = 0 } = req.query;

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;

  // If user is logged in, can filter by their content
  if (req.user && req.query.mine === 'true') {
    where.userId = req.user.id;
  }

  const content = await GeneratedContent.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    items: content.rows,
    total: content.count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

/**
 * GET /api/content/:id
 * Get single content item by ID
 */
router.get('/:id', async (req, res) => {
  const content = await GeneratedContent.findByPk(req.params.id);

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  res.json(content);
});

/**
 * GET /api/content/slug/:slug
 * Get single content item by slug
 */
router.get('/slug/:slug', async (req, res) => {
  const content = await GeneratedContent.findOne({
    where: { slug: req.params.slug }
  });

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  res.json(content);
});

/**
 * POST /api/content
 * Create new content
 */
router.post('/', [
  optionalAuth,
  body('title').notEmpty().withMessage('Title is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('type').optional().isString(),
  body('content').optional().isObject(),
  body('images').optional().isArray(),
  validateErrors
], async (req, res) => {
  const { title, slug, type = 'recipe', content, images = [], metadata = {} } = req.body;

  // Check if slug already exists
  const existing = await GeneratedContent.findOne({ where: { slug } });
  if (existing) {
    return res.status(400).json({ error: 'Slug already exists' });
  }

  const newContent = await GeneratedContent.create({
    userId: req.user?.id || null,
    title,
    slug,
    type,
    content: content || {},
    images,
    metadata,
    status: 'draft'
  });

  res.status(201).json(newContent);
});

/**
 * PUT /api/content/:id
 * Update content
 */
router.put('/:id', [
  optionalAuth,
  validateErrors
], async (req, res) => {
  const content = await GeneratedContent.findByPk(req.params.id);

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // Optional: Check ownership
  // if (content.userId && req.user?.id !== content.userId) {
  //   return res.status(403).json({ error: 'Not authorized' });
  // }

  const updates = {};
  const allowedFields = ['title', 'content', 'images', 'metadata', 'status'];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  await content.update(updates);

  res.json(content);
});

/**
 * DELETE /api/content/:id
 * Delete content
 */
router.delete('/:id', optionalAuth, async (req, res) => {
  const content = await GeneratedContent.findByPk(req.params.id);

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  await content.destroy();

  res.json({ message: 'Content deleted successfully' });
});

/**
 * GET /api/content/titles/existing
 * Get list of existing titles (for duplicate prevention)
 */
router.get('/titles/existing', async (req, res) => {
  const { type, limit = 100 } = req.query;

  const where = {};
  if (type) where.type = type;

  const content = await GeneratedContent.findAll({
    where,
    attributes: ['title'],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  const titles = content.map(c => c.title);

  res.json({ titles });
});

module.exports = router;
