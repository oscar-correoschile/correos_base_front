import { io, Socket } from 'socket.io-client';

export interface SocketMessage {
  id: number;
  waId: string;
  message: string;
  sender: 'BOT' | 'USER' | 'EXECUTIVE';
  timestamp: string;
  sessionId: string;
  isRead?: boolean;
  data: Data;
}

export interface BackendSocketMessage {
  type: string;
  data: Data;
  timestamp: string;
}
export interface Message {
    type:      string;
    data:      Data;
    timestamp: Date;
}

export interface Data {
    waId:          string;
    metaId:        string;
    metaTimestamp: string;
    message:       string;
    action:        string;
    sender:        string;
    sessionId:     string;
    flowId:        number;
    createdAt:     string;
    updatedAt:     string;
    id:            number;
    timestamp:     string;
    deletedAt:     null;
}


export interface UnreadCount {
  waId: string;
  count: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageCallback: ((message: Data) => void) | null = null;
  private unreadCallback: ((data: UnreadCount[]) => void) | null = null;
  private newContactCallback: ((contact: any) => void) | null = null;

  connect(url: string =  import.meta.env.VITE_API_WHATSAPP_URL || 'http://localhost:3000', options?: { executiveId?: number }): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const socketOptions: any = {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 5000,
        };

        if (options?.executiveId) {
          socketOptions.query = {
            userId: options.executiveId.toString()
          };
        }

        this.socket = io(url, socketOptions);

        this.socket.on('connect', () => {
          this.setupStoredListeners();
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Desconectado del servidor de sockets:', reason);
          console.log('Timestamp desconexión:', new Date().toISOString());
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Error de conexión:', error);
          console.error('Intento número:', this.reconnectAttempts + 1);
          console.error('URL intentada:', url);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionPromise = null;
            reject(error);
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`Reconectado después de ${attemptNumber} intentos`);
          this.isConnected = true;
        });

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  private setupStoredListeners() {
    
    if (this.messageCallback) {
      
      this.onNewMessage(this.messageCallback);
    } else {
      console.log('No hay messageCallback para reconfigurar');
    }
    
    if (this.unreadCallback) {
      this.onUnreadCountUpdate(this.unreadCallback);
    } else {
      console.log('⚠️ No hay unreadCallback para reconfigurar');
    }
    
    if (this.newContactCallback) {
      this.onNewContact(this.newContactCallback);
    } else {
      console.log('⚠️ No hay newContactCallback para reconfigurar');
    }
  }

  onNewMessage(callback: (message: Data) => void) {

    this.messageCallback = callback;

    if (this.socket && this.socket.connected) {
      this.socket.off('newMessage');
      
      this.socket.on('newMessage', (message: BackendSocketMessage) => {

        try {
          callback(message.data);
        } catch (error) {
          console.error('🔍 Stack trace:', error instanceof Error ? error.stack : String(error));
        }
      });
      
    } else {
      console.log('Socket no conectado - listener será configurado cuando se conecte');
      console.log('Socket exists:', !!this.socket);
      console.log('Socket connected:', this.socket?.connected);
    }
  }

  onUnreadCountUpdate(callback: (data: UnreadCount[]) => void) {

    this.unreadCallback = callback;
    
    if (this.socket) {
      this.socket.off('unread_count_update');
      this.socket.on('unread_count_update', callback);
    }
  }

  triggerUnreadCountUpdate(unreadCounts: UnreadCount[]) {
    if (this.unreadCallback) {
      this.unreadCallback(unreadCounts);
    } else {
      console.warn('⚠️ No hay callback configurado para unread counts');
    }
  }

  onNewContact(callback: (contact: any) => void) {

    this.newContactCallback = callback;
    
    if (this.socket && this.socket.connected) {

      const contactEvents = ['newContact', 'new_contact', 'contact_created', 'contactCreated'];
      
      contactEvents.forEach(eventName => {
        this.socket!.off(eventName);
        this.socket!.on(eventName, (contactData: any) => {
          try {
            callback(contactData);
          } catch (error) {
            console.error('Error ejecutando callback de nuevo contacto:', error);
          }
        });
      });
      
    } else {
      console.log('Socket no conectado - listener de contactos será configurado cuando se conecte');
    }
  }

  markAsRead(waId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', { waId });
    }
  }

  sendMessage(waId: string, message: string, sessionId: string) {
    if (this.socket && this.isConnected) {
      
      this.socket.emit('send_message', {
        waId,
        message,
        sessionId,
        sender: 'EXECUTIVE'
      });
    } else {
      console.error('No se puede enviar mensaje - socket no conectado:', {
        waId,
        socketExists: !!this.socket,
        isConnected: this.isConnected
      });
    }
  }

  joinChatRoom(waId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { waId });
    } else {
      console.error(' No se puede unir a room - socket no conectado:', {
        waId,
        socketExists: !!this.socket,
        isConnected: this.isConnected
      });
    }
  }

  leaveChatRoom(waId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { waId });
    }
  }

  isSocketConnected(): boolean {
    const connected = this.isConnected && this.socket?.connected === true;
    return connected;
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  debugListeners() {
    if (this.socket) {
      console.log('🔍 Debug listeners - Socket events:', this.socket.listeners);
      console.log('🔍 Debug listeners - Socket connected:', this.socket.connected);
      console.log('🔍 Debug listeners - Socket id:', this.socket.id);
    } else {
      console.log('🔍 Debug listeners - No socket available');
    }
  }

}

export const socketService = new SocketService();
export default socketService;
