import ChatContainer from "@/components/ChatContainer";
import ChatPanel from "@/components/ChatPanel";
import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import { addUser } from "@/store/userSlice";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import socketContext from "@/lib/socketContext";
import {
  addMessage,
  addNewUsersIntoChat,
  addSingleChat,
  blockUser,
  deleteMessage,
  exitChat,
  removeUserFromChat,
  unblockUser,
  updateChatImage,
  updateUserInChat,
} from "@/store/chatSlice";
import { setActiveChatId, setIsGetChats } from "@/store/appSlice";

const Chat = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((store) => store.user);
  const activeChatId = useSelector((store) => store.app.activeChatId);
  const { showCreateChatModal, isImageUpload } = useSelector(
    (store) => store.app
  );

  let WIDTH = window.innerWidth;

  useEffect(() => {
    console.log("user: ", user);
    if (user != undefined) {
      if (user) {
        getProfile();
      } else {
        navigate("/login");
      }
    }
  }, [user]);

  const [socket, setSocket] = useState(null);
  // Socket Connection
  useEffect(() => {
    if (user?._id) {
      const socket = io(import.meta.env.VITE_BASE_URL, {
        query: { userId: user?._id },
      });
      setSocket(socket);
    }

    return () => socket?.close();
  }, [user?._id]);

  // Listening to events
  useEffect(() => {
    if (socket) {
      // new chat
      socket.on("chat_created", (chatData) => {
        dispatch(addSingleChat(chatData));
      });

      // New user Added into a group
      socket.on("new_user_added", (chatId, newUsers) => {
        if (newUsers.some((newUser) => newUser._id == user._id)) {
          dispatch(setIsGetChats(true));
        } else {
          dispatch(addNewUsersIntoChat({ newUsers, chatId }));
        }
      });

      // Removed a user / exit group
      socket.on("user_removed", (chatId, removedUserId) => {
        if (removedUserId == user._id) {
          dispatch(exitChat(chatId));
          dispatch(setActiveChatId(null));
        } else {
          dispatch(removeUserFromChat({ chatId, removedUserId }));
        }
      });

      // User blocked
      socket.on("user_blocked", (blockedBy, chatId) => {
        dispatch(blockUser({ blockedBy, chatId }));
      });

      // User unblocked
      socket.on("user_unblocked", (chatId) => {
        dispatch(unblockUser(chatId));
      });

      // Delete group
      socket.on("group_deleted", (chatId) => {
        dispatch(exitChat(chatId));
        dispatch(setActiveChatId(null));
      });

      // User image update
      socket.on("profile_updated", (userData) => {
        dispatch(updateUserInChat(userData));
      });

      // Group image update
      socket.on("chat_updated", (chatData) => {
        dispatch(updateChatImage(chatData));
      });

      // New message
      socket.on("new-message", (message) => {
        dispatch(addMessage(message));
      });

      // Delete message
      socket.on("message_deleted", (messageId, chatId) => {
        console.log("message deleted");
        console.log(`mID: ${messageId}, chatID: ${chatId}`);
        dispatch(deleteMessage({ messageId, chatId }));
      });
    }

    return () => {
      if (socket) {
        socket.off("chat_created");
        socket.off("added_into_group");
      }
    };
  }, [socket]);

  const getProfile = async () => {
    try {
      if (!user) {
        const res = await axiosFetch(constants.GET_PROFILE);
        dispatch(addUser(res.data.data));
        console.log(res);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <socketContext.Provider value={{ socket: socket }}>
      <div
        className={
          "h-[100vh] w-[100vw] flex " +
          (showCreateChatModal || isImageUpload
            ? "blur pointer-events-none"
            : "")
        }
      >
        {((WIDTH < 640 && !activeChatId) || WIDTH > 640) && (
          <div
            className={
              "w-[100vw] sm:w-[40vw] lg:w-[30vw] h-full p-3 bg-zinc-800"
            }
          >
            <ChatPanel showCreateChatModal={showCreateChatModal} />
          </div>
        )}

        {((WIDTH < 640 && activeChatId) || WIDTH > 640) && (
          <div className="w-[100vw] sm:w-[60vw] lg:w-[70vw]">
            <ChatContainer />
          </div>
        )}
      </div>
    </socketContext.Provider>
  );
};
export default Chat;
