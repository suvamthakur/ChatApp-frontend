import { IoClose } from "react-icons/io5";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { IoMdExit } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useContext, useState } from "react";
import { MdPersonAddAlt1 } from "react-icons/md";
import CreateChatModal from "./modals/CreateChatModal";
import { setIsImageUpload, setShowCreateChatModal } from "@/store/appSlice";
import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import ImageUploadModal from "./modals/ImageUploadModal";
import socketContext from "@/lib/socketContext";
import { RootState } from "@/store/appStore";
import { Chat, User } from "@/types/store";
import { AxiosError } from "axios";

type ChatControllerProps = {
  chatDetails: Chat;
  setIsControllerActive: Function;
};

const ChatController = ({
  chatDetails,
  setIsControllerActive,
}: ChatControllerProps) => {
  const { groupImage, groupName, users, admin } = chatDetails;

  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const currentUser = useSelector((store: RootState) => store.user);
  const allChats = useSelector((store: RootState) => store.chats.allChats);
  const { showCreateChatModal, isImageUpload } = useSelector(
    (store: RootState) => store.app
  );
  const activeChatId = useSelector(
    (store: RootState) => store.app.activeChatId
  );

  let { socket } = useContext(socketContext);
  socket = socket!;

  const handleExitGroup = async () => {
    try {
      await axiosFetch.patch(constants.EXIT_CHAT + `/${activeChatId}`);
      socket.emit("exit_group", activeChatId, currentUser!._id);

      toast.success("You have left the group");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await axiosFetch.delete(constants.DELETE_CHAT + `/${activeChatId}`);
      socket.emit("delete_group", activeChatId);

      toast.success("Group deleted successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await axiosFetch.patch(constants.REMOVE_USER + `/${activeChatId}`, {
        userId,
      });

      let removedUserId = userId;
      socket.emit("remove_user", activeChatId, removedUserId);

      toast.success("Removed successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    currentUser && (
      <div className="overflow-y-auto absolute top-0 right-0 px-4 w-[100vw] sm:w-[35vw] lg:w-[30vw] h-[100vh] bg-zinc-800 border-l border-zinc-700 custom-scrollbar">
        <div className="flex items-center w-full py-4">
          <IoClose
            className="text-zinc-500 text-3xl cursor-pointer rounded-full hover:bg-zinc-700"
            onClick={() => setIsControllerActive(false)}
          />
          <span className="text-zinc-300 ml-4 font-medium text-lg">
            Group info
          </span>
        </div>
        <div className="flex flex-col items-center py-4">
          <div
            className="relative w-28 h-28 p-1 rounded-full cursor-pointer"
            onClick={() => {
              dispatch(setIsImageUpload(true));
              setShowImageUpload(true);
            }}
          >
            <img
              className="w-full h-full object-cover rounded-full"
              src={groupImage}
              alt=""
            />
            <FaEdit className="absolute text-lg text-zinc-200 bottom-1 right-0" />
          </div>
          <p className="text-zinc-200 text-2xl mt-2">{groupName}</p>
          <p className="text-zinc-400 mt-0.5">{users.length} members</p>
        </div>

        <div className="cursor-pointer ">
          {admin == currentUser._id ? (
            <div>
              <div
                className="flex items-center px-3 py-3 text-zinc-300 hover:bg-[#d4d4d81c]"
                onClick={() => {
                  setShowChatModal(true);
                  dispatch(setShowCreateChatModal(true));
                }}
              >
                <MdPersonAddAlt1 className="text-2xl" />
                <span className="ml-2.5 text-base">Add user</span>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="flex items-center text-red-400 hover:bg-[#fca5a528] py-3 px-2">
                    <MdDelete className="text-2xl" />
                    <span className="ml-2.5">Delete group</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-zinc-800 border-none py-3 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-100">
                      Do you want to delete this group?
                    </DialogTitle>
                    <DialogDescription className="flex items-center justify-end">
                      <div
                        className="mt-6 text-lg font-medium text-zinc-300"
                        onClick={() => setIsModalOpen(false)}
                      >
                        <button
                          className="w-16 py-1 bg-zinc-900 rounded-sm"
                          onClick={() => handleDeleteGroup()}
                        >
                          Yes
                        </button>
                        <button className="w-16 py-1 bg-zinc-900 rounded-sm ml-1.5">
                          No
                        </button>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger
                className="w-full"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="flex items-center text-red-400 w-full px-2 py-3 hover:bg-[#fca5a528]">
                  <IoMdExit className="text-2xl" />
                  <span className="ml-2.5">Exit group</span>
                </div>
              </DialogTrigger>
              <DialogContent className="bg-zinc-800 border-none py-3 sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-zinc-100">
                    Do you want to exit from this group?
                  </DialogTitle>
                  <DialogDescription className="flex items-center justify-end">
                    <div
                      className="mt-6 text-lg font-medium text-zinc-300"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <button
                        className="w-16 py-1 bg-zinc-900 rounded-sm"
                        onClick={() => handleExitGroup()}
                      >
                        Yes
                      </button>
                      <button className="w-16 py-1 bg-zinc-900 rounded-sm ml-1.5">
                        No
                      </button>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="border-t py-2 border-zinc-700">
          {users.map((userDetails) => (
            <div key={userDetails._id} className="flex py-2.5 relative">
              <div className="w-9 h-9 rounded-full">
                <img
                  className="w-full h-full object-cover rounded-full"
                  src={userDetails.photoURL}
                  alt=""
                />
              </div>
              <p className="text-lg text-zinc-300 ml-3 mt-0.5">
                {userDetails._id == currentUser._id ? "You" : userDetails.name}
              </p>

              {/* Admin */}
              {userDetails._id == admin && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 px-2 bg-zinc-600 rounded-sm text-zinc-300">
                  Admin
                </div>
              )}
              {/* Remove */}
              {currentUser._id == admin && userDetails._id != admin && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 border border-red-500 rounded-sm text-red-400 cursor-pointer hover:bg-[#ef444438]"
                  onClick={() => handleRemoveUser(userDetails._id)}
                >
                  Remove
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add users */}
        {showChatModal && showCreateChatModal && (
          <CreateChatModal
            isExistingGroup={true}
            allChats={allChats}
            currentChat={chatDetails}
            setShowChatModal={setShowChatModal}
          />
        )}

        {showImageUpload && isImageUpload && (
          <ImageUploadModal
            isGroup={true}
            chatId={chatDetails._id}
            image={chatDetails.groupImage}
            setShowImageUpload={setShowImageUpload}
          />
        )}
      </div>
    )
  );
};

export default ChatController;
