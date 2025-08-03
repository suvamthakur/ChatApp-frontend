import { ActionableMessage } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

const actionableMessagesSlice = createSlice({
  name: "actionableMessages",
  initialState: [] as ActionableMessage[],
  reducers: {
    addActionableMessage: (state, action) => {
      state.push(action.payload);
    },
    addActionableMessages: (state, action) => {
      return action.payload;
    },
    deleteActionableMessage: (state, action) => {
      state = state.filter((message) => message._id !== action.payload);
    },
  },
});

export const {
  addActionableMessage,
  addActionableMessages,
  deleteActionableMessage,
} = actionableMessagesSlice.actions;
export default actionableMessagesSlice.reducer;
