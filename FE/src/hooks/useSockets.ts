import { useCallback, useEffect, useRef, useState } from "react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_GATEWAY; // change if needed

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any;

export function useSocket<D = Message>({
  onMessage,
}: {
  onMessage?: (data: D) => void;
}) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<D>();

  const connect = useCallback((): Promise<boolean> => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve(true); // already connected
    }

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(SOCKET_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          console.log("[WS] Connected");
          resolve(true);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const message = JSON.parse(data.message);
          onMessage?.(message);
          setMessages(message);
        };

        ws.onerror = (err) => {
          console.error("[WS] Error:", err);
          reject(new Error("WebSocket connection failed"));
        };

        ws.onclose = () => {
          console.warn("[WS] Disconnected");
          setConnected(false);
        };
      } catch (err) {
        console.error("[WS] Unexpected error:", err);
        reject(new Error("Unexpected WebSocket error"));
      }
    });
  }, [onMessage]);

  const subscribe = useCallback(
    (channel: string) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ action: "subscribe", channel })
        );
      } else {
        console.warn("[WS] Tried to subscribe but socket is not open");
      }
    },
    [socketRef]
  );

  const unsubscribe = useCallback(
    (channel: string) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ action: "unsubscribe", channel })
        );
      } else {
        console.warn("[WS] Tried to unsubscribe but socket is not open");
      }
    },
    [socketRef]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setConnected(false);
      console.log("[WS] Manually disconnected");
    }
  }, []);

  const send = useCallback((msg: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("[WS] Tried to send but socket is not open");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    messages,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
}
