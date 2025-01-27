import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import socketContext from "@/lib/socketContext";
import { setIsImageUpload } from "@/store/appSlice";
import { addUser, removeUser } from "@/store/userSlice";
import { useContext, useState } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const ImageUploadModal = ({
  isGroup = false,
  chatId,
  image,
  setShowImageUpload,
}) => {
  const dispatch = useDispatch();
  const [preview, setPreview] = useState(image);
  const [selectedImage, setSelectedImage] = useState(null);

  const { socket } = useContext(socketContext);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      const blobUrl = URL.createObjectURL(file);
      setPreview(blobUrl);
      setSelectedImage(file);
    } else {
      toast.error("Please upload an image");
    }
  };

  const updateChatImage = async () => {
    try {
      const formData = new FormData();
      formData.append("groupImage", selectedImage);

      const chatData = await toast.promise(
        axiosFetch.patch(constants.UPDATE_CHAT_IMAGE + `/${chatId}`, formData),
        {
          loading: "Updating group photo",
          success: "Group photo updated successfully",
          error: "Unable to upload the image",
        }
      );
      socket.emit("update_chat", chatData?.data?.data);
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.msg || "Something went wrong");
    } finally {
      dispatch(setIsImageUpload(false));
      setShowImageUpload(false);
    }
  };

  const updateUserImage = async () => {
    try {
      const formData = new FormData();
      formData.append("userImage", selectedImage);

      const res = await toast.promise(
        axiosFetch.patch(constants.UPDATE_PROFILE, formData),
        {
          loading: "Updating your profile picture...",
          success: "Profile picture updated successfully",
          error: "Unable to upload the image",
        }
      );
      dispatch(addUser(res?.data?.data));
      socket.emit("profile_update", res?.data?.data);
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.msg || "Something went wrong");
    } finally {
      dispatch(setIsImageUpload(false));
      setShowImageUpload(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axiosFetch.post(constants.LOGOUT);
      dispatch(removeUser());
      window.location.href = "/login";
    } catch (err) {
      console.log(err);
    }
  };

  return ReactDOM.createPortal(
    <div className="z-10 px-3 pt-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-zinc-800 rounded">
      <h1 className="text-center text-zinc-300 font-medium text-lg">
        {/* To identify which component calling this one (chat pannel / chat controller) */}
        {isGroup ? "Change group Image" : "Change your profile photo"}
      </h1>
      <div className="relative w-40 h-40 mx-auto my-4 border border-zinc-700 rounded p-2 cursor-pointer">
        <img
          src={preview}
          className="w-full h-full rounded-full object-cover"
          alt=""
        />
        <FaEdit className="absolute text-zinc-200 text-xl bottom-1 right-1" />

        <input
          type="file"
          onChange={(e) => handleImageUpload(e)}
          className="absolute top-0 opacity-0 w-full h-full cursor-pointer"
          accept="image/*"
        />
      </div>

      <div className="flex justify-between gap-x-1.5 text-zinc-300 font-medium">
        <button
          className="flex-1 py-1.5 bg-zinc-900 hover:bg-[#18181bad] rounded-md"
          onClick={() => {
            if (isGroup) {
              updateChatImage();
            } else {
              updateUserImage();
            }
          }}
        >
          Save
        </button>
        <button
          className="flex-1 py-1.5 bg-zinc-900 hover:bg-[#18181bad] rounded-md"
          onClick={() => {
            dispatch(setIsImageUpload(false));
            setShowImageUpload(false);
          }}
        >
          Cancel
        </button>
      </div>
      <button
        className="text-center bg-red-500 py-1.5 my-2 w-full rounded-md font-semibold hover:bg-opacity-90"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>,
    document.getElementById("root")
  );
};
export default ImageUploadModal;
