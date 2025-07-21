/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const SocketContext = createContext<{
  socket: WebSocket | null;
  connected: boolean;
  subscribe: (channel: string) => void;
  unSubscribe: (channel: string) => void;
  onMessage: <T>(cb: (msg: T) => void) => void;
}>({
  connected: false,
  socket: null,
  subscribe: () => {},
  unSubscribe: () => {},
  onMessage: () => {},
});

const SOCKET_URL = import.meta.env.VITE_SOCKET_GATEWAY;
export function SocketProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageHandlerRef = useRef<(msg: any) => void>(() => {});
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);
    socketRef.current = ws;
    ws.onopen = () => {
      console.log("[WS] Connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.warn("[WS] Disconnected");
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        messageHandlerRef.current?.(raw);
      } catch (err) {
        console.warn("[WS] Failed to parse message", {
          data: event.data,
          error: err,
        });
      }
    };

    return () => {
      ws.close();
    };
  }, []);

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

  const unSubscribe = useCallback(
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMessage = useCallback((cb: (msg: any) => void) => {
    messageHandlerRef.current = cb;
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        subscribe,
        unSubscribe,
        onMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
