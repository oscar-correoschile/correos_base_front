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
      console.error('❌ Error conectando socket:', error);
      console.error('🌐 URL que falló:', socketUrl);
      console.error('🕐 Timestamp del error:', new Date().toISOString());
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
    console.log('🎯🎯🎯 INICIO handleNewMessage - mensaje recibido:', {
      messageId: message.id,
      waId: message.waId,
      sender: message.sender,
      message: message.message?.slice(0, 50),
      timestamp: new Date().toISOString()
    });
    
    console.log('🚨🚨🚨 HANDLENEWEESSAGE EJECUTÁNDOSE - ESTO DEBE APARECER!!!');
    
    console.log('🚨 EVENTO SOCKET - MENSAJE RECIBIDO:', {
      id: message.id,
      waId: message.waId,
      sender: message.sender,
      message: message.message,
      timestamp: message.timestamp,
      timestampDetallado: new Date().toISOString(),
      currentChatRef: currentChatRef.current,
      esDelChatActual: currentChatRef.current === message.waId
    });

    console.log('🔄 Actualizando estado newMessages...');
    setNewMessages(prev => {
      console.log('📊 DENTRO DE SETNEWMESSAGES - Estado previo newMessages:', {
        length: prev.length,
        messages: prev.map(m => ({id: m.id, waId: m.waId}))
      });
      
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        console.log('⚠️ DUPLICADO - Mensaje duplicado detectado, no se agrega:', message.id);
        return prev;
      }
      
      const newMessages = [...prev, message];
      console.log('✅✅✅ SETNEWMESSAGES - AGREGANDO NUEVO MENSAJE AL ESTADO:', {
        messageId: message.id,
        previousCount: prev.length,
        newCount: newMessages.length,
        newMessagesArray: newMessages.map(m => ({id: m.id, waId: m.waId, message: m.message?.slice(0, 30)})),
        estadoCompleto: newMessages
      });
      
      setTimeout(() => {
        console.log('⏰ VERIFICACIÓN POST-SETSTATE:', {
          timestamp: new Date().toISOString(),
          debería_triggear_useEffect: true
        });
      }, 0);
      
      return newMessages;
    });

    console.log('🔄 Actualizando messagesRef...');
    messagesRef.current = [...messagesRef.current.filter(msg => msg.id !== message.id), message];
    console.log('📦 messagesRef actualizado:', {
      length: messagesRef.current.length,
      messages: messagesRef.current.map(m => ({id: m.id, waId: m.waId}))
    });

    if (currentChatRef.current !== message.waId && message.sender !== 'EXECUTIVE') {
      console.log('🔔 Actualizando contador de no leídos para:', message.waId);
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

    console.log('🎯🎯🎯 FIN handleNewMessage - procesamiento completo');
  }, []);

  React.useEffect(() => {
    console.log('🔄🔄🔄 ACTUALIZANDO REFERENCIA handleNewMessageRef:', {
      oldCallback: !!handleNewMessageRef.current,
      newCallback: !!handleNewMessage,
      timestamp: new Date().toISOString()
    });
    
    handleNewMessageRef.current = handleNewMessage;
    
    console.log('✅✅✅ Referencia handleNewMessageRef ACTUALIZADA:', {
      hasCallback: !!handleNewMessageRef.current,
      callbackString: handleNewMessageRef.current?.toString().slice(0, 100),
      timestamp: new Date().toISOString()
    });
  }, [handleNewMessage]);

  const handleUnreadCountUpdate = React.useCallback((counts: UnreadCount[]) => {
    console.log('🔄 Actualización de contadores no leídos:', counts);

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
    console.log('🔄🔄🔄 ACTUALIZANDO REFERENCIA handleUnreadCountUpdateRef:', {
      oldCallback: !!handleUnreadCountUpdateRef.current,
      newCallback: !!handleUnreadCountUpdate,
      timestamp: new Date().toISOString()
    });
    
    handleUnreadCountUpdateRef.current = handleUnreadCountUpdate;
    
    console.log('✅✅✅ Referencia handleUnreadCountUpdateRef ACTUALIZADA:', {
      hasCallback: !!handleUnreadCountUpdateRef.current,
      timestamp: new Date().toISOString()
    });
  }, [handleUnreadCountUpdate]);

  const sendMessage = React.useCallback((waId: string, message: string, sessionId: string) => {
    socketService.sendMessage(waId, message, sessionId);
  }, []);

  const joinChat = React.useCallback((waId: string) => {
    console.log('🏠 CONTEXTO: Unirse a chat:', {
      waId,
      currentChat: currentChatRef.current,
      timestamp: new Date().toISOString()
    });
    
    if (currentChatRef.current && currentChatRef.current !== waId) {
      console.log('🚪 CONTEXTO: Saliendo del chat anterior:', currentChatRef.current);
      socketService.leaveChatRoom(currentChatRef.current);
    }

    socketService.joinChatRoom(waId);
    currentChatRef.current = waId;
    markAsRead(waId);
    
    console.log('✅ CONTEXTO: Chat actual establecido:', waId);
  }, []);

  const leaveChat = React.useCallback(() => {
    if (currentChatRef.current) {
      socketService.leaveChatRoom(currentChatRef.current);
      currentChatRef.current = null;
    }
  }, []);

  const markAsRead = React.useCallback((waId: string) => {
    console.log('👀 MARK AS READ ejecutado para:', waId);
    socketService.markAsRead(waId);

    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      const count = newCounts.get(waId) || 0;
      console.log('🔄 Eliminando contador de mensajes no leídos:', {
        waId,
        countToRemove: count,
        hadCount: prev.has(waId)
      });
      
      newCounts.delete(waId);
      setTotalUnreadCount(current => {
        const newTotal = Math.max(0, current - count);
        console.log('📊 Actualizando total unread count:', {
          previous: current,
          removedCount: count,
          newTotal
        });
        return newTotal;
      });
      
      return newCounts;
    });
  }, []);

  const getMessagesForContact = React.useCallback((waId: string): Data[] => {
    return messagesRef.current.filter(msg => msg.waId === waId);
  }, []);

  const addUnreadCountsToContacts = React.useCallback((contacts: any[]): ContactWithUnread[] => {
    console.log('📊 AGREGANDO UNREAD COUNTS A CONTACTOS:', {
      totalContacts: contacts.length,
      unreadCountsMap: Object.fromEntries(unreadCounts.entries()),
      unreadCountsSize: unreadCounts.size
    });

    const result = contacts.map(contact => {
      const unreadCount = unreadCounts.get(contact.waId) || 0;
      console.log(`👤 Contacto ${contact.waId}: ${unreadCount} mensajes no leídos (mapeando para UI)`);
      return {
        ...contact,
        unreadCount
      };
    });

    const contactsWithUnread = result.filter(c => c.unreadCount > 0);
    console.log('🎯 CONTACTOS CON MENSAJES NO LEÍDOS PARA BADGES:', {
      totalContactos: result.length,
      contactosConUnread: contactsWithUnread.length,
      contactosConBadge: contactsWithUnread.map(c => ({
        waId: c.waId,
        unreadCount: c.unreadCount
      }))
    });

    return result;
  }, [unreadCounts]);

  const clearNewMessages = React.useCallback((waId?: string) => {
    if (waId) {

      setNewMessages(prev => prev.filter(msg => msg.waId !== waId));
      console.log('🧹 Limpiados mensajes nuevos para:', waId);
    } else {

      setNewMessages([]);
      console.log('🧹 Limpiados todos los mensajes nuevos');
    }
  }, []);


  const clearNewContacts = React.useCallback(() => {
    setNewContacts([]);
    console.log('🧹 Limpiados todos los contactos nuevos');
  }, []);

  const handleNewContact = React.useCallback((contact: any) => {
    console.log('👤 NUEVO CONTACTO RECIBIDO EN CONTEXTO:', contact);
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      if (!newCounts.has(contact.waId)) {
        console.log('🔔 Inicializando unreadCount para nuevo contacto:', contact.waId);
        newCounts.set(contact.waId, 1);
        setTotalUnreadCount(current => current + 1);
      }
      return newCounts;
    });
    
    setNewContacts(prev => {
      const exists = prev.some(c => c.waId === contact.waId || c.id === contact.id);
      if (exists) {
        console.log('⚠️ Contacto duplicado detectado:', contact.waId || contact.id);
        return prev;
      }
      
      const newContacts = [...prev, contact];
      console.log('✅ Agregando nuevo contacto al estado:', {
        contactId: contact.id || contact.waId,
        totalContacts: newContacts.length,
        contact: contact
      });
      
      return newContacts;
    });
  }, []);

  useEffect(() => {
    console.log('🔄 Inicializando SocketProvider...');

    const initializeSocket = async () => {
      try {
        console.log('🎧 Configurando listeners ANTES de conectar...');
        
        socketService.onNewMessage((message: Data) => {
          console.log('🔥🔥🔥 WRAPPER: Llamando handleNewMessageRef.current:', {
            messageId: message.id,
            waId: message.waId,
            hasCallback: !!handleNewMessageRef.current,
            timestamp: new Date().toISOString()
          });
          
          if (handleNewMessageRef.current) {
            try {
              handleNewMessageRef.current(message);
              console.log('✅✅✅ handleNewMessageRef.current ejecutado exitosamente');
            } catch (error) {
              console.error('❌❌❌ Error ejecutando handleNewMessageRef.current:', error);
            }
          } else {
            console.error('❌❌❌ handleNewMessageRef.current es null/undefined');
          }
        });
        
        socketService.onUnreadCountUpdate((counts: UnreadCount[]) => {
          console.log('🔄🔄🔄 WRAPPER: Llamando handleUnreadCountUpdateRef.current:', {
            countsLength: counts.length,
            hasCallback: !!handleUnreadCountUpdateRef.current,
            timestamp: new Date().toISOString()
          });
          
          if (handleUnreadCountUpdateRef.current) {
            try {
              handleUnreadCountUpdateRef.current(counts);
              console.log('✅✅✅ handleUnreadCountUpdateRef.current ejecutado exitosamente');
            } catch (error) {
              console.error('❌❌❌ Error ejecutando handleUnreadCountUpdateRef.current:', error);
            }
          } else {
            console.error('❌❌❌ handleUnreadCountUpdateRef.current es null/undefined');
          }
        });

        socketService.onNewContact((contact: any) => {
          console.log('👤👤👤 WRAPPER: Nuevo contacto recibido:', contact);
          handleNewContact(contact);
        });
        
        console.log('✅ Listeners configurados - ahora conectando socket...');
        
        await connectSocket();
        
        console.log('✅ Socket conectado - listeners ya están activos');

        setTimeout(() => {
          console.log('🧪 TEST POST-CONEXIÓN:', {
            socketConnected: socketService.isSocketConnected(),
            hasHandleNewMessageRef: !!handleNewMessageRef.current,
            hasHandleUnreadCountRef: !!handleUnreadCountUpdateRef.current,
            timestamp: new Date().toISOString()
          });

          console.log('🔍 Ejecutando debug de listeners...');
          (socketService as any).debugListeners();

          console.log('🧪 Ejecutando test de callback en 3 segundos...');
          setTimeout(() => {
            console.log('🧪 INICIANDO TEST DE CALLBACK...');
            (socketService as any).testCallback();
          }, 3000);
          
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error inicializando socket:', error);
      }
    };

    initializeSocket();

    return () => {
      console.log('🧹 Limpiando SocketProvider...');

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socketService.removeAllListeners();
      socketService.disconnect();
      initializationRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (newContacts.length > 0) {
      console.log('👤 NUEVOS CONTACTOS DETECTADOS:', {
        count: newContacts.length,
        contacts: newContacts,
        timestamp: new Date().toISOString()
      });
    }
  }, [newContacts]);

  const reconnectWithExecutive = React.useCallback(async (executiveId: number) => {
    console.log('🔄 Reconectando socket con executiveId:', executiveId);
    try {

      socketService.disconnect();
      setIsConnected(false);

      await socketService.connect(socketUrl, { executiveId });
      setIsConnected(true);
      
      console.log('✅ Socket reconectado exitosamente con executiveId:', executiveId);
    } catch (error) {
      console.error('❌ Error reconectando socket con executiveId:', error);
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
