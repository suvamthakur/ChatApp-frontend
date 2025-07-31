import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { setShowCreateChatModal } from "@/store/appSlice";
import { IoClose } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";
import socketContext from "@/lib/socketContext";
import { addSingleChat } from "@/store/chatSlice";
import { Chat, User } from "@/types/store";
import { RootState } from "@/store/appStore";
import { AxiosError } from "axios";

type CreateChatModalProps = {
  isExistingGroup?: boolean;
  isCreateGroup?: boolean;
  setIsCreateGroup?: Function;
  allChats: Chat[];
  currentChat?: Chat;
  setShowChatModal: Function;
};

const CreateChatModal = ({
  isExistingGroup = false,
  isCreateGroup = false,
  setIsCreateGroup,
  allChats,
  currentChat,
  setShowChatModal,
}: CreateChatModalProps) => {
  const dispatch = useDispatch();
  const [existingUsers, setExistingUsers] = useState<Record<string, User>>({}); // group

  const [availableUsers, setAvailableUsers] = useState<User[]>([]); // !group
  const [groupName, setGroupName] = useState("");
  const [preview, setPreview] = useState(
    "https://cdn-icons-png.flaticon.com/256/2893/2893570.png"
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]); // Used to add user to create a group
  const currentUser = useSelector((store: RootState) => store.user);

  let { socket } = useContext(socketContext);
  socket = socket!;

  console.log("existingUsers: ", existingUsers);

  useEffect(() => {
    // Store existing users
    let existingConnections: Record<string, User> = {};

    for (let chat of allChats) {
      if (!chat.isGroup && !chat.isBot) {
        const { users } = chat;

        for (let user of users) {
          if (user._id != currentUser!._id) {
            existingConnections = { ...existingConnections, [user._id]: user };
          }
        }
      }
    }
    if (isExistingGroup != undefined) {
      if (isExistingGroup && currentChat) {
        console.log("currentChat.users: ", currentChat.users);
        // To add new members into the group
        let existingMembers: Record<string, User> = {};

        for (let user of currentChat.users) {
          existingMembers = { ...existingMembers, [user._id]: user };
        }

        console.log("existingMembers: ", existingMembers);
        console.log("existingConnections: ", existingConnections);

        const availableUsers = Object.keys(existingConnections)
          .map((userId) => {
            if (!Object.hasOwn(existingMembers, userId)) {
              return existingConnections[userId];
            }
          })
          .filter((user) => user != undefined);

        setAvailableUsers(availableUsers);
      } else {
        // set existing conenections (creating a group)
        setExistingUsers(existingConnections);

        console.log("hi");
        // For adding a connection
        !isCreateGroup && getAllUsers(existingConnections);
      }
    }
    return () => {
      isCreateGroup && setIsCreateGroup?.(false);
    };
  }, []);

  const handleAddUser = async (user: User) => {
    try {
      const formData = new FormData();
      formData.append("users", JSON.stringify([user]));

      const chatData = await axiosFetch.post(constants.CREATE_CHAT, formData);
      dispatch(addSingleChat(chatData?.data?.data));

      socket.emit("create_chat", chatData?.data?.data, [user]);

      dispatch(setShowCreateChatModal(false));
      setShowChatModal(false);
      toast.success("User added");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length == 0) {
      toast.error("Atleast add one user");
      return;
    }
    if (groupName == "") {
      toast.error("Please enter group name");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("users", JSON.stringify(selectedUsers));
      formData.append("isGroup", "true");
      formData.append("groupName", groupName);
      if (selectedImage) {
        formData.append("groupImage", selectedImage);
      }

      const chatData = await toast.promise(
        axiosFetch.post(constants.CREATE_CHAT, formData),
        {
          loading: "Creating your group..",
          success: "Group created successfully",
          error: "Unable to create the group",
        }
      );
      dispatch(addSingleChat(chatData?.data?.data));
      socket.emit("create_chat", chatData?.data?.data, selectedUsers);

      dispatch(setShowCreateChatModal(false));
      setShowChatModal(false);
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
  };

  const handleAddMemberToGroup = async () => {
    try {
      await axiosFetch.patch(constants.ADD_USER + `/${currentChat!._id}`, {
        users: selectedUsers,
      });

      const newUsers = selectedUsers;
      socket.emit("add_user_to_group", currentChat!._id, newUsers);

      dispatch(setShowCreateChatModal(false));
      setShowChatModal(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went worng");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = e.target.files?.[0];

    if (imageFile && imageFile.type.startsWith("image/")) {
      const blobUrl = URL.createObjectURL(imageFile);
      setPreview(blobUrl);
      setSelectedImage(imageFile);
    } else {
      toast.error("Please upload an image");
    }
  };

  const getAllUsers = async (existingConnections: typeof existingUsers) => {
    console.log("existingUsers: ", existingConnections);
    try {
      const res = await axiosFetch(constants.GET_ALL_USERS);
      const allUsers: User[] = res?.data?.data;

      const finalUsers = allUsers.filter((user) => {
        if (!existingConnections[user._id]) return true;
      });
      console.log("final user: ", finalUsers);
      setAvailableUsers(finalUsers);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err?.response?.data?.msg);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[80vw] lg:w-[800px] h-[80vh] ">
      <div className="w-full h-full flex flex-col bg-zinc-900 rounded-md p-4">
        <p className="text-center text-zinc-200 font-medium text-xl">
          {isExistingGroup && "Add Members into Your Group"}

          {!isExistingGroup &&
            (isCreateGroup ? "Create your group" : "Connect with a User")}
        </p>

        {/* Group details */}

        {isCreateGroup && (
          <>
            <div className="relative w-14 h-14 my-3 mx-auto border border-zinc-600 p-1 rounded-full cursor-pointer">
              <img
                src={preview}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
              <FaEdit className="text-zinc-100 absolute bottom-0 -right-1" />

              <input
                type="file"
                onChange={(e) => handleImageUpload(e)}
                className="absolute top-0 opacity-0 w-full h-full cursor-pointer"
                accept="image/*"
              />
            </div>

            <div className="">
              <input
                type="text"
                value={groupName}
                className="bg-transparent rounded-3xl w-full text-zinc-300 border border-zinc-800 outline-none px-4 py-1.5"
                placeholder="Enter group name"
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Selected members */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="relative bg-zinc-800 rounded w-max py-1.5 px-2 flex items-center border"
              >
                <img
                  className="w-6 h-6 object-cover rounded-full border"
                  src={user.photoURL}
                  alt=""
                />
                <span className="text-zinc-200 ml-1.5">{user.name}</span>

                <IoClose
                  className="absolute -top-2.5 -right-2.5 p-0.5 text-xl text-red-500 bg-zinc-950 rounded-full cursor-pointer"
                  onClick={() =>
                    setSelectedUsers((prevUsers) =>
                      prevUsers.filter((prevUser) => prevUser._id != user._id)
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* User list */}
        <div className="mt-3 border border-zinc-800 rounded px-4 flex-grow overflow-y-scroll custom-scrollbar">
          {(isCreateGroup
            ? Object.values(existingUsers).filter(
                (user) => !selectedUsers.includes(user) // create a group
              )
            : // this filter is for adding member to the group and connecting with new user
              availableUsers.filter((user) => !selectedUsers.includes(user))
          ).map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between my-5"
            >
              <div className="flex items-center">
                <img
                  className="w-8 h-8 object-cover rounded-full border"
                  src={user.photoURL}
                  alt=""
                />
                <span className="ml-2 text-zinc-300 font-medium">
                  {user.name}
                </span>
              </div>
              <button
                className="bg-zinc-300 px-4 py-1 rounded font-medium hover:bg-zinc-400"
                onClick={() => {
                  if (isCreateGroup || isExistingGroup) {
                    setSelectedUsers((prevUsers) => [...prevUsers, user]);
                  } else {
                    handleAddUser(user);
                    dispatch(setShowCreateChatModal(false));
                  }
                }}
              >
                Add
              </button>
            </div>
          ))}

          {/* For group */}
          {isCreateGroup &&
            Object.values(existingUsers).length == 0 &&
            isCreateGroup && (
              <p className="text-center text-zinc-400 text-lg mt-4">
                You need to add other users to create a group
              </p>
            )}
        </div>

        {isCreateGroup && Object.values(existingUsers).length > 0 && (
          <button
            className="bg-zinc-700 text-zinc-100 py-2 font-medium w-[150px] rounded-3xl mt-2 mx-auto hover:bg-zinc-800"
            onClick={() => handleCreateGroup()}
          >
            Create
          </button>
        )}

        {isExistingGroup && selectedUsers.length > 0 && (
          <button
            className="bg-zinc-700 text-zinc-100 py-2 font-medium w-[180px] rounded-3xl mt-2 mx-auto hover:bg-zinc-800"
            onClick={() => handleAddMemberToGroup()}
          >
            Add into the group
          </button>
        )}
      </div>

      <div
        className="absolute top-2 right-2"
        onClick={() => {
          setShowChatModal(false);
          dispatch(setShowCreateChatModal(false));
        }}
      >
        <IoIosCloseCircleOutline className="text-3xl text-zinc-300 cursor-pointer" />
      </div>
    </div>,
    document.getElementById("root")!
  );
};
export default CreateChatModal;
