import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('General Overview');

    const toggleChat = () => setIsOpen(prev => !prev);
    const openChat = (section = 'General Overview') => {
        setIsOpen(true);
        setActiveSection(section);
    };
    const closeChat = () => setIsOpen(false);

    return (
        <ChatContext.Provider value={{ isOpen, activeSection, toggleChat, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
