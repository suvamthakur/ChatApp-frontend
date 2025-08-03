export type User = {
  _id: string;
  name: string;
  email: string;
  photoURL: string;
};

export type Chat = {
  _id: string;
  admin: string;
  isGroup: boolean;
  isBot: boolean;
  groupImage: string;
  groupName: string;
  blockedBy: string | null;
  lastMessage?: {
    _id: string;
    senderName: string;
    content: string;
  };
  users: User[];
};

export type Attachment = {
  type: string;
  name: string;
  url: string;
};

export type ChatMessage = {
  _id: string;
  name: string;
  senderId: User;
  photoURL: string;
  attachment: Attachment | null;
  content: string;
  replyTo: {
    messageId: string;
    senderId: string;
    senderName: string;
    messageContent: string;
    attachment: Attachment | null;
  } | null;
};

export type ActionableMessage = {
  _id: string;
  senderId: User;
  chatId: Chat;
  type: "text" | "event" | "task";
  content: string;
  attachment: Attachment | null;
  payload: {
    title: string;
    description?: string;
    attachments?: Attachment[];
    targetedUsers: User[];
  };
  createdAt: string;
  updatedAt: string;
};
