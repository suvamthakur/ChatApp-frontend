import { useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import socketContext from "@/lib/socketContext";
import { IoArrowBack } from "react-icons/io5";
import { RootState } from "@/store/appStore";
import { ActionableMessage } from "@/types/store";

import { useLocation, useNavigate } from "react-router-dom";
import ActionableMessageCard from "./ActionableMessageCard";
import { IoIosSearch } from "react-icons/io";

let WIDTH = window.innerWidth;
const ActionableChatContainer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchMessage, setSearchMessage] = useState("");

  const actionableMessages = useSelector(
    (store: RootState) => store.actionableMessages
  );

  let messages = [] as ActionableMessage[];
  if (actionableMessages.length) {
    if (pathname.includes("/tasks")) {
      messages = actionableMessages.filter((msg) => msg.type === "task");
    } else if (pathname.includes("/events")) {
      messages = actionableMessages.filter((msg) => msg.type === "event");
    }
  }
  if (searchMessage) {
    messages = messages.filter((msg) => {
      // Check by user name
      const hasMatchingUser = msg.payload?.targetedUsers.some((user) =>
        user.name.toLowerCase().includes(searchMessage.toLowerCase())
      );

      // Check by title
      const hasMatchingTitle = msg.payload.title
        .toLowerCase()
        .includes(searchMessage.toLowerCase());

      // Check by title description
      const hasMatchingDescription = (msg.payload?.description || "")
        .toLowerCase()
        .includes(searchMessage.toLowerCase());

      return hasMatchingUser || hasMatchingTitle || hasMatchingDescription;
    });
  }

  const user = useSelector((store: RootState) => store.user);
  let { socket } = useContext(socketContext);
  socket = socket!;

  const containerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 600);

    return () => clearTimeout(t);
  }, [actionableMessages]);

  return (
    user && (
      <>
        <div className="h-[100vh] w-full sm:ml-[1px] flex flex-col">
          <div className="flex items-center justify-between bg-zinc-800 px-2 sm:px-4 h-14 py-3 cursor-pointer">
            <div className="flex items-center">
              {WIDTH < 640 &&
                (pathname.includes("/tasks") ||
                  pathname.includes("/events")) && (
                  <IoArrowBack
                    className="text-gray-400 text-2xl mr-3"
                    onClick={() => navigate("/chat/actionables")}
                  />
                )}

              <p className="ml-2 text-zinc-200 font-medium">
                {pathname.includes("/tasks") ? "Tasks" : "Events"}
              </p>
            </div>

            <div className="flex items-center bg-zinc-700 rounded-md px-2">
              <IoIosSearch className="text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search..."
                value={searchMessage}
                onChange={(e) => setSearchMessage(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-200 px-2 py-1 w-full"
              />
            </div>
          </div>
          {/* Message Container */}
          {messages.length ? (
            <div
              ref={containerRef}
              className="flex flex-col gap-4 px-8 py-4 flex-grow overflow-y-auto custom-scrollbar"
            >
              {messages.map((message) => (
                <ActionableMessageCard key={message._id} message={message} />
              ))}
            </div>
          ) : (
            <div className="text-center text-xl px-4 mt-8 font-medium text-zinc-200">
              <h1>No messages found!</h1>
            </div>
          )}
        </div>
      </>
    )
  );
};
export default ActionableChatContainer;
