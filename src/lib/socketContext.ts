import { createContext } from "react";
import { Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
};

const socketContext = createContext<SocketContextType>({
  socket: null,
});

export default socketContext;
