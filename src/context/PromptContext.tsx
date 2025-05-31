import { createContext, ReactNode, useContext, useState } from "react";

interface PromptContextType {
    inputText: string;
    setInputText: (text: string) => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider = ({ children }: { children: ReactNode }) => {

    const [inputText, setInputText] = useState('');

    return (
        <PromptContext.Provider value={{ inputText, setInputText }}>
            {children}
        </PromptContext.Provider>
    );
};

export const usePrompt = (): PromptContextType => {
    const context = useContext(PromptContext);
    if (!context) {
        throw new Error('usePrompt must be used within a PromptProvider')
    }
    return context;
}