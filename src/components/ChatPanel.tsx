import { IoIosSearch } from "react-icons/io";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { axiosFetch } from "@/lib/axiosFetch";
import { addChatMessages, addChats } from "@/store/chatSlice";
import { constants } from "@/lib/constants";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  setActiveChatId,
  setIsGetChats,
  setIsImageUpload,
  setShowCreateChatModal,
} from "@/store/appSlice";
import CreateChatModal from "./modals/CreateChatModal";
import ImageUploadModal from "./modals/ImageUploadModal";
import { RootState } from "@/store/appStore";
import { Chat } from "@/types/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BsListTask } from "react-icons/bs";
import { MdEvent } from "react-icons/md";
import { addActionableMessages } from "@/store/actionableMessageSlice";
import { useLocation, useNavigate } from "react-router-dom";

type ChatPanelProps = {
  showCreateChatModal: boolean;
};

const ChatPanel = ({ showCreateChatModal }: ChatPanelProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isCreateGroup, setIsCreateGroup] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const [searchChat, setSearchChat] = useState("");

  const allChats = useSelector((store: RootState) => store.chats.allChats);
  const [chats, setChats] = useState<Chat[]>([]);

  const chatMessages = useSelector(
    (store: RootState) => store.chats.chatMessages
  );
  const user = useSelector((store: RootState) => store.user);
  const { isGetChats, isImageUpload } = useSelector(
    (store: RootState) => store.app
  );

  useEffect(() => {
    if (isGetChats) {
      getChats();
      dispatch(setIsGetChats(false));
    }
    setChats(allChats);
  }, [isGetChats, allChats]);

  // Search chats
  useEffect(() => {
    const groupChats = allChats.filter(
      (chat) =>
        (chat.isGroup &&
          chat.groupName
            ?.toLowerCase()
            .includes(searchChat.trim().toLowerCase())) ??
        false
    );
    const userChats = allChats.filter(
      (chat) =>
        chat.isGroup === false &&
        chat.users.some((user) =>
          user.name.toLowerCase().includes(searchChat.trim().toLowerCase())
        )
    );

    setChats([...groupChats, ...userChats]);
  }, [searchChat]);

  const getChats = async () => {
    console.log("called");
    try {
      const res = await axiosFetch(constants.GET_USER_CHATS);

      console.log("chat: ", res.data.data);
      dispatch(addChats(res.data.data));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getActionableMessages();
  }, []);

  const getActionableMessages = async () => {
    try {
      const res = await axiosFetch.get(constants.GET_ACTIONABLE_MESSAGES);
      console.log(res.data.data);
      dispatch(addActionableMessages(res.data.data));
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleChatMessages = async (chatId: string) => {
    try {
      if (!chatMessages[chatId]) {
        const res = await axiosFetch.get(constants.GET_MESSAGES + `/${chatId}`);
        console.log(res.data.data);
        // To show the messages in chat container
        dispatch(
          addChatMessages({
            [chatId]: res.data.data,
          })
        );
      }
      // To get the details of chat in chat container
      dispatch(setActiveChatId(chatId));
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    user && (
      <div className="h-[100vh] flex flex-col overflow-y-auto custom-scrollbar">
        <Tabs
          defaultValue={
            pathname.includes("/actionables") ? "actionables" : "chats"
          }
          className="w-full"
        >
          <div className="flex justify-between items-center my-2">
            <TabsList className="bg-[#3F3F46] !py-6 px-2 w-[60%]">
              <TabsTrigger
                value="chats"
                className="text-gray-100 text-base w-1/2"
                onClick={() => {
                  navigate("/chat");
                }}
              >
                Chats
              </TabsTrigger>
              <TabsTrigger
                value="actionables"
                className="text-gray-100 text-base w-1/2"
                onClick={() => {
                  navigate("/chat/actionables");
                }}
              >
                Actionables
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center">
              <div
                className="relative w-9 h-9 mr-3 rounded-full cursor-pointer"
                onClick={() => {
                  setShowImageUpload(true);
                  dispatch(setIsImageUpload(true));
                }}
              >
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              <Popover open={showChatOptions} onOpenChange={setShowChatOptions}>
                <PopoverTrigger asChild>
                  <Button className="pt-0 bg-zinc-700 w-10 h-10 rounded-full">
                    <span className="text-4xl">+</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-max py-1 px-0 cursor-pointer font-medium"
                >
                  <div
                    className="mb-2 px-4 py-1 hover:bg-zinc-300"
                    onClick={() => {
                      setIsCreateGroup(true);
                      setShowChatModal(true);
                      setShowChatOptions(false);
                      dispatch(setShowCreateChatModal(true));
                    }}
                  >
                    Create group
                  </div>
                  <div
                    className="px-4 py-1  hover:bg-zinc-300"
                    onClick={() => {
                      setShowChatModal(true);
                      dispatch(setShowCreateChatModal(true));
                      setShowChatOptions(false);
                    }}
                  >
                    Add user
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <TabsContent value="chats">
            <div className="flex items-center bg-zinc-700 rounded-full p-2 mt-4 text-zinc-200">
              <IoIosSearch className="text-xl" />
              <input
                type="text"
                className="bg-transparent outline-none ml-2 w-full"
                placeholder="Search"
                onChange={(e) => setSearchChat(e.target.value.trim())}
              />
            </div>

            <div className="mt-3 flex-grow overflow-y-auto custom-scrollbar">
              {chats.length > 0 &&
                chats.map((chat, i) => (
                  <div
                    key={i}
                    className="flex py-3.5 pl-2 border-b border-[#39393b] cursor-pointer hover:bg-[#39393f56]"
                    onClick={() => handleChatMessages(chat._id)}
                  >
                    <div className="w-12 h-12 rounded-full">
                      {/* Chat Image */}
                      <img
                        src={
                          chat.isGroup
                            ? chat.groupImage
                            : user._id == chat.admin
                            ? chat.users[0].photoURL
                            : chat.users[1].photoURL // admin's photo
                        }
                        alt=""
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>

                    <div className="ml-2">
                      {/* Chat Name */}
                      <p className="font-medium text-zinc-200">
                        {
                          chat.isGroup
                            ? chat.groupName
                            : user._id == chat.admin
                            ? chat.users[0].name
                            : chat.users[1].name // admin's name
                        }
                      </p>

                      {chat.lastMessage &&
                        Object.keys(chat.lastMessage).length > 0 && (
                          <>
                            <span className="text-zinc-300 text-sm font-medium">
                              {chat.lastMessage.senderName == user.name
                                ? "You"
                                : chat.lastMessage.senderName}
                              {": "}
                            </span>
                            <span className="text-zinc-300 text-sm">
                              {chat.lastMessage.content.length > 20
                                ? chat.lastMessage.content.substring(0, 20) +
                                  "..."
                                : chat.lastMessage.content}
                            </span>
                          </>
                        )}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="actionables" className="mt-4">
            <div
              className="flex items-center py-4 pl-2 border-b border-t border-[#39393b] cursor-pointer hover:bg-[#39393f56]"
              onClick={() => {
                dispatch(setActiveChatId(null));
                navigate("/chat/actionables/tasks");
              }}
            >
              <BsListTask className="text-xl text-zinc-200" />
              <p className="ml-2 font-medium text-zinc-200">Tasks</p>
            </div>
            <div
              className="flex items-center py-4 pl-2 border-[#39393b] cursor-pointer hover:bg-[#39393f56]"
              onClick={() => {
                dispatch(setActiveChatId(null));
                navigate("/chat/actionables/events");
              }}
            >
              <MdEvent className="text-xl text-zinc-200" />
              <p className="ml-2 font-medium text-zinc-200">Events</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* showChatModal - local state,  showCreateChatModal - redux state */}
        {showChatModal && showCreateChatModal && (
          <CreateChatModal
            isCreateGroup={isCreateGroup}
            setIsCreateGroup={setIsCreateGroup}
            allChats={allChats}
            setShowChatModal={setShowChatModal}
          />
        )}

        {/* showImageUpload is used identify whether isImageUpload is from user or group */}
        {showImageUpload && isImageUpload && (
          <ImageUploadModal
            image={user.photoURL}
            setShowImageUpload={setShowImageUpload}
          />
        )}
      </div>
    )
  );
};

export default ChatPanel;
