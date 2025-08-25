import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  InputAdornment,
  Button,
} from "@mui/material";
import { Send, AttachFile } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { colors } from "@/styles/colors";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { closeChat } from "@/api/chatService";
import { fetchSession } from "@/queries/session";

interface Contact {
  id: number;
  executiveId: number;
  waId: string;
  open: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  executive: Executive;
}

interface Executive {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

interface ApiMessage {
  id: number;
  waId: string;
  metaId: string;
  metaTimestamp: string;
  message: string;
  action: string;
  sender: "BOT" | "USER" | "EXECUTIVE";
  timestamp: string;
  sessionId: string;
  flowId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}

interface Message {
  id: string;
  text: string;
  sender: "customer" | "agent" | "bot";
  timestamp: string;
  isTransferred?: boolean;
  action?: string;
  sessionId?: string;
  isTransferNotification?: boolean;
}

interface ChatAreaProps {
  contact: Contact;
  messages: ApiMessage[] | Message[];
  onSendMessage: (message: string) => void;
  onContactClosed: (waId: string) => void;
}

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${colors.secondary.var80}`,
  backgroundColor: colors.secondary.var99,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflow: "auto",
  padding: "0",
  backgroundColor: colors.secondary.var95,
});

const MessagesContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minHeight: "100%",
  padding: "16px",
  backgroundRepeat: "repeat",
  backgroundSize: "200px",
  backgroundPosition: "left top",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url(/images/fondo-correos-chat.jpeg)",
    backgroundRepeat: "repeat",
    backgroundSize: "400px",
    backgroundPosition: "left top",
    backgroundAttachment: "fixed",
    opacity: 0.05,
    filter: "grayscale(100%)",
    zIndex: 0,
    PointerEvent: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
});

const MessageBubble = styled(Paper)<{
  isFromAgent?: boolean;
  isFromBot?: boolean;
}>(({ theme, isFromAgent, isFromBot }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  maxWidth: "70%",
  borderRadius: theme.spacing(2),
  backgroundColor: isFromAgent
    ? colors.primary.main
    : isFromBot
      ? colors.secondary.var90
      : colors.secondary.var99,
  color: isFromAgent
    ? "white"
    : isFromBot
      ? colors.secondary.var30
      : colors.secondary.var20,
  alignSelf: isFromAgent || isFromBot ? "flex-end" : "flex-start",
  marginLeft: isFromAgent || isFromBot ? "auto" : 0,
  marginRight: isFromAgent || isFromBot ? 0 : "auto",
}));

const TransferredMessage = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: colors.secondary.var50,
  fontSize: "0.875rem",
}));

const ChatInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(3),
    backgroundColor: colors.secondary.var99,
    "& fieldset": {
      borderColor: colors.secondary.var80,
    },
    "&:hover fieldset": {
      borderColor: colors.secondary.var60,
    },
    "&.Mui-focused fieldset": {
      borderColor: colors.primary.main,
    },
  },
}));

const ChatArea: React.FC<ChatAreaProps> = ({
  contact,
  messages,
  onSendMessage,
  onContactClosed,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(fetchSession());
  const closeChatMutation = useMutation({
    mutationFn: (waId: string) => closeChat(waId),
    onSuccess: (_, waId) => {
      queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });

      if (onContactClosed) {
        onContactClosed(waId);
      }
    },
    onError: (error) => {
      console.error("❌ Error cerrando chat:", error);
    },
  });

  const convertApiMessageToMessage = (apiMessage: ApiMessage): Message => {
    const timestampStr = apiMessage.metaTimestamp;
    let timestampMs: number;
    
    if (timestampStr.length <= 10) {
      timestampMs = parseInt(timestampStr) * 1000;
    } else {
      timestampMs = parseInt(timestampStr);
    }
    
    const date = new Date(timestampMs);

    const timeString = date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Santiago",
    });


    let sender: "customer" | "agent" | "bot";
    switch (apiMessage.sender) {
      case "USER":
        sender = "customer";
        break;
      case "EXECUTIVE":
        sender = "agent";
        break;
      case "BOT":
        sender = "bot";
        break;
      default:
        sender = "customer";
    }

    return {
      id: apiMessage.id.toString(),
      text: apiMessage.message,
      sender,
      timestamp: timeString,
      isTransferred: apiMessage.flowId === 114,
      action: apiMessage.action,
      sessionId: apiMessage.sessionId,
    };
  };

  const processedMessages: Message[] = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    let sortedMessages: Message[] = [];

    if (messages.length > 0 && "waId" in messages[0]) {
      sortedMessages = (messages as ApiMessage[])
        .map(convertApiMessageToMessage)
        .sort((a, b) => {
          const idA = parseInt(a.id);
          const idB = parseInt(b.id);
          return idA - idB;
        });
    } else {
      sortedMessages = (messages as Message[]).sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
    }

    const hasTransferredMessages = sortedMessages.some(
      (message) => message.isTransferred
    );

    if (hasTransferredMessages) {
      let lastBotMessageIndex = -1;
      for (let i = sortedMessages.length - 1; i >= 0; i--) {
        if (sortedMessages[i].sender === "bot") {
          lastBotMessageIndex = i;
          break;
        }
      }

      if (lastBotMessageIndex !== -1) {
        const transferMessage: Message = {
          id: `transfer-${Date.now()}`,
          text: "Transferido desde el bot",
          sender: "bot",
          timestamp: sortedMessages[lastBotMessageIndex].timestamp,
          isTransferred: true,
          isTransferNotification: true,
        };

        sortedMessages.splice(lastBotMessageIndex + 1, 0, transferMessage);
      }
    }
    return sortedMessages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [processedMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHeader>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            <Typography
              variant="h6"
              sx={{ color: colors.secondary.var20, fontWeight: 600 }}
            >
              +{contact.waId}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {
            contact.open && (
              <Button
                onClick={() => closeChatMutation.mutate(contact.waId)}
                disabled={closeChatMutation.isPending}
                size="small"
                sx={{
                  backgroundColor: colors.primary.main,
                  border: `1.5px solid ${colors.secondary.var80}`,
                  color: colors.secondary.var80,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.8,
                  fontSize: "0.875rem",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: colors.error.main,
                    color: "white",
                    boxShadow: "0 8px 25px rgba(211, 47, 47, 0.25)",
                    borderColor: colors.primary.main,
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "0 4px 15px rgba(211, 47, 47, 0.3)",
                  },
                  "&:disabled": {
                    backgroundColor: "transparent",
                    borderColor: colors.secondary.var70,
                    color: colors.secondary.var50,
                    transform: "none",
                    boxShadow: "none",
                    cursor: "not-allowed",
                  },
                }}
              >
                {closeChatMutation.isPending ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        border: `2px solid ${colors.secondary.var70}`,
                        borderTop: `2px solid ${colors.error.main}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />
                    Cerrando...
                  </Box>
                ) : (
                  "Finalizar conversación"
                )}
              </Button>
            )
          }
          
        </Box>
      </ChatHeader>
      <MessagesContainer>
        <MessagesContent>
          {processedMessages.map((message) => (
            <React.Fragment key={message.id}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {(message as any).isTransferNotification ? (
                  <TransferredMessage>
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: "italic",
                        color: colors.secondary.var40,
                        fontSize: "0.8rem",
                      }}
                    >
                      {message.text} • {message.timestamp}
                    </Typography>
                  </TransferredMessage>
                ) : (
                  <>
                    <MessageBubble
                      elevation={1}
                      isFromAgent={message.sender === "agent"}
                      isFromBot={message.sender === "bot"}
                    >
                      <Typography variant="body2">{message.text}</Typography>

                      {message.sender === "bot" &&
                        !(message as any).isTransferNotification && (
                          <Chip
                            label="Bot"
                            size="small"
                            sx={{
                              mt: 0.5,
                              height: 20,
                              fontSize: "0.65rem",
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
                        alignSelf:
                          message.sender === "agent" || message.sender === "bot"
                            ? "flex-end"
                            : "flex-start",
                        mt: 0.5,
                        mr: message.sender === "agent" ? 1 : 0,
                        ml:
                          message.sender === "customer" ||
                          message.sender === "bot"
                            ? 1
                            : 0,
                      }}
                    >
                      {message.timestamp}
                    </Typography>
                  </>
                )}
              </Box>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContent>
      </MessagesContainer>

      <Box sx={{ p: 2, backgroundColor: colors.secondary.var99 }}>
        {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Chip
            label="Seleccionar respuesta rápida"
            variant="outlined"
            size="small"
            sx={{
              borderColor: colors.secondary.var80,
              color: colors.secondary.var50,
              fontSize: "0.75rem",
            }}
          />
        </Box> */}

        <ChatInput
          fullWidth
          multiline
          maxRows={4}
          disabled={contact.open === false}
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            // startAdornment: (
            //   <InputAdornment position="start">
            //     <IconButton size="small" sx={{ color: colors.secondary.var50 }}>
            //       <AttachFile />
            //     </IconButton>
            //   </InputAdornment>
            // ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || contact.open === false}
                  sx={{
                    color: newMessage.trim()
                      ? colors.primary.main
                      : colors.secondary.var50,
                  }}
                >
                  <Send />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Typography variant="caption" sx={{ color: colors.secondary.var50 }}>
            Enviar
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatArea;
