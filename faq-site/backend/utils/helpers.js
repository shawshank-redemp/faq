const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, { lower: true, strict: true, trim: true });
};

const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { skip: (p - 1) * l, limit: l, page: p };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { generateSlug, paginate, buildPaginationMeta };
