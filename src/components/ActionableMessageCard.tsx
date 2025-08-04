import { FaFilePdf } from "react-icons/fa";
import { ActionableMessage } from "@/types/store";
import { useSelector } from "react-redux";
import { RootState } from "@/store/appStore";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionableMessageCardProps = {
  message: ActionableMessage;
};

export default function ActionableMessageCard({
  message,
}: ActionableMessageCardProps) {
  const {
    senderId: { _id: senderId, name: senderName, photoURL },
    chatId: { isGroup, groupName },
    payload: { title, description, attachments, targetedUsers },
    createdAt,
  } = message;

  const user = useSelector((store: RootState) => store.user);
  const [isOpenUserList, setIsOpenUserList] = useState(false);

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const isMyMessage = senderId === user?._id;

  return (
    user && (
      <div
        className={`${
          isMyMessage ? "ml-auto rounded-tl-lg" : "rounded-tr-lg"
        } md:w-[40%] bg-zinc-800 rounded-bl-lg  rounded-br-lg shadow-md`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-2 py-3 border-b border-zinc-700 mx-2 ${
            isMyMessage ? "cursor-pointer" : ""
          }`}
          onClick={() => isMyMessage && setIsOpenUserList(!isOpenUserList)}
        >
          <div className="flex items-center">
            {isMyMessage && (
              <div className="flex items-center">
                <div className="flex -space-x-4">
                  {targetedUsers.map((user, index) => (
                    <div
                      key={user._id}
                      className="w-8 h-8 rounded-full border-2 border-zinc-800"
                      style={{
                        zIndex: targetedUsers.length - index,
                      }}
                    >
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src={user.photoURL}
                        alt={user.name}
                      />
                    </div>
                  ))}
                  {targetedUsers.length > 4 && (
                    <div
                      className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white border-2 border-zinc-800"
                      style={{ zIndex: 0 }}
                    >
                      +{targetedUsers.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isMyMessage && senderName && (
              <>
                <div className="w-8 h-8 rounded-full mr-3">
                  <img
                    className="w-full h-full object-contain rounded-full"
                    src={photoURL}
                    alt={senderName}
                  />
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{senderName}</p>
                  {isGroup && (
                    <p className="text-xs text-zinc-400">in {groupName}</p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-xs text-zinc-400 ml-3">{formattedDate}</span>
          </div>
        </div>

        {/* Content section */}
        <div className="p-4">
          {title && (
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              {title}
            </h3>
          )}

          {description && (
            <p className="text-zinc-300 mb-4 text-sm">{description}</p>
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-400 mb-2">
                Attachments:
              </p>
              <div className="flex flex-col gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="bg-zinc-900 rounded p-2">
                    {attachment.type.includes("image") && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-32 object-contain rounded mb-1"
                        />
                        <p className="text-xs text-zinc-400 truncate">
                          {attachment.name}
                        </p>
                      </a>
                    )}

                    {attachment.type.includes("video") && (
                      <div>
                        <video
                          src={attachment.url}
                          className="w-full h-32 object-contain rounded mb-1"
                          controls
                        />
                        <p className="text-xs text-zinc-400 truncate">
                          {attachment.name}
                        </p>
                      </div>
                    )}

                    {attachment.type.includes("pdf") && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2"
                      >
                        <FaFilePdf className="text-2xl text-zinc-200 mr-2" />
                        <span className="text-zinc-400 text-sm truncate">
                          {attachment.name && attachment.name.length > 20
                            ? attachment.name.substring(0, 20) + "..."
                            : attachment.name}
                        </span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* POPUP */}
        <Dialog open={isOpenUserList} onOpenChange={setIsOpenUserList}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#27272A] text-zinc-100 !border-none rounded-lg custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-lg text-zinc-100">
                Targeted Users
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {targetedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-zinc-800">
                    <img
                      className="w-full h-full object-cover rounded-full"
                      src={user.photoURL}
                      alt={user.name}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-zinc-200 mb-1">
                      {user.name}
                    </p>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  );
}
