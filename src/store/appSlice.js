import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    activeChatId: null,
    showCreateChatModal: false,
    isImageUpload: false,
    isGetChats: true,
    sokcet: null,
  },
  reducers: {
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setShowCreateChatModal: (state, action) => {
      state.showCreateChatModal = action.payload;
    },
    setIsImageUpload: (state, action) => {
      state.isImageUpload = action.payload;
    },
    setIsGetChats: (state, action) => {
      state.isGetChats = action.payload;
    },
    setSocket: (state, action) => {
      state.sokcet = action.payload;
    },
  },
});

export const {
  setActiveChatId,
  setShowCreateChatModal,
  setIsGetChats,
  setIsImageUpload,
  setSocket,
} = appSlice.actions;
export default appSlice.reducer;
