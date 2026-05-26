const { Kafka } = require('kafkajs');
const config = require('./index');

let kafkaClient = null;

const getKafka = () => {
  if (!kafkaClient) {
    kafkaClient = new Kafka({
      clientId: 'quorafaq',
      brokers: config.kafka.brokers,
    });
  }
  return kafkaClient;
};

const createProducer = async () => {
  const kafka = getKafka();
  const producer = kafka.producer();
  await producer.connect();
  return producer;
};

const createConsumer = async (groupId) => {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
};

module.exports = { getKafka, createProducer, createConsumer };
