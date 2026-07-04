import "dotenv/config";
import { env } from "./config/env.js";
import app from "./app.js";

// Start BullMQ workers in the same process for development
import "./workers/index.js";

app.listen(env.PORT, () => {
  console.log(`codecook running on http://localhost:${env.PORT}`);
});
