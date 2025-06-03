import { createContext, ReactNode, useContext, useState } from "react";

export type PromptType = {
    id: string;
    time: string;
    message: string;
    highlight: {
        title: string;
        rating: number;
        reviews: number;
        description: string;
    };
};

type ChatContextType = {
    messages: PromptType[];
    addMessage: (message: PromptType) => void;
    clearMessages: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<PromptType[]>([]);

    const addMessage = (message: PromptType) => {
        setMessages((prev) => [...prev, message]);
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{ messages, addMessage, clearMessages }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};  