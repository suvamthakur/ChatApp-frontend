import React, { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatController from "./ChatController";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { IoMdExit } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { BiSend } from "react-icons/bi";
import Message from "./Message";
import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { deleteReply } from "@/store/messageSlice";
import { MdBlock } from "react-icons/md";
import { CgUnblock } from "react-icons/cg";
import { GrAttachment } from "react-icons/gr";
import { FaFilePdf } from "react-icons/fa";
import socketContext from "@/lib/socketContext";
import { IoArrowBack } from "react-icons/io5";
import { setActiveChatId } from "@/store/appSlice";
import { RootState } from "@/store/appStore";
import { Chat } from "@/types/store";
import { AxiosError } from "axios";

const ChatContainer = () => {
  let WIDTH = window.innerWidth;

  const dispatch = useDispatch();
  const [chatDetails, setChatDetails] = useState<Chat | null>(null);
  const [isControllerActive, setIsControllerActive] = useState(false);
  const [text, setText] = useState("");
  const [isOption, setIsOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const activeChatId = useSelector(
    (store: RootState) => store.app.activeChatId
  );
  const allChats = useSelector((store: RootState) => store.chats.allChats);
  const user = useSelector((store: RootState) => store.user);
  const chatMessages = useSelector(
    (store: RootState) => store.chats.chatMessages
  );
  const { reply } = useSelector((store: RootState) => store.message);

  let { socket } = useContext(socketContext);
  socket = socket!;

  const messageRef = useRef<Record<string, HTMLDivElement | null>>({});

  const inputFocus = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (activeChatId && allChats) {
      // Find the correct chat details
      for (let chat of allChats) {
        if (chat._id == activeChatId) {
          setChatDetails(chat);
          break;
        }
      }

      // Focus on textArea when the chat changes
      inputFocus.current?.focus();
    }
  }, [activeChatId, allChats]);

  // Focus input box while replying
  useEffect(() => {
    inputFocus.current?.focus();
  }, [reply]);

  // Scrolling the messages
  const containerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 600);

    return () => clearTimeout(t);
  }, [chatMessages, activeChatId]);

  const handleSendMessage = async () => {
    if (!selectedFile && text.length === 0) return;

    setText("");
    selectedFile && setSelectedFile(null);

    // Delete the reply box from the UI
    if (reply) {
      dispatch(deleteReply());
    }

    try {
      const formData = new FormData();
      formData.append("content", text);
      selectedFile && formData.append("file", selectedFile);

      if (reply) {
        formData.append(
          "replyTo",
          JSON.stringify({
            messageId: reply.messageId,
            senderId: reply.senderId,
            senderName: reply.name,
            messageContent: reply.content,
            attachment: reply.attachment,
          })
        );
      }

      const message = await axiosFetch.post(
        constants.CREATE_MESSAGE + `/${activeChatId}`,
        formData
      );

      console.log(message?.data?.data);

      socket.emit("new_message", message?.data?.data);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 41943040) {
      toast.error("File size must be less than 40mb");
      return;
    }
    setSelectedFile(file);
  };

  const handleExitGroup = async (chatId: string) => {
    try {
      await axiosFetch.patch(constants.EXIT_CHAT + `/${chatId}`);
      socket.emit("exit_group", chatId, user!._id);

      toast.success("You have left the group");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleDeleteGroup = async (chatId: string) => {
    try {
      await axiosFetch.delete(constants.DELETE_CHAT + `/${chatId}`);
      socket.emit("delete_group", chatId);

      toast.success("Group deleted successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleBlockUser = async (chatId: string) => {
    try {
      await axiosFetch.patch(constants.TOGGLE_BLOCK + `/${chatId}`);

      let blockedBy = user!._id;
      socket.emit("block_user", blockedBy, chatId);

      toast.success("User has been blocked");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleUnblockUser = async (chatId: string) => {
    try {
      await axiosFetch.patch(constants.TOGGLE_BLOCK + `/${chatId}`);

      socket.emit("unblock_user", chatId);

      toast.success("User has been unblocked");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const scrollMessage = (messageId: string) => {
    const messageElement = messageRef.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      messageElement.style.backgroundColor = "#27272a";
      messageElement.style.transition = "background-color 1s";

      // Remove inline styling after 1 second
      setTimeout(() => {
        messageElement.style.backgroundColor = "";
      }, 1000);
    }
  };

  if (chatDetails && chatMessages && activeChatId) {
    const { groupImage, groupName, isGroup, users, admin, blockedBy } =
      chatDetails;

    // Get all messages for the activeChat/currentChat
    const messages = chatMessages[activeChatId];

    return (
      user && (
        <div className="h-[100vh] w-full sm:ml-[1px] flex flex-col">
          <div
            className="flex items-center bg-zinc-800 px-2 sm:px-4 h-14 py-3 cursor-pointer"
            onClick={() => {
              setIsControllerActive(true);
            }}
          >
            {WIDTH < 640 && activeChatId && (
              <IoArrowBack
                className="text-gray-400 text-2xl mr-3"
                onClick={() => dispatch(setActiveChatId(null))}
              />
            )}

            <div className="w-10 h-10 rounded-full">
              <img
                className="w-full h-full object-cover rounded-full"
                src={
                  isGroup
                    ? groupImage
                    : user._id == admin
                    ? users[0].photoURL
                    : users[1].photoURL // admin's image
                }
                alt=""
              />
            </div>
            <div className="ml-2">
              <p className="text-zinc-200 font-medium">
                {
                  isGroup
                    ? groupName
                    : user._id == admin
                    ? users[0].name
                    : users[1].name // admin's name
                }
              </p>
              {isGroup && (
                <div className="text-sm text-zinc-400">
                  {users.map((userDetails) => (
                    <span key={userDetails._id}>
                      {userDetails._id !== user._id && userDetails.name + ", "}
                    </span>
                  ))}
                  <span>You</span>
                </div>
              )}
            </div>

            <Popover open={isOption} onOpenChange={setIsOption}>
              <PopoverTrigger asChild>
                <button
                  className="ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BsThreeDotsVertical className="text-zinc-300 text-4xl mr-4 py-2 rounded-full hover:bg-zinc-700 cursor-pointer" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="z-50 mt-1 cursor-pointer bg-red-600 rounded"
                onClick={(e) => {
                  //otherWise chatController will be opened
                  e.stopPropagation();
                  setIsOption(false);
                }}
              >
                <div className="flex items-center text-zinc-200 font-medium w-full py-1.5">
                  {!isGroup ? (
                    <>
                      {!blockedBy && (
                        <div
                          className="py-1 px-3 flex items-center"
                          onClick={() => handleBlockUser(chatDetails._id)}
                        >
                          <MdBlock className="text-xl" />
                          <span className="ml-2">Block</span>
                        </div>
                      )}

                      {blockedBy == user._id && (
                        <div
                          className="py-1 px-3 flex items-center"
                          onClick={() => handleUnblockUser(chatDetails._id)}
                        >
                          <CgUnblock className="text-xl" />
                          <span className="ml-2">Unblock</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {user._id == admin ? (
                        <div
                          className="py-1 px-3 flex items-center"
                          onClick={() => handleDeleteGroup(chatDetails._id)}
                        >
                          <MdDelete className="text-2xl" />
                          <span className="ml-2">Delete group</span>
                        </div>
                      ) : (
                        <div
                          className="py-1 px-3 flex items-center"
                          onClick={() => handleExitGroup(chatDetails._id)}
                        >
                          <IoMdExit className="text-xl" />
                          <span className="ml-2">Exit group</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message Container */}
          <div
            ref={containerRef}
            className="px-8 py-2 flex-grow overflow-y-auto custom-scrollbar"
          >
            {messages.map((message) => (
              <Message
                key={message._id}
                messageInfo={message}
                chatDetails={chatDetails}
                ref={(el) => (messageRef.current[message._id] = el)} // Assign ref to each message
                scrollMessage={scrollMessage}
              />
            ))}
          </div>

          {/* Send Message */}
          <form className="relative flex items-center w-[100vw] sm:w-[60vw] lg:w-[70vw] bg-zinc-800 px-4 py-3">
            <div className="">
              <GrAttachment className="text-zinc-200 text-xl mr-3 hover:text-zinc-400 cursor-pointer" />
              <input
                type="file"
                className="absolute top-0 h-full w-5 opacity-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e)}
                accept="image/*,video/*,.pdf"
              />
            </div>
            <textarea
              ref={inputFocus}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-zinc-900 text-zinc-100 px-4 py-2 rounded outline-none border-none resize-none overflow-y-auto"
              onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                e.target.style.height = "auto"; // Reset height to auto for recalculation
                e.target.style.height = `${Math.min(
                  e.target.scrollHeight,
                  100
                )}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message"
              disabled={blockedBy ? true : false}
              autoFocus
            />

            <BiSend
              className="text-4xl text-zinc-400 ml-2 p-1 rounded cursor-pointer"
              onClick={() => handleSendMessage()}
            />

            {(reply || selectedFile) && (
              <div className="absolute bottom-full -mb-2 left-0 w-full bg-zinc-800 px-3 py-2 flex flex-col gap-y-2.5">
                {/* If reply */}
                {reply && (
                  <div className="flex items-center w-full">
                    <div className="bg-zinc-900 px-3 py-1.5 rounded flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-zinc-400">
                            {reply.senderId === user._id ? "You" : reply.name}
                          </p>
                          <p className="text-zinc-200 text-[15px]">
                            {reply.content}
                          </p>
                        </div>

                        <div>
                          {reply.attachment &&
                            Object.keys(reply.attachment).length > 0 && (
                              <div className="w-10 h-10">
                                {reply.attachment.type.includes("image") && (
                                  <img
                                    src={reply.attachment.url}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                )}

                                {reply.attachment.type.includes("video") && (
                                  <video
                                    src={reply.attachment.url}
                                    className="w-full h-full object-cover"
                                  />
                                )}

                                {reply.attachment.type.includes("pdf") && (
                                  <div className="text-zinc-200 h-full flex items-center justify-center">
                                    <FaFilePdf className="text-2xl" />
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                    <IoClose
                      className="text-3xl text-zinc-400 mx-2 cursor-pointer"
                      onClick={() => dispatch(deleteReply())}
                    />
                  </div>
                )}

                {/* If any file is selected to send */}
                {selectedFile && (
                  <div className="flex items-center w-full">
                    {/* For Image */}
                    {selectedFile.type.includes("image") && (
                      <div className="rounded flex items-center flex-grow">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt=""
                          className="rounded w-12 h-12 object-cover"
                        />
                        <span className="text-zinc-200 font-medium ml-3">
                          {selectedFile.name}
                        </span>
                      </div>
                    )}

                    {/* For video */}
                    {selectedFile.type.includes("video") && (
                      <div className="rounded flex items-center flex-grow">
                        <video
                          src={URL.createObjectURL(selectedFile)}
                          className="rounded w-12 h-12 object-cover"
                        />
                        <span className="text-zinc-200 font-medium ml-3">
                          {selectedFile.name}
                        </span>
                      </div>
                    )}

                    {/* For PDF */}
                    {selectedFile.type.includes("pdf") && (
                      <div className="rounded flex items-center flex-grow">
                        <FaFilePdf className="text-zinc-200 text-xl" />
                        <span className="text-zinc-200 font-medium ml-3">
                          {selectedFile.name}
                        </span>
                      </div>
                    )}

                    <IoClose
                      className="text-3xl text-zinc-400 mx-2 cursor-pointer"
                      onClick={() => setSelectedFile(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* If User has/ has been blocked */}
            {blockedBy && (
              <p className="absolute bottom-full mb-4 rounded-full px-4 py-1 bg-zinc-900 text-zinc-400 mx-auto">
                {blockedBy == user._id
                  ? "You have blocked this user"
                  : "You have been blocked by this user"}
              </p>
            )}
          </form>

          {isControllerActive && isGroup && (
            <ChatController
              chatDetails={chatDetails}
              setIsControllerActive={setIsControllerActive}
            />
          )}
        </div>
      )
    );
  } else {
    return (
      user && (
        <div className="h-[100vh] flex items-center justify-center">
          <div className="text-center text-3xl px-4 font-medium text-zinc-200">
            <h1 className="mb-3">Hi, {user.name}</h1>
            <h1>Welcome to another chat application</h1>
          </div>
        </div>
      )
    );
  }
};
export default ChatContainer;
