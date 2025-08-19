import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Send, MoreVert, Phone, AttachFile } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { colors } from '@/styles/colors';

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  status: 'online' | 'away' | 'offline';
  priority: 'alta' | 'media' | 'baja';
  unreadCount?: number;
  avatar?: string;
}

// ✅ Nueva interfaz basada en los datos del API
interface ApiMessage {
  id: number;
  waId: string;
  metaId: string;
  metaTimestamp: string;
  message: string;
  action: string;
  sender: 'BOT' | 'USER' | 'EXECUTIVE';
  timestamp: string;
  sessionId: string;
  flowId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}

// ✅ Interfaz adaptada para el componente
interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'agent' | 'bot';
  timestamp: string;
  isTransferred?: boolean;
  action?: string;
  sessionId?: string;
}

interface ChatAreaProps {
  contact: Contact;
  messages: ApiMessage[] | Message[]; // Acepta ambos tipos
  onSendMessage: (message: string) => void;
}

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${colors.secondary.var80}`,
  backgroundColor: colors.secondary.var99,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: '0',
  backgroundColor: colors.secondary.var95,
});

const MessagesContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minHeight: '100%',
  padding: '16px',
  // backgroundImage: 'url(/images/fondo-correos-chat.jpeg)',
  backgroundRepeat: 'repeat',
  backgroundSize: '200px',
  backgroundPosition: 'left top',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url(/images/fondo-correos-chat.jpeg)',
    backgroundRepeat: 'repeat',
    backgroundSize: '400px',
    backgroundPosition: 'left top',
    backgroundAttachment: 'fixed',
    opacity: 0.05,
    filter: 'grayscale(100%)',
    zIndex: 0,
    PointerEvent: 'none'
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
});

const MessageBubble = styled(Paper)<{ isFromAgent?: boolean; isFromBot?: boolean }>(({ theme, isFromAgent, isFromBot }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  borderRadius: theme.spacing(2),
  backgroundColor: isFromAgent 
    ? colors.primary.main 
    : isFromBot 
    ? colors.secondary.var90 
    : colors.secondary.var99,
  color: isFromAgent 
    ? 'white' 
    : isFromBot 
    ? colors.secondary.var30 
    : colors.secondary.var20,
  alignSelf: isFromAgent ? 'flex-end' : 'flex-start',
  marginLeft: isFromAgent ? 'auto' : 0,
  marginRight: isFromAgent ? 0 : 'auto',
}));

const TransferredMessage = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: colors.secondary.var50,
  fontSize: '0.875rem',
}));

const ChatInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: colors.secondary.var99,
    '& fieldset': {
      borderColor: colors.secondary.var80,
    },
    '&:hover fieldset': {
      borderColor: colors.secondary.var60,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.main,
    },
  },
}));

const ChatArea: React.FC<ChatAreaProps> = ({ contact, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // ✅ Función para convertir mensajes del API al formato del componente
 const convertApiMessageToMessage = (apiMessage: ApiMessage): Message => {
    // ✅ CORRECCIÓN: metaTimestamp está en segundos, necesitamos convertir a milisegundos
    const timestampMs = parseInt(apiMessage.metaTimestamp) * 1000;
    const date = new Date(timestampMs);
    
    console.log({
      metaTimestamp: apiMessage.metaTimestamp,
      timestampMs,
      date,
      apiMessage
    });
    
    const timeString = date.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago' // ✅ Agregar zona horaria de Chile
    });

    let sender: 'customer' | 'agent' | 'bot';
    switch (apiMessage.sender) {
      case 'USER':
        sender = 'customer';
        break;
      case 'EXECUTIVE':
        sender = 'agent';
        break;
      case 'BOT':
        sender = 'bot';
        break;
      default:
        sender = 'customer';
    }

    return {
      id: apiMessage.id.toString(),
      text: apiMessage.message,
      sender,
      timestamp: timeString,
      isTransferred: apiMessage.flowId === 114, // 114 parece ser el flowId de transferencia
      action: apiMessage.action,
      sessionId: apiMessage.sessionId,
    };
  };

  // ✅ Procesar mensajes - convertir si son del API o usar directamente si ya están convertidos
  const processedMessages: Message[] = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    let sortedMessages: Message[] = [];

    // Verificar si son mensajes del API (tienen la propiedad waId)
    if (messages.length > 0 && 'waId' in messages[0]) {
      sortedMessages = (messages as ApiMessage[])
        .map(convertApiMessageToMessage)
        .sort((a, b) => {
          // Usar el ID para ordenar (IDs más bajos = más antiguos, IDs más altos = más recientes)
          const idA = parseInt(a.id);
          const idB = parseInt(b.id);
          return idA - idB; // Orden ascendente: más antiguos primero, más recientes al final
        });
    } else {
      // Si ya son mensajes del componente, usarlos directamente ordenados
      sortedMessages = (messages as Message[]).sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return sortedMessages;
  }, [messages]);

  // ✅ Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [processedMessages]); // Se ejecuta cada vez que cambian los mensajes

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      // Scroll al final después de enviar un mensaje
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // const getInitials = (name: string) => {
  //   return name.split(' ').map(n => n[0]).join('').toUpperCase();
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return colors.success.main;
      case 'away': return colors.warning.main;
      default: return colors.secondary.var60;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      default: return 'Desconectado';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header del chat */}
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: colors.secondary.var80,
              color: colors.secondary.var30,
              width: 40,
              height: 40,
            }}
          >
            {/* {getInitials(contact.name)} */}
          </Avatar>
          
          <Box>
            <Typography variant="h6" sx={{ color: colors.secondary.var20, fontWeight: 600 }}>
              {contact.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(contact.status),
                }}
              />
              <Typography variant="body2" sx={{ color: colors.secondary.var50 }}>
                {getStatusText(contact.status)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: colors.secondary.var50 }}>
            +52 123 455 7890
          </Typography>
          {/* <IconButton size="small" sx={{ color: colors.secondary.var50 }}>
            <Phone />
          </IconButton> */}
          <IconButton size="small" sx={{ color: colors.secondary.var50 }}>
            <MoreVert />
          </IconButton>
        </Box>
      </ChatHeader>

      {/* Área de mensajes */}
      <MessagesContainer>
        <MessagesContent>
          {processedMessages.map((message) => (
            <React.Fragment key={message.id}>
              {message.isTransferred && (
                <TransferredMessage>
                  <Typography variant="body2">
                    Transferido desde el bot • {message.timestamp}
                  </Typography>
                </TransferredMessage>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <MessageBubble 
                  elevation={1}
                  isFromAgent={message.sender === 'agent'}
                  isFromBot={message.sender === 'bot'}
                >
                  <Typography variant="body2">
                    {message.text}
                  </Typography>
                  
                  {/* ✅ Mostrar indicador para mensajes de bot */}
                  {message.sender === 'bot' && (
                    <Chip 
                      label="Bot" 
                      size="small" 
                      sx={{ 
                        mt: 0.5,
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor: colors.secondary.var90,
                        color: colors.secondary.var40,
                      }} 
                    />
                  )}
                </MessageBubble>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: colors.secondary.var50,
                    alignSelf: message.sender === 'agent' ? 'flex-end' : 'flex-start',
                    mt: 0.5,
                    mr: message.sender === 'agent' ? 1 : 0,
                    ml: message.sender === 'customer' || message.sender === 'bot' ? 1 : 0,
                  }}
                >
                  {message.timestamp}
                </Typography>
              </Box>
            </React.Fragment>
          ))}
          {/* ✅ Elemento para hacer scroll automático al final */}
          <div ref={messagesEndRef} />
        </MessagesContent>
        
      </MessagesContainer>

      {/* Área de entrada de texto */}
      <Box sx={{ p: 2, backgroundColor: colors.secondary.var99 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip 
            label="Seleccionar respuesta rápida" 
            variant="outlined" 
            size="small"
            sx={{ 
              borderColor: colors.secondary.var80,
              color: colors.secondary.var50,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        
        <ChatInput
          fullWidth
          multiline
          maxRows={4}
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton size="small" sx={{ color: colors.secondary.var50 }}>
                  <AttachFile />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  sx={{ 
                    color: newMessage.trim() ? colors.primary.main : colors.secondary.var50,
                  }}
                >
                  <Send />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Typography variant="caption" sx={{ color: colors.secondary.var50 }}>
            Enviar
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatArea;
