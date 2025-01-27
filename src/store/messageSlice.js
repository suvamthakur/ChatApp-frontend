import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    reply: null,
  },
  reducers: {
    setReply: (state, action) => {
      state.reply = action.payload;
    },
    deleteReply: (state) => {
      state.reply = null;
    },
  },
});

export const { setReply, deleteReply } = messageSlice.actions;
export default messageSlice.reducer;
