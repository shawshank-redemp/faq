const { getES } = require('../config/elasticsearch');

const INDEX_QUESTIONS = 'questions';
const INDEX_FAQS = 'faqs';
const INDEX_USERS = 'users';

const ensureIndex = async (index, body) => {
  const es = getES();
  const exists = await es.indices.exists({ index });
  if (!exists) {
    await es.indices.create({ index, body });
  }
};

const initIndices = async () => {
  await ensureIndex(INDEX_QUESTIONS, {
    settings: { analysis: { analyzer: { default: { type: 'standard' } } } },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'standard' },
        body: { type: 'text', analyzer: 'standard' },
        tags: { type: 'keyword' },
        author: { type: 'keyword' },
        authorName: { type: 'text' },
        upvotes: { type: 'integer' },
        answerCount: { type: 'integer' },
        viewCount: { type: 'integer' },
        createdAt: { type: 'date' },
        status: { type: 'keyword' },
      },
    },
  });

  await ensureIndex(INDEX_FAQS, {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'standard' },
        description: { type: 'text' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        isOfficial: { type: 'boolean' },
        createdAt: { type: 'date' },
      },
    },
  });

  await ensureIndex(INDEX_USERS, {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        username: { type: 'text', analyzer: 'standard' },
        displayName: { type: 'text' },
        bio: { type: 'text' },
        reputation: { type: 'integer' },
        role: { type: 'keyword' },
      },
    },
  });
};

const indexQuestion = async (question) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_QUESTIONS,
      id: question._id.toString(),
      body: {
        id: question._id,
        title: question.title,
        body: question.body,
        tags: question.tagNames,
        author: question.author?._id || question.author,
        authorName: question.author?.displayName || question.author?.username || '',
        upvotes: question.upvotes,
        answerCount: question.answerCount,
        viewCount: question.viewCount,
        createdAt: question.createdAt,
        status: question.status,
      },
    });
  } catch (err) {
    console.error('Index question error:', err.message);
  }
};

const indexFAQ = async (faq) => {
  try {
    const es = getES();
    await es.index({
      index: INDEX_FAQS,
      id: faq._id.toString(),
      body: {
        id: faq._id,
        title: faq.title,
        description: faq.description,
        category: faq.category,
        tags: faq.tags,
        isOfficial: faq.isOfficial,
        createdAt: faq.createdAt,
      },
    });
  } catch (err) {
    console.error('Index FAQ error:', err.message);
  }
};

const searchAll = async ({ query, tags, type, page = 1, limit = 20 }) => {
  try {
    const es = getES();
    const must = [];
    const filter = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'body^2', 'description', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (tags && tags.length > 0) {
      filter.push({ terms: { tags } });
    }

    const indices = type === 'faqs' ? INDEX_FAQS
      : type === 'users' ? INDEX_USERS
      : INDEX_QUESTIONS;

    const body = {
      from: (page - 1) * limit,
      size: limit,
      sort: [{ _score: 'desc' }, { createdAt: { order: 'desc' } }],
    };

    if (must.length > 0 || filter.length > 0) {
      body.query = { bool: {} };
      if (must.length > 0) body.query.bool.must = must;
      if (filter.length > 0) body.query.bool.filter = filter;
    } else {
      body.query = { match_all: {} };
    }

    const result = await es.search({ index: indices, body });
    return {
      results: result.hits.hits.map(h => ({ id: h._id, ...h._source, score: h._score })),
      total: result.hits.total.value,
      page,
      limit,
    };
  } catch (err) {
    console.error('Search error:', err.message);
    return { results: [], total: 0, page, limit };
  }
};

/**
 * "Did you mean?" suggestions for zero-result searches.
 *
 * Strategy:
 *   1. ES phrase suggester on the questions index — catches typos like
 *      "stipned" → "stipend" using the actual indexed corpus.
 *   2. Fuzzy FAQ title match from MongoDB — surfaces real FAQ pages
 *      even when ES has no indexed data yet (e.g. fresh install).
 *
 * Returns:
 *   {
 *     correction: "stipend" | null,   // best spelling fix
 *     relatedFAQs: [{ title, slug }]  // up to 4 relevant FAQ pages
 *   }
 */
const getDidYouMean = async (query) => {
  const result = { correction: null, relatedFAQs: [] };
  if (!query || query.trim().length < 2) return result;

  // 1. ES phrase suggester
  try {
    const es = getES();
    const suggestRes = await es.search({
      index: INDEX_QUESTIONS,
      body: {
        size: 0,
        suggest: {
          text: query,
          phrase_suggest: {
            phrase: {
              field: 'title',
              size: 1,
              gram_size: 2,
              direct_generator: [{
                field: 'title',
                suggest_mode: 'missing',
                min_word_length: 3,
              }],
            },
          },
        },
      },
    });

    const options = suggestRes.suggest?.phrase_suggest?.[0]?.options || [];
    if (options.length > 0 && options[0].score > 0.001) {
      const suggested = options[0].text.trim().toLowerCase();
      if (suggested !== query.trim().toLowerCase()) {
        result.correction = options[0].text;
      }
    }
  } catch (_) {
    // ES unavailable — skip phrase suggest, still do MongoDB fallback
  }

  // 2. MongoDB fuzzy FAQ fallback — regex on each word in the query
  try {
    const FAQ = require('../models/FAQ');
    const words = query.trim().split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      const regexClauses = words.map(w => ({
        title: { $regex: w, $options: 'i' },
      }));
      const faqs = await FAQ.find({
        isPublished: true,
        $or: regexClauses,
      })
        .select('title slug')
        .limit(4)
        .lean();
      result.relatedFAQs = faqs.map(f => ({ title: f.title, slug: f.slug }));
    }
  } catch (_) {}

  return result;
};

const deleteQuestionIndex = async (id) => {
  try {
    const es = getES();
    await es.delete({ index: INDEX_QUESTIONS, id: id.toString() });
  } catch (_) {}
};

const deleteFAQIndex = async (id) => {
  try {
    const es = getES();
    await es.delete({ index: INDEX_FAQS, id: id.toString() });
  } catch (_) {}
};

module.exports = {
  initIndices,
  indexQuestion,
  indexFAQ,
  searchAll,
  getDidYouMean,
  deleteQuestionIndex,
  deleteFAQIndex,
};
