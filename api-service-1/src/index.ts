import "dotenv/config";
import express from "express";
import Redis, { RedisOptions } from "ioredis";
import cors from "cors";

const PORT = process.env.PORT || 3001;
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
};

if (!process.env.REDIS_HOST) {
  throw new Error("Missing REDIS_HOST in .env");
}

const redisPub = new Redis(redisConfig);

redisPub.on("error", (err) => {
  console.error("Redis error:", err);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const METRIC_CHANNEL = "metrics:dashboard";

const EVENTS_CHANNEL = "events:{appId}";
function generateFakeMetric() {
  return {
    timestamp: Date.now(),
    cpuUsage: Math.random().toFixed(2),
    activeUsers: Math.floor(Math.random() * 500),
  };
}

async function publishMetric(metric: any) {
  const msg = JSON.stringify(metric);
  await redisPub.publish(METRIC_CHANNEL, msg);
  console.log(`Published to ${METRIC_CHANNEL}:`, msg);
}

// can be published on a DB trigger or a cron job
setInterval(() => {
  const metric = generateFakeMetric();
  publishMetric(metric);
}, 10000);

app.get("/metrics", async (req, res) => {
  const metrics = generateFakeMetric();
  res.json({ success: true, data: metrics });
});

const handleEvents = async (appId: string, status: string, event: string) => {
  await new Promise((resolve) => setTimeout(resolve, 6000));
  await redisPub.publish(
    EVENTS_CHANNEL.replace("{appId}", appId),
    JSON.stringify({ status, event, timestamp: Date.now() })
  );
};
app.post("/events/:appId", async (req, res) => {
  const { status, event } = req.body;
  console.log(req.body);
  const { appId } = req.params;

  handleEvents(appId, status, event);
  res.status(200).send({ status: "success" });
});
app.listen(PORT, () => {
  console.log(`Publisher running at http://localhost:${PORT}`);
});
