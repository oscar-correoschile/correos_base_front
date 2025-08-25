import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socketService from '@/api/socketService';
import type { Data, UnreadCount } from '@/api/socketService';

export interface ContactWithUnread {
  id: number;
  executiveId: number;
  waId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  open: boolean;
  activo: boolean;
  executive: {
    id: number;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
  };
  unreadCount?: number;
}

interface SocketContextType {
  isConnected: boolean;
  newMessages: Data[];
  unreadCounts: Map<string, number>;
  totalUnreadCount: number;
  newContacts: any[];
  sendMessage: (waId: string, message: string, sessionId: string) => void;
  joinChat: (waId: string) => void;
  leaveChat: () => void;
  markAsRead: (waId: string) => void;
  getMessagesForContact: (waId: string) => Data[];
  addUnreadCountsToContacts: (contacts: any[]) => ContactWithUnread[];
  clearNewMessages: (waId?: string) => void;
  clearNewContacts: () => void;
  reconnectWithExecutive: (executiveId: number) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: React.ReactNode;
  socketUrl?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  socketUrl = import.meta.env.VITE_API_WHATSAPP_URL || 'http://localhost:3000'
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessages, setNewMessages] = useState<Data[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [newContacts, setNewContacts] = useState<any[]>([]);

  const messagesRef = useRef<Data[]>([]);
  const currentChatRef = useRef<string | null>(null);
  const initializationRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleNewMessageRef = useRef<(message: Data) => void>(() => {});
  const handleUnreadCountUpdateRef = useRef<(counts: UnreadCount[]) => void>(() => {});

  const connectSocket = React.useCallback(async () => {
    if (initializationRef.current) {
      return;
    }

    try {
      initializationRef.current = true;

      await socketService.connect(socketUrl);
      setIsConnected(true);

    } catch (error) {
      setIsConnected(false);
      initializationRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSocket();
      }, 5000);
    }
  }, [socketUrl]);

  const handleNewMessage = React.useCallback((message: Data) => {

    setNewMessages(prev => {
      
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      
      const newMessages = [...prev, message];
      
      return newMessages;
    });

    messagesRef.current = [...messagesRef.current.filter(msg => msg.id !== message.id), message];

    if (currentChatRef.current !== message.waId && message.sender !== 'EXECUTIVE') {
      setUnreadCounts(prev => {
        const newCounts = new Map(prev);
        const currentCount = newCounts.get(message.waId) || 0;
        newCounts.set(message.waId, currentCount + 1);
        console.log('✅ Contador actualizado:', {
          waId: message.waId,
          previousCount: currentCount,
          newCount: currentCount + 1
        });
        return newCounts;
      });
    }
  }, []);

  React.useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
  }, [handleNewMessage]);

  const handleUnreadCountUpdate = React.useCallback((counts: UnreadCount[]) => {

    const countsMap = new Map<string, number>();
    let total = 0;

    counts.forEach(({ waId, count }) => {
      countsMap.set(waId, count);
      total += count;
    });

    setUnreadCounts(countsMap);
    setTotalUnreadCount(total);
  }, []);

  React.useEffect(() => {
    handleUnreadCountUpdateRef.current = handleUnreadCountUpdate;
  }, [handleUnreadCountUpdate]);

  const sendMessage = React.useCallback((waId: string, message: string, sessionId: string) => {
    socketService.sendMessage(waId, message, sessionId);
  }, []);

  const joinChat = React.useCallback((waId: string) => {
    
    if (currentChatRef.current && currentChatRef.current !== waId) {
      socketService.leaveChatRoom(currentChatRef.current);
    }

    socketService.joinChatRoom(waId);
    currentChatRef.current = waId;
    markAsRead(waId);
  }, []);

  const leaveChat = React.useCallback(() => {
    if (currentChatRef.current) {
      socketService.leaveChatRoom(currentChatRef.current);
      currentChatRef.current = null;
    }
  }, []);

  const markAsRead = React.useCallback((waId: string) => {
    socketService.markAsRead(waId);

    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      const count = newCounts.get(waId) || 0;
      
      newCounts.delete(waId);
      setTotalUnreadCount(current => {
        const newTotal = Math.max(0, current - count);
        return newTotal;
      });
      
      return newCounts;
    });
  }, []);

  const getMessagesForContact = React.useCallback((waId: string): Data[] => {
    return messagesRef.current.filter(msg => msg.waId === waId);
  }, []);

  const addUnreadCountsToContacts = React.useCallback((contacts: any[]): ContactWithUnread[] => {

    const result = contacts.map(contact => {
      const unreadCount = unreadCounts.get(contact.waId) || 0;
      return {
        ...contact,
        unreadCount
      };
    });
    return result;
  }, [unreadCounts]);

  const clearNewMessages = React.useCallback((waId?: string) => {
    if (waId) {

      setNewMessages(prev => prev.filter(msg => msg.waId !== waId));
    } else {

      setNewMessages([]);
    }
  }, []);


  const clearNewContacts = React.useCallback(() => {
    setNewContacts([]);
  }, []);

  const handleNewContact = React.useCallback((contact: any) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      if (!newCounts.has(contact.waId)) {
        newCounts.set(contact.waId, 1);
        setTotalUnreadCount(current => current + 1);
      }
      return newCounts;
    });
    
    setNewContacts(prev => {
      const exists = prev.some(c => c.waId === contact.waId || c.id === contact.id);
      if (exists) {
        return prev;
      }
      
      const newContacts = [...prev, contact];
      
      return newContacts;
    });
  }, []);

  useEffect(() => {

    const initializeSocket = async () => {
      try {
        
        socketService.onNewMessage((message: Data) => {
          
          if (handleNewMessageRef.current) {
            try {
              handleNewMessageRef.current(message);
            } catch (error) {
              console.error('Error ejecutando handleNewMessageRef.current:', error);
            }
          } else {
            console.error('handleNewMessageRef.current es null/undefined');
          }
        });
        
        socketService.onUnreadCountUpdate((counts: UnreadCount[]) => {
          
          if (handleUnreadCountUpdateRef.current) {
            try {
              handleUnreadCountUpdateRef.current(counts);
            } catch (error) {
              console.error('❌❌❌ Error ejecutando handleUnreadCountUpdateRef.current:', error);
            }
          } else {
            console.error('❌❌❌ handleUnreadCountUpdateRef.current es null/undefined');
          }
        });

        socketService.onNewContact((contact: any) => {
          handleNewContact(contact);
        });
        await connectSocket();
        
      } catch (error) {
        console.error('Error inicializando socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socketService.removeAllListeners();
      socketService.disconnect();
      initializationRef.current = false;
    };
  }, []);

  const reconnectWithExecutive = React.useCallback(async (executiveId: number) => {
    try {

      socketService.disconnect();
      setIsConnected(false);

      await socketService.connect(socketUrl, { executiveId });
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
  }, [socketUrl]);

  const value: SocketContextType = {
    isConnected,
    newMessages,
    unreadCounts,
    totalUnreadCount,
    newContacts,
    sendMessage,
    joinChat,
    leaveChat,
    markAsRead,
    getMessagesForContact,
    addUnreadCountsToContacts,
    clearNewMessages,
    clearNewContacts,
    reconnectWithExecutive,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketChat = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocketChat must be used within a SocketProvider');
  }

  return context;
};
