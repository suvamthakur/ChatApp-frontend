import { User } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: null as User | null,
  reducers: {
    addUser: (state, action) => {
      return action.payload;
    },
    removeUser: () => {
      return null;
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
