import { Chat, ChatMessage } from "@/types/store";
import { createSlice } from "@reduxjs/toolkit";

type ChatState = {
  allChats: Chat[];
  chatMessages: {
    [chatId: string]: ChatMessage[];
  };
};

const chatSlice = createSlice({
  name: "chats",
  initialState: {
    allChats: [],
    chatMessages: {}, // Messages
  } as ChatState,
  reducers: {
    addChats: (state, action) => {
      state.allChats = action.payload;
    },
    addSingleChat: (state, action) => {
      state.allChats.push(action.payload);
    },
    addNewUsersIntoChat: (state, action) => {
      const { newUsers, chatId } = action.payload;

      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatId) {
          return {
            ...chat,
            users: [...chat.users, ...newUsers],
          };
        }
        return chat;
      });
    },

    addChatMessages: (state, action) => {
      state.chatMessages = { ...state.chatMessages, ...action.payload };
    },

    removeUserFromChat: (state, action) => {
      const { chatId, removedUserId } = action.payload;

      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatId) {
          return {
            ...chat,
            users: chat.users.filter((user) => user._id != removedUserId),
          };
        }
        return chat;
      });
    },
    exitChat: (state, action) => {
      const chatId = action.payload;
      state.allChats = state.allChats.filter((chat) => chat._id != chatId);
    },
    blockUser: (state, action) => {
      const { blockedBy, chatId } = action.payload;

      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatId) {
          return { ...chat, blockedBy };
        }
        return chat;
      });
    },
    unblockUser: (state, action) => {
      const chatId = action.payload;

      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatId) {
          return { ...chat, blockedBy: null };
        }
        return chat;
      });
    },
    // User image update
    updateUserInChat: (state, action) => {
      const userData = action.payload;

      state.allChats = state.allChats.map((chat) => {
        return {
          ...chat,
          users: chat.users.map((user) => {
            if (user._id == userData._id) {
              return { ...userData };
            }
            return user;
          }),
        };
      });
    },
    // Chat image update
    updateChatImage: (state, action) => {
      const chatData = action.payload;

      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatData._id) {
          return {
            ...chat,
            groupImage: chatData.groupImage,
          };
        }
        return chat;
      });
    },

    // New Message
    addMessage: (state, action) => {
      const {
        _id,
        chatId: { _id: chatId },
        senderName,
        content,
      } = action.payload;

      // Add new message
      state.chatMessages = {
        ...state.chatMessages,
        [chatId]: [...(state.chatMessages[chatId] || []), action.payload],
      };

      // Update last message
      state.allChats = state.allChats.map((chat) => {
        if (chat._id == chatId) {
          return {
            ...chat,
            lastMessage: {
              _id: _id,
              senderName,
              content,
            },
          };
        }
        return chat;
      });
    },

    deleteMessage: (state, action) => {
      const { messageId, chatId } = action.payload;

      // Delete chat message
      state.chatMessages = {
        ...state.chatMessages,
        [chatId]: state.chatMessages[chatId].filter(
          (message) => message._id != messageId
        ),
      };

      // Update last message

      // Find second last message of the chat
      const secondLastMessage = state.chatMessages[chatId].at(-1);

      if (secondLastMessage) {
        const { _id, name, content } = secondLastMessage;

        state.allChats = state.allChats.map((chat) => {
          if (chat._id == chatId) {
            if (chat.lastMessage!._id == messageId) {
              return {
                ...chat,
                lastMessage: {
                  _id,
                  senderName: name,
                  content,
                },
              };
            }
          }
          return chat;
        });
      }
    },
  },
});

export const {
  addChats,
  addSingleChat,
  addNewUsersIntoChat,
  addChatMessages,
  removeUserFromChat,
  exitChat,
  blockUser,
  unblockUser,
  updateUserInChat,
  updateChatImage,
  addMessage,
  deleteMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
