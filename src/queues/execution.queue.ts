import { Queue } from "bullmq";
import { bullConnection } from "../redis/index.js";

export const executionQueue = new Queue("code-execution", {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
