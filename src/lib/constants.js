export const constants = {
  BASE_URL: import.meta.env.VITE_BASE_URL,

  // Auth
  SIGN_UP: "auth/signup",
  LOGIN: "auth/login",

  // User
  GET_PROFILE: "user/profile",
  UPDATE_PROFILE: "user/profile",
  GET_ALL_USERS: "user/profile/all",
  GET_USER_CHATS: "user/chats",

  // Chat
  CREATE_CHAT: "chat/create",
  GET_MESSAGES: "chat/messages",
  DELETE_CHAT: "chat/delete",
  EXIT_CHAT: "chat/exit",
  TOGGLE_BLOCK: "chat/toggleBlock",
  ADD_USER: "chat/add",
  REMOVE_USER: "chat/remove",
  UPDATE_CHAT_IMAGE: "chat/update",

  // Message
  CREATE_MESSAGE: "message/create",
  DELETE_MESSAGE: "message/delete",
};
