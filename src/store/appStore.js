import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import chatSlice from "./chatSlice";
import appSlice from "./appSlice";
import messageSlice from "./messageSlice";

const appStore = configureStore({
  reducer: {
    app: appSlice,
    user: userSlice,
    chats: chatSlice,
    message: messageSlice,
  },
});

export default appStore;
