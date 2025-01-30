import { Kafka } from "kafkajs";
import { client } from "../clickhouse/client";
import { v4 } from "uuid";
import fs from "fs";
import path from "path";

const kafka = new Kafka({
  brokers: process.env.KAFKA_BROKERS!.split(","),
  clientId: `api-server`,
  ssl: {
    ca: [fs.readFileSync(path.join(__dirname, "kafka.pem"), "utf-8")],
  },
  sasl: {
    username: process.env.KAFKA_USER!,
    password: process.env.KAFKA_PASS!,
    mechanism: "plain",
  },
});

const consumer = kafka.consumer({ groupId: "api-server-logs-consumer" });

export async function initkafkaConsumer() {
  const response = await client.query({
    query: "SELECT 1",
    format: "JSONEachRow",
  });
  console.log("hi");
  await consumer.connect();
  console.log("hi");
  await consumer.subscribe({ topics: ["container-logs"], fromBeginning: true });
  console.log("hi-2");
  await consumer.run({
    eachBatch: async function ({
      batch,
      heartbeat,
      commitOffsetsIfNecessary,
      resolveOffset,
    }) {
      const messages = batch.messages;
      console.log(`Recv. ${messages.length} messages..`);
      for (const message of messages) {
        if (!message.value) continue;
        const stringMessage = message.value.toString();
        const { PROJECT_ID, DEPLOYMENT_ID, log } = JSON.parse(stringMessage);
        console.log({ log, DEPLOYMENT_ID });
        try {
          const { query_id } = await client.insert({
            table: "log_events",
            values: [{ event_id: v4(), deployment_id: DEPLOYMENT_ID, log }],
            format: "JSONEachRow",
          });
          console.log(query_id);
          resolveOffset(message.offset);
          //@ts-ignore
          await commitOffsetsIfNecessary(message.offset);
          await heartbeat();
        } catch (err) {
          console.log(err);
        }
      }
    },
  });
}
