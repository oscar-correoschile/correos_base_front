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
      console.log('✅ Socket ya está conectado, reutilizando conexión');
      return Promise.resolve();
    }

    if (this.socket) {
      console.log('🔄 Desconectando socket anterior...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`🔄 Intentando conectar a: ${url}`);
        console.log(`👤 Con executiveId: ${options?.executiveId}`);
        console.log(`🕐 Timestamp de conexión: ${new Date().toISOString()}`);

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
          console.log('🔑 Enviando userId en query:', options.executiveId.toString());
        }

        this.socket = io(url, socketOptions);

        this.socket.on('connect', () => {
          console.log('✅✅✅ CONECTADO AL SERVIDOR DE SOCKETS');
          console.log('🔗 Socket ID:', this.socket?.id);
          console.log('🌐 Socket URL:', url);
          console.log('🕐 Timestamp conexión:', new Date().toISOString());

          this.socket?.onAny((eventName, ...args) => {
            console.log('🌟 EVENTO RECIBIDO:', {
              evento: eventName,
              argumentos: args,
              timestamp: new Date().toISOString()
            });

            if (eventName.toLowerCase().includes('contact') || 
                eventName.toLowerCase().includes('new_contact') || 
                eventName.toLowerCase().includes('newContact')) {
              console.log('👤 EVENTO DE CONTACTO DETECTADO:', {
                evento: eventName,
                data: args,
                timestamp: new Date().toISOString()
              });
            }
          });

          console.log('🔄🔄🔄 Llamando setupStoredListeners después de conectar...');
          this.setupStoredListeners();
          console.log('✅✅✅ setupStoredListeners completado');
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Desconectado del servidor de sockets:', reason);
          console.log('🕐 Timestamp desconexión:', new Date().toISOString());
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error);
          console.error('🔢 Intento número:', this.reconnectAttempts + 1);
          console.error('🌐 URL intentada:', url);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('💀 Máximo de intentos alcanzado, abandonando conexión');
            this.connectionPromise = null;
            reject(error);
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
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
    console.log('🔌 Desconectando socket...');
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
    console.log('🎧🎧🎧 SETUP STORED LISTENERS - INICIANDO:', {
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      hasMessageCallback: !!this.messageCallback,
      hasUnreadCallback: !!this.unreadCallback,
      timestamp: new Date().toISOString()
    });
    
    if (this.messageCallback) {
      console.log('🎧🎧🎧 Reconfigurando listener de mensajes...');
      console.log('Estado antes de reconfigurar:', {
        socketConnected: this.socket?.connected,
        existingListeners: this.socket?.listeners('newMessage').length || 0
      });
      
      this.onNewMessage(this.messageCallback);
      
      console.log('Estado después de reconfigurar:', {
        socketConnected: this.socket?.connected,
        newListeners: this.socket?.listeners('newMessage').length || 0
      });
    } else {
      console.log('⚠️⚠️⚠️ No hay messageCallback para reconfigurar');
    }
    
    if (this.unreadCallback) {
      console.log('🎧 Reconfigurando listener de contadores...');
      this.onUnreadCountUpdate(this.unreadCallback);
    } else {
      console.log('⚠️ No hay unreadCallback para reconfigurar');
    }
    
    if (this.newContactCallback) {
      console.log('👤 Reconfigurando listener de nuevos contactos...');
      this.onNewContact(this.newContactCallback);
    } else {
      console.log('⚠️ No hay newContactCallback para reconfigurar');
    }
    
    console.log('✅✅✅ SETUP STORED LISTENERS - COMPLETADO');

    setTimeout(() => {
      console.log('🔍🔍🔍 VERIFICACIÓN FINAL DE LISTENERS:', {
        newMessageListeners: this.socket?.listeners('newMessage').length || 0,
        socketConnected: this.socket?.connected,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }

  onNewMessage(callback: (message: Data) => void) {
    console.log('🎧🎧🎧 CONFIGURANDO LISTENER para newMessage (camelCase):', {
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      callbackType: typeof callback,
      timestamp: new Date().toISOString()
    });

    this.messageCallback = callback;
    console.log('💾💾💾 Callback guardado en messageCallback:', {
      hasCallback: !!this.messageCallback,
      callbackType: typeof this.messageCallback
    });

    if (this.socket && this.socket.connected) {
      console.log('✅ Socket conectado - configurando listener inmediatamente');
      this.socket.off('newMessage');
      console.log('🧹 Listener anterior removido');
      
      this.socket.on('newMessage', (message: BackendSocketMessage) => {

        console.log('🔄🔄🔄 Ejecutando callback del listener...', message);
        try {
          console.log('🎯🎯🎯 Antes de ejecutar callback:', {
            callbackFunction: callback.toString().slice(0, 100),
            messageData: message
          });
          
          callback(message.data);
          
          console.log('✅✅✅ Callback ejecutado exitosamente - verificando resultado');
        } catch (error) {
          console.error('❌❌❌ Error ejecutando callback:', error);
          console.error('🔍 Stack trace:', error instanceof Error ? error.stack : String(error));
        }
      });
      
      console.log('✅✅✅ Listener newMessage configurado exitosamente');

      console.log('🔍 Listeners registrados en socket:', this.socket.listeners('newMessage').length);
      
    } else {
      console.log('⚠️⚠️⚠️ Socket no conectado - listener será configurado cuando se conecte');
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
    console.log('🔔 Disparando manualmente unread count update:', unreadCounts);
    if (this.unreadCallback) {
      this.unreadCallback(unreadCounts);
    } else {
      console.warn('⚠️ No hay callback configurado para unread counts');
    }
  }

  onNewContact(callback: (contact: any) => void) {
    console.log('👤 CONFIGURANDO LISTENER para nuevos contactos:', {
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      timestamp: new Date().toISOString()
    });

    this.newContactCallback = callback;
    
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket conectado - configurando listener de contactos');

      const contactEvents = ['newContact', 'new_contact', 'contact_created', 'contactCreated'];
      
      contactEvents.forEach(eventName => {
        this.socket!.off(eventName);
        this.socket!.on(eventName, (contactData: any) => {
          console.log(`👤 NUEVO CONTACTO RECIBIDO (${eventName}):`, contactData);
          try {
            callback(contactData);
            console.log('✅ Callback de nuevo contacto ejecutado exitosamente');
          } catch (error) {
            console.error('❌ Error ejecutando callback de nuevo contacto:', error);
          }
        });
        console.log(`✅ Listener configurado para evento: ${eventName}`);
      });
      
    } else {
      console.log('⚠️ Socket no conectado - listener de contactos será configurado cuando se conecte');
    }
  }

  markAsRead(waId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', { waId });
    }
  }

  sendMessage(waId: string, message: string, sessionId: string) {
    if (this.socket && this.isConnected) {
      console.log('📤 ENVIANDO MENSAJE VIA SOCKET:', {
        waId,
        message: message.slice(0, 50) + '...',
        sessionId,
        sender: 'EXECUTIVE',
        socketId: this.socket.id,
        timestamp: new Date().toISOString()
      });
      
      this.socket.emit('send_message', {
        waId,
        message,
        sessionId,
        sender: 'EXECUTIVE'
      });
    } else {
      console.error('❌ No se puede enviar mensaje - socket no conectado:', {
        waId,
        socketExists: !!this.socket,
        isConnected: this.isConnected
      });
    }
  }

  joinChatRoom(waId: string) {
    if (this.socket && this.isConnected) {
      console.log('🏠 UNIRSE A ROOM:', {
        waId: waId,
        socketId: this.socket.id,
        timestamp: new Date().toISOString()
      });
      this.socket.emit('join_chat', { waId });

      this.socket.once('joined_chat', (data) => {
        console.log('✅ CONFIRMACIÓN DE ROOM:', data);
      });
    } else {
      console.error('❌ No se puede unir a room - socket no conectado:', {
        waId,
        socketExists: !!this.socket,
        isConnected: this.isConnected
      });
    }
  }

  leaveChatRoom(waId: string) {
    if (this.socket && this.isConnected) {
      console.log('🚪 SALIR DE ROOM:', {
        waId: waId,
        socketId: this.socket.id,
        timestamp: new Date().toISOString()
      });
      this.socket.emit('leave_chat', { waId });
    }
  }

  isSocketConnected(): boolean {
    const connected = this.isConnected && this.socket?.connected === true;
    console.log('🔍 Estado de conexión verificado:', {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      finalResult: connected,
      timestamp: new Date().toISOString()
    });
    return connected;
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

}

export const socketService = new SocketService();
export default socketService;
