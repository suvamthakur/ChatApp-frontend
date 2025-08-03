import { FaFilePdf } from "react-icons/fa";
import { ActionableMessage } from "@/types/store";

type ActionableMessageCardProps = {
  message: ActionableMessage;
};

export default function ActionableMessageCard({
  message,
}: ActionableMessageCardProps) {
  const {
    senderId: { name: senderName, photoURL },
    chatId: { isGroup, groupName },
    payload: { title, description, attachments },
    createdAt,
  } = message;

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div className="md:w-[40%] bg-zinc-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-zinc-700 mx-2">
        <div className="flex items-center">
          {senderName && (
            <div className="w-8 h-8 rounded-full mr-3">
              <img
                className="w-full h-full object-contain rounded-full"
                src={photoURL}
                alt={senderName}
              />
            </div>
          )}
          <div>
            <p className="font-medium text-zinc-200">{senderName}</p>
            {isGroup && <p className="text-xs text-zinc-400">in {groupName}</p>}
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-zinc-400 ml-3">{formattedDate}</span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-4">
        {title && (
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">{title}</h3>
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
    </div>
  );
}
