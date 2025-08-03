import React, { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatController from "./ChatController";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { IoIosSearch, IoMdExit } from "react-icons/io";
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
import { FaFilePdf, FaPlus } from "react-icons/fa";
import socketContext from "@/lib/socketContext";
import { IoArrowBack } from "react-icons/io5";
import { setActiveChatId } from "@/store/appSlice";
import { RootState } from "@/store/appStore";
import { Chat, User } from "@/types/store";
import { AxiosError } from "axios";
import { addMessage } from "@/store/chatSlice";
import { Textarea } from "../../@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const MAX_FILES = 5;
const ChatContainer = () => {
  let WIDTH = window.innerWidth;

  const dispatch = useDispatch();
  const [chatDetails, setChatDetails] = useState<Chat | null>(null);
  const [isControllerActive, setIsControllerActive] = useState(false);
  const [text, setText] = useState("");
  const [isOption, setIsOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAIresponse, setIsAIresponse] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  // Actionable Message
  const [isSendingActionable, setIsSendingActionable] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showAvailableUsers, setShowAvailableUsers] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [actionablePayload, setActionablePayload] = useState({
    type: "task",
    title: "",
    selectedUsers: [] as User[],
    description: "",
    files: [] as File[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Set available users
  useEffect(() => {
    if (!chatDetails || !user) return;
    setAvailableUsers(
      chatDetails.users.filter((chatUser) => chatUser._id !== user._id)
    );
  }, [chatDetails, user]);

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
      formData.append("type", "text");
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
      socket.emit("new_message", message?.data?.data);

      if (chatDetails?.isBot == true) {
        setIsAIresponse(true);
        getAIresponse(message?.data?.data.content, activeChatId!);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const getAIresponse = async (message: string, activeChatId: string) => {
    try {
      const res = await axiosFetch.post(
        constants.GET_AI_RESPONSE + `/${activeChatId}`,
        { content: message }
      );

      setIsAIresponse(false);
      dispatch(addMessage(res?.data?.data));
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
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

  const handleSendActionableMessage = async () => {
    try {
      setIsSendingActionable(true);
      console.log("actionablePayload: ", actionablePayload);
      if (!actionablePayload.title || !actionablePayload.selectedUsers) {
        toast.error("Please fill all the fields");
        return;
      }

      const payload = {
        title: actionablePayload.title,
        description: actionablePayload.description,
        targetedUsers: actionablePayload.selectedUsers.map((user) => user._id),
      };

      const formData = new FormData();
      formData.append("type", actionablePayload.type);
      formData.append("payload", JSON.stringify(payload));

      if (actionablePayload.files?.length > 0) {
        if (actionablePayload.files.length > MAX_FILES) {
          toast.error(`You can only upload ${MAX_FILES} files`);
          return;
        }
        actionablePayload.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const message = await axiosFetch.post(
        constants.CREATE_MESSAGE + `/${activeChatId}`,
        formData
      );
      console.log("message: ", message);
      socket.emit("new_actionable_message", message?.data?.data);

      // Clear and Close the form
      setActionablePayload({
        type: "task",
        title: "",
        selectedUsers: [],
        description: "",
        files: [],
      });
      setIsDialogOpen(false);
      toast.success("Message sent successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsSendingActionable(false);
    }
  };

  if (chatDetails && chatMessages && activeChatId) {
    const { groupImage, groupName, isGroup, users, admin, blockedBy } =
      chatDetails;

    // Get all messages for the activeChat/currentChat
    let messages = chatMessages[activeChatId];

    // Filter
    if (searchMessage) {
      messages = messages.filter((msg) => {
        const hasMatchingUser = msg.name
          .toLowerCase()
          .includes(searchMessage.toLowerCase());

        const hasMatchingContent = msg.content
          .toLowerCase()
          .includes(searchMessage.toLowerCase());

        return hasMatchingUser || hasMatchingContent;
      });
    }

    return (
      user && (
        <>
          <div className="h-[100vh] w-full sm:ml-[1px] flex flex-col">
            <div
              className="flex items-center justify-between bg-zinc-800 px-2 sm:px-4 h-14 py-3 cursor-pointer"
              onClick={() => {
                setIsControllerActive(true);
              }}
            >
              <div className="flex items-center gap-2">
                {WIDTH < 640 && activeChatId && (
                  <IoArrowBack
                    className="text-gray-400 text-2xl mr-3"
                    onClick={() => dispatch(setActiveChatId(null))}
                  />
                )}

                <div className="w-10 h-10 rounded-full">
                  <img
                    className="w-full h-full object-contain rounded-full"
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
                          {userDetails._id !== user._id &&
                            userDetails.name + ", "}
                        </span>
                      ))}
                      <span>You</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-700 rounded-md px-2">
                  <IoIosSearch className="text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchMessage}
                    onChange={(e) => setSearchMessage(e.target.value)}
                    className="bg-transparent border-none outline-none text-gray-200 px-2 py-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {!chatDetails.isBot && (
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
                                onClick={() =>
                                  handleUnblockUser(chatDetails._id)
                                }
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
                                onClick={() =>
                                  handleDeleteGroup(chatDetails._id)
                                }
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
                )}
              </div>
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

              {/* AI response animation */}

              {isAIresponse && (
                <div className="my-2">
                  <div className="flex dot-flashing"></div>
                </div>
              )}
            </div>

            {/* Send Message */}
            <form className="relative flex items-center w-[100vw] sm:w-[60vw] lg:w-[70vw] bg-zinc-800 px-4 py-3">
              {!chatDetails.isBot && (
                <div className="flex items-center gap-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendActionableMessage();
                      }}
                    >
                      <DialogTrigger asChild>
                        <FaPlus
                          className="text-zinc-200 text-xl mr-3 hover:text-zinc-400 cursor-pointer"
                          onClick={() => setIsDialogOpen(true)}
                        />
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#27272A] text-zinc-100 !border-none rounded-lg custom-scrollbar">
                        <DialogHeader>
                          <DialogTitle className="text-lg text-zinc-100">
                            Create Actionable Message
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="type"
                              className="text-sm text-zinc-300 font-semibold"
                            >
                              Type
                            </label>
                            <select
                              id="type"
                              name="type"
                              value={actionablePayload?.type}
                              onChange={(e) =>
                                setActionablePayload({
                                  ...actionablePayload,
                                  type: e.target.value,
                                })
                              }
                              className="w-full text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 rounded-md p-2"
                            >
                              <option value="task">Task</option>
                              <option value="event">Event</option>
                            </select>
                          </div>

                          <div className="grid gap-2">
                            <label
                              htmlFor="name-1"
                              className="text-sm text-zinc-300 font-semibold"
                            >
                              Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="name-1"
                              name="name"
                              className="!outline-zinc-700 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400"
                              placeholder="Enter name"
                              value={actionablePayload?.title}
                              onChange={(e) =>
                                setActionablePayload({
                                  ...actionablePayload,
                                  title: e.target.value,
                                })
                              }
                              required
                              onFocus={() =>
                                showAvailableUsers &&
                                setShowAvailableUsers(false)
                              }
                            />
                          </div>

                          {/* Selected Users */}
                          {actionablePayload?.selectedUsers?.length > 0 && (
                            <div className="mt-4 flex items-center flex-wrap gap-2">
                              {actionablePayload?.selectedUsers?.map((user) => (
                                <div
                                  key={user._id}
                                  className="relative bg-zinc-800 rounded w-max py-1.5 px-2 flex items-center border"
                                >
                                  <img
                                    className="w-6 h-6 object-contain rounded-full border"
                                    src={user.photoURL}
                                    alt=""
                                  />
                                  <span className="text-zinc-200 ml-1.5">
                                    {user.name}
                                  </span>

                                  <IoClose
                                    className="absolute -top-2.5 -right-2.5 p-0.5 text-xl text-red-500 bg-zinc-950 rounded-full cursor-pointer"
                                    onClick={() =>
                                      setActionablePayload((prev) => {
                                        const filteredUsers =
                                          prev.selectedUsers.filter(
                                            (u) => u._id !== user._id
                                          );

                                        return {
                                          ...prev,
                                          selectedUsers: filteredUsers,
                                        };
                                      })
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="grid gap-2">
                            <label className="text-sm text-zinc-300 font-semibold">
                              Targeted Users{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              className="!outline-zinc-700 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400"
                              placeholder="Enter Username"
                              value={userSearchText}
                              onChange={(e) =>
                                setUserSearchText(e.target.value.trim())
                              }
                              onFocus={() => setShowAvailableUsers(true)}
                            />
                          </div>

                          {/* Available Users */}
                          {showAvailableUsers && (
                            <div className="w-full bg-[#27272A] rounded-lg px-4 flex-grow overflow-y-scroll custom-scrollbar">
                              {availableUsers
                                .filter(
                                  (user) =>
                                    !actionablePayload?.selectedUsers?.includes(
                                      user
                                    ) &&
                                    user.name
                                      .toLowerCase()
                                      .includes(userSearchText.toLowerCase())
                                )
                                .map((user) => (
                                  <div
                                    key={user._id}
                                    className="flex items-center justify-between my-5"
                                  >
                                    <div className="flex items-center">
                                      <img
                                        className="w-8 h-8 object-contain rounded-full border"
                                        src={user.photoURL}
                                        alt=""
                                      />
                                      <span className="ml-2 text-zinc-300 font-medium">
                                        {user.name}
                                      </span>
                                    </div>
                                    <button
                                      className="bg-zinc-700 px-4 py-1 rounded font-medium hover:bg-zinc-700/80"
                                      onClick={() => {
                                        setActionablePayload((prev) => ({
                                          ...prev,
                                          selectedUsers: [
                                            ...prev.selectedUsers,
                                            user,
                                          ],
                                        }));
                                      }}
                                    >
                                      Add
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="grid gap-2">
                            <label
                              htmlFor="name-1"
                              className="text-sm text-zinc-300 font-semibold"
                            >
                              Description
                            </label>
                            <Textarea
                              rows={4}
                              value={actionablePayload?.description}
                              onChange={(e) =>
                                setActionablePayload({
                                  ...actionablePayload,
                                  description: e.target.value,
                                })
                              }
                              className="!outline-zinc-700 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-400 resize-none"
                              placeholder="Type your message here."
                              onFocus={() =>
                                setShowAvailableUsers &&
                                setShowAvailableUsers(false)
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <label
                              htmlFor="files"
                              className="text-sm text-zinc-300 font-semibold"
                            >
                              Attachments
                            </label>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="border-zinc-600 text-zinc-200 hover:text-zinc-200 bg-zinc-700 hover:bg-zinc-600"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <GrAttachment className="mr-1" />
                                Attach Files
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const filesArray = Array.from(
                                      e.target.files
                                    );
                                    // Check file size
                                    const validFiles = filesArray
                                      .slice(0, MAX_FILES)
                                      .filter((file) => {
                                        if (file.size > 41943040) {
                                          toast.error(
                                            "File size must be less than 40mb"
                                          );
                                          return false;
                                        }
                                        return true;
                                      });
                                    setActionablePayload((prev) => ({
                                      ...prev,
                                      files: [...prev.files, ...validFiles],
                                    }));
                                  }
                                }}
                                accept="image/*,video/*,.pdf"
                              />
                            </div>

                            {/* File Previews */}
                            {actionablePayload.files.length > 0 && (
                              <div className="mt-2 flex flex-col gap-2 w-full">
                                {actionablePayload.files.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center w-[300px] bg-zinc-900 p-2 rounded"
                                  >
                                    {/* For Image */}
                                    {file.type.includes("image") && (
                                      <div className="rounded flex items-center flex-grow">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt=""
                                          className="rounded w-12 h-12 object-contain"
                                        />
                                        <span className="text-zinc-200 font-medium ml-3 ">
                                          {file.name.length > 15
                                            ? file.name.slice(0, 15) + "..."
                                            : file.name}
                                        </span>
                                      </div>
                                    )}

                                    {/* For video */}
                                    {file.type.includes("video") && (
                                      <div className="rounded flex items-center flex-grow">
                                        <video
                                          src={URL.createObjectURL(file)}
                                          className="rounded w-12 h-12 object-contain"
                                        />
                                        <span className="text-zinc-200 font-medium ml-3">
                                          {file.name.length > 15
                                            ? file.name.slice(0, 15) + "..."
                                            : file.name}
                                        </span>
                                      </div>
                                    )}

                                    {/* For PDF */}
                                    {file.type.includes("pdf") && (
                                      <div className="rounded flex items-center flex-grow">
                                        <FaFilePdf className="text-zinc-200 text-xl" />
                                        <span className="text-zinc-200 font-medium ml-3 ">
                                          {file.name.length > 15
                                            ? file.name.slice(0, 15) + "..."
                                            : file.name}
                                        </span>
                                      </div>
                                    )}

                                    <IoClose
                                      className="text-3xl text-zinc-400 mx-2 cursor-pointer"
                                      onClick={() => {
                                        setActionablePayload((prev) => ({
                                          ...prev,
                                          files: prev.files.filter(
                                            (_, i) => i !== index
                                          ),
                                        }));
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              variant="outline"
                              className="border-zinc-600 text-zinc-800 hover:bg-gray-300"
                              onClick={() => {
                                // Reset form when canceled
                                setActionablePayload({
                                  type: "task",
                                  title: "",
                                  selectedUsers: [],
                                  description: "",
                                  files: [],
                                });
                                setUserSearchText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            type="submit"
                            className="bg-zinc-600 text-white hover:bg-zinc-500 px-6"
                            onClick={() => handleSendActionableMessage()}
                          >
                            {isSendingActionable ? (
                              <p className="animate-pulse [animation-duration:1.1s]">
                                Sending..
                              </p>
                            ) : (
                              "Send"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </form>
                  </Dialog>

                  <div className="">
                    <GrAttachment className="text-zinc-200 text-xl mr-3 hover:text-zinc-400 cursor-pointer" />

                    <input
                      type="file"
                      className="absolute top-0 h-full w-5 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e)}
                      accept="image/*,video/*,.pdf"
                    />
                  </div>
                </div>
              )}
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
                                      className="w-full h-full object-contain"
                                      alt=""
                                    />
                                  )}

                                  {reply.attachment.type.includes("video") && (
                                    <video
                                      src={reply.attachment.url}
                                      className="w-full h-full object-contain"
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
                            className="rounded w-12 h-12 object-contain"
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
                            className="rounded w-12 h-12 object-contain"
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
        </>
      )
    );
  } else {
    return (
      user && (
        <div className="h-[100vh] flex items-center justify-center">
          <div className="text-center text-3xl px-4 font-medium text-zinc-200">
            <h1 className="mb-3">Hi {user.name}</h1>
            <h1>Welcome to another chat application</h1>
          </div>
        </div>
      )
    );
  }
};
export default ChatContainer;
