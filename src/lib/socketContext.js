import { createContext } from "react";

const socketContext = createContext({
  socket: null,
});

export default socketContext;
