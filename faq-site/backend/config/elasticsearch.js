const { Client } = require('elasticsearch');
const config = require('./index');

let esClient = null;

const getES = () => {
  if (!esClient) {
    esClient = new Client({
      host: config.elasticsearch.node,
      log: 'error',
    });
    esClient.ping({ requestTimeout: 3000 })
      .then(() => console.log('Elasticsearch connected'))
      .catch(err => console.error('Elasticsearch not available:', err.message));
  }
  return esClient;
};

module.exports = { getES };
