import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { colors } from "@/styles/colors";
import ContactList from "@/components/dashboard/chat/ContactList";
import ChatArea from "@/components/dashboard/chat/ChatArea";
// import CustomerInfo from '@/components/dashboard/chat/CustomerInfo';
import { getClosedChats, getMessages, getOpenContacts, getWaitingChats, sendMessage, takeChats } from "@/api/chatService";
import {
  useQuery,
  useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchSession } from "@/queries/session";
import { useSocketChat, type ContactWithUnread } from "@/hooks/useSocketChat";
import { socketService } from "@/api/socketService";

interface Contact2 {
  id: number;
  executiveId: number;
  waId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  open: boolean;
  activo: boolean;
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

const DashboardContainer = styled(Box)(({ theme }) => ({
  height: "calc(100vh - 140px)",
  backgroundColor: colors.secondary.var95,
  padding: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(2),
}));

const SidebarContainer = styled(Paper)(({ theme }) => ({
  width: 320,
  backgroundColor: colors.secondary.var99,
  borderRadius: theme.spacing(1),
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${colors.secondary.var80}`,
}));

const MainChatContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  backgroundColor: colors.secondary.var99,
  borderRadius: theme.spacing(1),
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${colors.secondary.var80}`,
}));

const CustomerInfoContainer = styled(Paper)(({ theme }) => ({
  width: 300,
  backgroundColor: colors.secondary.var99,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  border: `1px solid ${colors.secondary.var80}`,
}));

const Dashboard: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact2 | null>(null);
  const [activeTab, setActiveTab] = useState<"abierto" | "espera" | "cerrado">(
    "abierto"
  );
  const { data: session } = useSuspenseQuery(fetchSession());
  const queryClient = useQueryClient();

  // ✅ Función para manejar cambio de tab y deseleccionar contacto en "espera"
  const handleTabChange = (newTab: "abierto" | "espera" | "cerrado") => {
    setActiveTab(newTab);
    // Si cambiamos a "espera", deseleccionar cualquier contacto seleccionado
    if (newTab === 'espera') {
      setSelectedContact(null);
    }
  };

  // ✅ Socket connection para chat en tiempo real
  const {
    isConnected,
    totalUnreadCount,
    unreadCounts, // ✅ Agregar unreadCounts
    newMessages, // ✅ Mensajes nuevos del socket
    newContacts, // ✅ Nuevos contactos del socket
    sendMessage: socketSendMessage,
    joinChat,
    leaveChat,
    markAsRead,
    addUnreadCountsToContacts,
    clearNewMessages, // ✅ Para limpiar mensajes procesados
    clearNewContacts, // ✅ Para limpiar contactos procesados
    reconnectWithExecutive, // ✅ Para reconectar con executiveId
  } = useSocketChat();

  // ✅ Reconectar socket con executiveId cuando tengamos la sesión
  useEffect(() => {
    if (session?.executive?.id && !isConnected) {
      reconnectWithExecutive(session.executive.id);
    }
  }, [session?.executive?.id, isConnected, reconnectWithExecutive]);

  const { data: contactsData } = useQuery<Contact2[], Error>({
    queryKey: ["contacts", session?.executive?.id],
    queryFn: async () => {
      const contacts = await getOpenContacts(session.executive.id);
      return contacts;
    },
    enabled: !!session?.executive?.id,
    staleTime: 1000 * 60 * 15, // ✅ 15 minutos - contactos no cambian tan seguido
    gcTime: 1000 * 60 * 60, // ✅ 1 hora en cache
    refetchOnWindowFocus: false, // ✅ No refetch al cambiar de ventana
    refetchOnMount: false, // ✅ No refetch al montar si hay cache
    refetchInterval: 1000 * 60 * 5, // ✅ Refetch automático cada 5 minutos para mantener sincronizado
  });

  const { data: closedContactsData } = useQuery<Contact2[], Error>({
    queryKey: ["closedContacts", session?.executive?.id],
    queryFn: async () => {
      const contacts = await getClosedChats();
      return contacts;
    },
    enabled: !!session?.executive?.id,
    staleTime: 1000 * 60 * 15, // ✅ 15 minutos - contactos no cambian tan seguido
    gcTime: 1000 * 60 * 60, // ✅ 1 hora en cache
    refetchOnWindowFocus: false, // ✅ No refetch al cambiar de ventana
    refetchOnMount: false, // ✅ No refetch al montar si hay cache
    refetchInterval: 1000 * 60 * 5, // ✅ Refetch automático cada 5 minutos para mantener sincronizado
  });

  const { data: waitingContactsData } = useQuery<Contact2[], Error>({
    queryKey: ["waitingContacts", session?.executive?.id],
    queryFn: async () => {
      const contacts = await getWaitingChats();
      return contacts;
    },
    enabled: !!session?.executive?.id,
    staleTime: 1000 * 30, // ✅ Reducir stale time a 30 segundos para contactos en espera
    gcTime: 1000 * 60 * 30, // ✅ 30 minutos en cache
    refetchOnWindowFocus: true, // ✅ Sí refetch al cambiar de ventana para contactos en espera
    refetchOnMount: true, // ✅ Sí refetch al montar para contactos en espera
    refetchInterval: 1000 * 15, // ✅ Refetch cada 15 segundos para contactos en espera
  });

  // ✅ Callback para cuando se cierra un contacto
  const handleContactClosed = React.useCallback(
    async (waId: string) => {

      try {
        markAsRead(waId);
        
        // ✅ Invalidar todas las queries para refrescar las listas
        queryClient.invalidateQueries({
          queryKey: ["contacts", session?.executive?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["closedContacts", session?.executive?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["waitingContacts", session?.executive?.id],
        });
        
      } catch (error) {
        console.error("❌ Error cerrando contacto:", error);
      }

      if (selectedContact?.waId === waId) {
        setSelectedContact(null);
        leaveChat();
      }
    },
    [selectedContact?.waId, leaveChat, queryClient, session?.executive?.id, markAsRead]
  );

  // ✅ Agregar conteos no leídos a los contactos abiertos (con logging para debug)
  const openContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!contactsData) return [];

    const result = addUnreadCountsToContacts(contactsData);

    return result;
  }, [contactsData, unreadCounts]); // ✅ Agregar unreadCounts como dependencia

  // ✅ Agregar conteos no leídos solo a los contactos abiertos (contactos cerrados no deben tener badges)
  const closedContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!closedContactsData) return [];

    // ✅ No agregar unread counts a contactos cerrados - siempre 0
    const result = closedContactsData.map(contact => ({
      ...contact,
      unreadCount: 0 // ✅ Contactos cerrados nunca tienen badge
    }));

    return result;
  }, [closedContactsData]); // ✅ No depende de unreadCounts porque no los necesita

  const waitingContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!waitingContactsData) return [];
    const result = addUnreadCountsToContacts(waitingContactsData);
    return result;
  }, [waitingContactsData, unreadCounts]); // ✅ Contactos en espera sí pueden tener badges

  // ✅ Combinar todos los contactos para el prop allContacts
  const allContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    return [...openContactsWithUnread, ...waitingContactsWithUnread, ...closedContactsWithUnread];
  }, [openContactsWithUnread, waitingContactsWithUnread, closedContactsWithUnread]);

  // ✅ Filtrar contactos por tab activo usando endpoints separados
  const filteredContacts = React.useMemo(() => {
    if (activeTab === "abierto") {
      return openContactsWithUnread; // ✅ Usar contactos abiertos del endpoint específico
    } else if (activeTab === "espera") {
      return waitingContactsWithUnread; // ✅ Usar contactos en espera del endpoint específico
    } else if (activeTab === "cerrado") {
      return closedContactsWithUnread; // ✅ Usar contactos cerrados del endpoint específico
    }
    return [];
  }, [openContactsWithUnread, waitingContactsWithUnread, closedContactsWithUnread, activeTab, waitingContactsData]);

  // ✅ Conectar a rooms de todos los contactos activos
  useEffect(() => {
    if (!isConnected || !filteredContacts.length) return;

    filteredContacts.forEach((contact) => {
      joinChat(contact.waId);
    });

    return () => {
      leaveChat();
    };
  }, [isConnected, filteredContacts.length]);

  // ✅ Query SIN polling automático - solo refetch cuando sea necesario + fallback mínimo
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isRefetching,
  } = useQuery<any[], Error>({
    queryKey: ["messages", selectedContact?.waId],
    queryFn: () => {
      return getMessages(selectedContact!.waId);
    },
    enabled: !!selectedContact?.waId,
    staleTime: newMessages.length > 0 ? 0 : 1000 * 60 * 5, // ✅ Si hay mensajes nuevos, staleTime = 0
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: isConnected ? false : 1000 * 30, // ✅ Solo polling si socket desconectado (fallback)
    placeholderData: [],
  });

  // ✅ Detectar NUEVOS CONTACTOS del socket y actualizar lista automáticamente
  useEffect(() => {
    if (newContacts.length > 0) {

      queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });

      queryClient.invalidateQueries({
        queryKey: ["closedContacts", session?.executive?.id],
        exact: true,
      });

      queryClient
        .refetchQueries({
          queryKey: ["contacts", session?.executive?.id],
          exact: true,
          type: "active",
        })
        .then(() => {
          return queryClient.refetchQueries({
            queryKey: ["closedContacts", session?.executive?.id],
            exact: true,
            type: "active",
          });
        })
        .then(() => {
          clearNewContacts();
        });
    }
  }, [newContacts, queryClient, session?.executive?.id, clearNewContacts]);

  useEffect(() => {
    const invalidateWaitingContacts = () => {
      queryClient.invalidateQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });

      queryClient.refetchQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
        type: "active",
      }).then((results) => {
        queryClient.getQueryData([
          "waitingContacts", 
          session?.executive?.id
        ]);
      });
    };

    if (contactsData || closedContactsData) {
      const timeoutId = setTimeout(() => {
        invalidateWaitingContacts();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [contactsData, closedContactsData, queryClient, session?.executive?.id]);

  useEffect(() => {
    // Cuando se actualiza cualquiera de las listas, verificar si hay inconsistencias
    if (contactsData && closedContactsData) {
      const closedWaIds = new Set(closedContactsData.map(c => c.waId));
      
      // Buscar duplicados (contactos que aparecen en ambas listas)
      const duplicates = contactsData.filter(contact => closedWaIds.has(contact.waId));
      
      if (duplicates.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["contacts", session?.executive?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["waitingContacts", session?.executive?.id],
        });
        
        queryClient.invalidateQueries({
          queryKey: ["closedContacts", session?.executive?.id],
        });
      }
    }
  }, [contactsData, waitingContactsData, closedContactsData, queryClient, session?.executive?.id]);

  useEffect(() => {

    if (newMessages.length > 0 && (contactsData || closedContactsData)) {
      const allCurrentContacts = [...(contactsData || []), ...(closedContactsData || [])];
      const contactWaIds = new Set(allCurrentContacts.map((contact) => contact.waId));
      const newContactMessages = newMessages.filter(
        (msg) => !contactWaIds.has(msg.waId)
      );

      if (newContactMessages.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["contacts", session?.executive?.id],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["waitingContacts", session?.executive?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["closedContacts", session?.executive?.id],
          exact: true,
        });

        queryClient
          .refetchQueries({
            queryKey: ["contacts", session?.executive?.id],
            exact: true,
            type: "active",
          })
          .then(() => {
            return queryClient.refetchQueries({
              queryKey: ["closedContacts", session?.executive?.id],
              exact: true,
              type: "active",
            });
          })
          .then((results) => {
            queryClient.getQueryData([
              "contacts",
              session?.executive?.id,
            ]);
            queryClient.getQueryData([
              "waitingContacts",
              session?.executive?.id,
            ]);
            queryClient.getQueryData([
              "closedContacts",
              session?.executive?.id,
            ]);
          });
      }
    }

    if (!newMessages.length) {
      return;
    }
    const messagesFromSelectedContact = selectedContact
      ? newMessages.filter((msg) => msg.waId === selectedContact.waId)
      : [];

    const messagesFromOtherContacts = selectedContact
      ? newMessages.filter((msg) => msg.waId !== selectedContact.waId)
      : newMessages;

    if (messagesFromOtherContacts.length > 0) {
      const unreadCountsByWaId: Record<string, number> = {};
      messagesFromOtherContacts.forEach((msg) => {
        unreadCountsByWaId[msg.waId] = (unreadCountsByWaId[msg.waId] || 0) + 1;
      });

      const unreadCountsArray = Object.entries(unreadCountsByWaId).map(
        ([waId, count]) => ({
          waId,
          count,
        })
      );

      socketService.triggerUnreadCountUpdate(unreadCountsArray);

      queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["closedContacts", session?.executive?.id],
        exact: true,
      });
    }

    if (messagesFromSelectedContact.length > 0) {
      console.log(
        "📱 HAY MENSAJES DEL CONTACTO SELECCIONADO - Procesando normalmente"
      );
      // Continuar con la lógica normal para el contacto seleccionado
    }

    // Si no hay contacto seleccionado, ya se procesó arriba
    if (!selectedContact) {
      return;
    }

    const relevantMessages = messagesFromSelectedContact;


    if (relevantMessages.length > 0) {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedContact.waId],
        exact: true,
      });

      const refetchPromise = queryClient.refetchQueries({
        queryKey: ["messages", selectedContact.waId],
        exact: true,
        type: "active", // ✅ Solo refetch queries activas
      });
      refetchPromise
        .then((results) => {
          clearNewMessages(selectedContact.waId);
        })
        .catch((error) => {
          console.error("❌ Error en refetch:", error);
          console.error("❌ Stack trace:", error.stack);
          clearNewMessages(selectedContact.waId); // ✅ Limpiar solo mensajes del contacto actual
        });
    }
  }, [newMessages, selectedContact?.waId, queryClient, contactsData, closedContactsData]);

  const allMessages = React.useMemo(() => {
    if (!selectedContact || !messagesData) return [];

    const sortedMessages = messagesData.sort((a, b) => {
      const timeA = parseInt(a.metaTimestamp) || 0;
      const timeB = parseInt(b.metaTimestamp) || 0;
      return timeA - timeB;
    });

    return sortedMessages;
  }, [messagesData, selectedContact?.waId, isRefetching]);

  const handleContactSelect = (contact: Contact2) => {
    setSelectedContact(contact);
    markAsRead(contact.waId);

    queryClient.invalidateQueries({
      queryKey: ["contacts"],
      exact: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["closedContacts"],
      exact: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["waitingContacts"],
      exact: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["messages", contact.waId],
      exact: true,
    });
  };

  const forceRefreshWaitingContacts = React.useCallback(async () => {

    try {
      await queryClient.invalidateQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });
      
      await queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });

       await queryClient.refetchQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
        type: "active",
      });

      await queryClient.refetchQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
        type: "active",
      });
      const updatedWaiting = queryClient.getQueryData(["waitingContacts", session?.executive?.id]);
      const updatedOpen = queryClient.getQueryData(["contacts", session?.executive?.id]);

      return { success: true, waitingCount: Array.isArray(updatedWaiting) ? updatedWaiting.length : 0 };
      
    } catch (error) {
      console.error("Error refrescando contactos en espera:", error);
      return { success: false, error };
    }
  }, [queryClient, session?.executive?.id]);

  // ✅ Exponer la función globalmente para testing desde la consola
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceRefreshWaitingContacts = forceRefreshWaitingContacts;
    }
  }, [forceRefreshWaitingContacts]);

  const handleTakeChat = React.useCallback(async (contact: Contact2) => {
    try {
      if (!session?.executive?.id) {
        return;
      }
      
      // Llamar al servicio takeChats con waId y executiveId
      await takeChats(contact.waId, session.executive.id);
      
      // Invalidar y refrescar ambas queries
      await queryClient.invalidateQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });
      
      await queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id], 
        exact: true,
      });
      
      // Refetch inmediato
      await queryClient.refetchQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });
      
      await queryClient.refetchQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });
    } catch (error) {
      console.error('❌ Error al tomar el chat:', error);
    }
  }, [queryClient, session?.executive?.id]);

  const handleSendMessage = (message: string) => {
    if (!selectedContact) {
      return;
    }

    socketSendMessage(
      selectedContact.waId,
      message,
      session?.executive?.id?.toString() || ""
    );

    queryClient.setQueryData(
      ["messages", selectedContact.waId],
      (oldMessages: any[] = []) => {
        const now = new Date();
        const timestampSeconds = Math.floor(now.getTime() / 1000);

        
        const optimisticMessage = {
          id: `temp_${Date.now()}`,
          waId: selectedContact.waId,
          metaId: `temp_${Date.now()}`,
          metaTimestamp: timestampSeconds.toString(), // ✅ Timestamp en segundos (10 dígitos)
          message: message,
          action: "send",
          sender: "EXECUTIVE" as const,
          timestamp: now.toISOString(), // ✅ ISO timestamp para respaldo
          sessionId: session?.executive?.id?.toString() || "",
          flowId: null,
          source: "optimistic",
        };

        return [...(oldMessages || []), optimisticMessage];
      }
    );

    sendMessage(selectedContact.waId, message)
      .then((response) => {
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedContact.waId],
          exact: true,
        });
      })
      .catch((error) => {
        console.error("Error API:", error.message);

        queryClient.setQueryData(
          ["messages", selectedContact.waId],
          (oldMessages: any[] = []) => {
            return (oldMessages || []).map((msg) => {
              if (msg.source === "optimistic" && msg.message === message) {
                return {
                  ...msg,
                  source: "failed",
                  error: true,
                  errorMessage: `Error: ${error.message}`,
                };
              }
              return msg;
            });
          }
        );

        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["messages", selectedContact.waId],
            exact: true,
          });
        }, 5000);
      });
  };

  return (
    <DashboardContainer>
      {/* Sidebar con lista de contactos */}
      <SidebarContainer elevation={0}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${colors.secondary.var80}` }}>
          <Typography
            variant="h6"
            sx={{ color: colors.secondary.var20, fontWeight: 600 }}
          >
            Asistente Humano
          </Typography>
        </Box>
        <ContactList
          contacts={filteredContacts}
          allContacts={allContactsWithUnread}
          waitingContacts={waitingContactsWithUnread}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onTakeChat={handleTakeChat}
        />
      </SidebarContainer>

      {/* Área principal de chat */}
      <MainChatContainer elevation={0}>
        {selectedContact ? (
          <>
            {(() => {
              return null;
            })()}
            <ChatArea
              contact={selectedContact}
              messages={allMessages}
              onSendMessage={handleSendMessage}
              onContactClosed={handleContactClosed}
            />
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: colors.secondary.var50,
            }}
          >
            <Typography variant="h6">
              Selecciona una conversación para comenzar
            </Typography>
          </Box>
        )}
      </MainChatContainer>

      {/* Panel de información del cliente */}
      {/* {selectedContact && (
        <CustomerInfoContainer elevation={0}>
          <CustomerInfo 
            contact={selectedContact} 
            onContactClosed={handleContactClosed}
          />
        </CustomerInfoContainer>
      )} */}
    </DashboardContainer>
  );
};

export default Dashboard;
