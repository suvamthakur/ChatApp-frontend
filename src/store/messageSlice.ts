import { Attachment } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

type Reply = {
  messageId: string;
  senderId: string;
  name: string;
  content: string;
  attachment: Attachment | null;
} | null;

const messageSlice = createSlice({
  name: "message",
  initialState: {
    reply: null as Reply,
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
