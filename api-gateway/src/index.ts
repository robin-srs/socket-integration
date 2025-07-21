import express from "express";
import http from "http";
import WebSocket from "ws";
import Redis, { RedisOptions } from "ioredis";
import "dotenv/config";
import { randomUUID } from "crypto";

const PORT = process.env.PORT ?? 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
};

if (!process.env.REDIS_HOST) {
  throw new Error("Missing REDIS_HOST in .env");
}

const redisSubscriber = new Redis(redisConfig); // must be a separate connection for sub

redisSubscriber.on("error", (err) => {
  console.error("Redis error:", err);
});
// Map each WebSocket connection to the set of channels it's interested in
const clientSubscriptions = new Map<WebSocket, Set<string>>();

// On Redis message, forward to all interested clients
redisSubscriber.on("message", (channel, message) => {
  for (const [ws, channels] of clientSubscriptions.entries()) {
    if (ws.readyState === WebSocket.OPEN && channels.has(channel)) {
      ws.send(JSON.stringify({ channel, message }));
    }
  }
});

wss.on("connection", (ws) => {
  console.log("WS client connected");
  clientSubscriptions.set(ws, new Set());

  // auth here

  ws.on("message", async (raw) => {
    try {
      const { action, channel } = JSON.parse(raw.toString());

      if (action === "subscribe" && channel) {
        const channels = clientSubscriptions.get(ws);
        if (channels && !channels.has(channel)) {
          channels.add(channel);
          await redisSubscriber.subscribe(channel);
          console.log(`Subscribed client to channel: ${channel}`);
        }
      }

      if (action === "unsubscribe" && channel) {
        const channels = clientSubscriptions.get(ws);
        if (channels && channels.has(channel)) {
          channels.delete(channel);
          // Unsubscribe only if no other client is subscribed
          const stillUsed = [...clientSubscriptions.values()].some((set) =>
            set.has(channel)
          );
          if (!stillUsed) {
            await redisSubscriber.unsubscribe(channel);
          }
        }
      }
    } catch (err) {
      console.error("Invalid message from client:", err);
    }
  });

  ws.on("close", () => {
    console.log("WS client disconnected");
    const channels = clientSubscriptions.get(ws);
    clientSubscriptions.delete(ws);
    if (!channels) return;
    for (const channel of channels) {
      // Clean up subscriptions if no other client is subscribed
      const stillUsed = [...clientSubscriptions.values()].some((set) =>
        set.has(channel)
      );
      if (!stillUsed) {
        redisSubscriber.unsubscribe(channel);
      }
    }
  });
});

app.get("/stats", (req, res) => {
  const socketToId = new WeakMap<WebSocket, string>();
  let nextId = 1;

  function getSocketId(socket: WebSocket): string {
    if (!socketToId.has(socket)) {
      socketToId.set(socket, `socket-${nextId++}`);
    }
    return socketToId.get(socket)!;
  }

  function serializeClientSubscriptions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [socket, channels] of clientSubscriptions.entries()) {
      const id = getSocketId(socket);
      console.log(id, channels);
      result[id] = Array.from(channels);
    }

    return result;
  }
  res.json({ sockets: serializeClientSubscriptions() });
});

app.get("/", (req, res) => {
  res.send("Welcome to the gateway");
});

server.listen(PORT, () => {
  console.log(`API gateway running on http://localhost:${PORT}`);
});
