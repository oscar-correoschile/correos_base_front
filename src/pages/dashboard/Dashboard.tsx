import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { colors } from "@/styles/colors";
import ContactList from "@/components/dashboard/chat/ContactList";
import ChatArea from "@/components/dashboard/chat/ChatArea";
// import CustomerInfo from '@/components/dashboard/chat/CustomerInfo';
import { getClosedChats, getMessages, getOpenContacts, getWaitingChats, sendMessage } from "@/api/chatService";
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
      console.log("📋 Contactos obtenidos:", contacts.length);
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
      console.log("📋 Contactos cerrados obtenidos:", contacts.length);
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
      console.log("📋 Contactos en espera obtenidos:", contacts.length);
      return contacts;
    },
    enabled: !!session?.executive?.id,
    staleTime: 1000 * 60 * 15, // ✅ 15 minutos - contactos no cambian tan seguido
    gcTime: 1000 * 60 * 60, // ✅ 1 hora en cache
    refetchOnWindowFocus: false, // ✅ No refetch al cambiar de ventana
    refetchOnMount: false, // ✅ No refetch al montar si hay cache
    refetchInterval: 1000 * 60 * 5, // ✅ Refetch automático cada 5 minutos para mantener sincronizado
  });

  // ✅ Callback para cuando se cierra un contacto
  const handleContactClosed = React.useCallback(
    async (waId: string) => {
      console.log("🔒 Contacto cerrado:", {
        waId,
        sWaId: selectedContact?.waId,
      });

      try {
        // ✅ Limpiar unread counts del contacto que se está cerrando
        markAsRead(waId);
        console.log("🧹 Limpiando unread counts para contacto cerrado:", waId);
        
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

      // ✅ Si el contacto cerrado es el seleccionado, limpiarlo
      if (selectedContact?.waId === waId) {
        console.log("🧹 Limpiando contacto seleccionado porque se cerró");
        setSelectedContact(null);
        leaveChat(); // ✅ Salir del chat por socket
      }
    },
    [selectedContact?.waId, leaveChat, queryClient, session?.executive?.id, markAsRead]
  );

  // ✅ Agregar conteos no leídos a los contactos abiertos (con logging para debug)
  const openContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!contactsData) return [];

    console.log("🔍 CALCULANDO openContactsWithUnread:", {
      contactsDataLength: contactsData.length,
      unreadCounts: unreadCounts,
      unreadCountsSize: unreadCounts?.size || 0,
      timestamp: new Date().toISOString(),
    });

    const result = addUnreadCountsToContacts(contactsData);

    console.log("📊 RESULTADO openContactsWithUnread:", {
      resultLength: result.length,
      contactsWithBadges: result
        .filter((c) => c.unreadCount && c.unreadCount > 0)
        .map((c) => ({ waId: c.waId, unreadCount: c.unreadCount })),
      timestamp: new Date().toISOString(),
    });

    return result;
  }, [contactsData, unreadCounts]); // ✅ Agregar unreadCounts como dependencia

  // ✅ Agregar conteos no leídos solo a los contactos abiertos (contactos cerrados no deben tener badges)
  const closedContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!closedContactsData) return [];

    console.log("🔍 CALCULANDO closedContactsWithUnread (sin badges):", {
      closedContactsDataLength: closedContactsData.length,
      timestamp: new Date().toISOString(),
    });

    // ✅ No agregar unread counts a contactos cerrados - siempre 0
    const result = closedContactsData.map(contact => ({
      ...contact,
      unreadCount: 0 // ✅ Contactos cerrados nunca tienen badge
    }));

    console.log("📊 RESULTADO closedContactsWithUnread (sin badges):", {
      resultLength: result.length,
      timestamp: new Date().toISOString(),
    });

    return result;
  }, [closedContactsData]); // ✅ No depende de unreadCounts porque no los necesita

  const waitingContactsWithUnread: ContactWithUnread[] = React.useMemo(() => {
    if (!waitingContactsData) return [];

    console.log("🔍 CALCULANDO waitingContactsWithUnread:", {
      waitingContactsDataLength: waitingContactsData.length,
      unreadCounts: unreadCounts,
      unreadCountsSize: unreadCounts?.size || 0,
      timestamp: new Date().toISOString(),
    });

    const result = addUnreadCountsToContacts(waitingContactsData);

    console.log("📊 RESULTADO waitingContactsWithUnread:", {
      resultLength: result.length,
      contactsWithBadges: result
        .filter((c) => c.unreadCount && c.unreadCount > 0)
        .map((c) => ({ waId: c.waId, unreadCount: c.unreadCount })),
      timestamp: new Date().toISOString(),
    });

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
  }, [openContactsWithUnread, waitingContactsWithUnread, closedContactsWithUnread, activeTab]);

  // ✅ Conectar a rooms de todos los contactos activos
  useEffect(() => {
    if (!isConnected || !filteredContacts.length) return;

    console.log(`🔌 Conectando a ${filteredContacts.length} rooms`);

    filteredContacts.forEach((contact) => {
      joinChat(contact.waId);
    });

    return () => {
      leaveChat();
    };
  }, [isConnected, filteredContacts.length]);

  // ✅ TODO: Implementar actualizaciones basadas en eventos del socket
  // en lugar de polling para mejor rendimiento
  // useEffect(() => {
  //   if (!selectedContact) return;

  //   const interval = setInterval(() => {
  //     const currentMessages = getMessagesForContact(selectedContact.waId);
  //     const cachedMessages = queryClient.getQueryData(['messages', selectedContact.waId]) as any[] || [];

  //     if (currentMessages.length > cachedMessages.length) {
  //       console.log('📥 Detectados nuevos mensajes del socket, actualizando...');
  //       queryClient.invalidateQueries({
  //         queryKey: ['messages', selectedContact.waId]
  //       });
  //     }
  //   }, 10000);

  //   return () => clearInterval(interval);
  // }, [selectedContact, queryClient, getMessagesForContact]);

  // ✅ Query SIN polling automático - solo refetch cuando sea necesario + fallback mínimo
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isRefetching,
  } = useQuery<any[], Error>({
    queryKey: ["messages", selectedContact?.waId],
    queryFn: () => {
      console.log(
        "🔄 EJECUTANDO queryFn para obtener mensajes de:",
        selectedContact!.waId
      );
      console.log("🕐 Timestamp de ejecución:", new Date().toISOString());
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

  // ✅ Debugging: seguimiento de cambios importantes solamente
  useEffect(() => {
    if (selectedContact && messagesData && messagesData.length > 0) {
      // Solo log cuando hay cambios significativos
      const lastMessage = messagesData[messagesData.length - 1];
      if (lastMessage) {
        console.log("📬 Mensajes actualizados:", {
          count: messagesData.length,
          lastMessage: lastMessage.message?.slice(0, 50) + "...",
          lastSender: lastMessage.sender,
          contact: selectedContact.waId,
          allSenders: messagesData.map((m) => m.sender).slice(-5), // Últimos 5 senders
          isLoading: messagesLoading,
          isRefetching: isRefetching,
        });
      }
    }
  }, [
    messagesData?.length,
    selectedContact?.waId,
    messagesLoading,
    isRefetching,
  ]);

  // ✅ Debugging: monitorear newMessages del socket
  useEffect(() => {
    console.log("🔔 USEEFFECT TRIGGERED - newMessages cambió:", {
      count: newMessages.length,
      selectedContact: selectedContact?.waId,
      messages: newMessages.map((m) => ({
        id: m.id,
        waId: m.waId,
        sender: m.sender,
        message: m.message?.slice(0, 30) + "...",
        isRelevant: selectedContact ? m.waId === selectedContact.waId : false,
      })),
      triggerTimestamp: new Date().toISOString(),
    });

    // ✅ CONSOLE LOG INMEDIATO cuando se recibe CUALQUIER mensaje
    if (newMessages.length > 0) {
      const lastMessage = newMessages[newMessages.length - 1];
      console.log("🚨 DASHBOARD - MENSAJE RECIBIDO INMEDIATAMENTE:", {
        messageId: lastMessage.id,
        waId: lastMessage.waId,
        sender: lastMessage.sender,
        message: lastMessage.message,
        timestamp: lastMessage.timestamp,
        selectedContact: selectedContact?.waId,
        esDelContactoSeleccionado: selectedContact
          ? lastMessage.waId === selectedContact.waId
          : false,
        timestampCompleto: new Date().toISOString(),
      });
    }
  }, [newMessages, newMessages.length, selectedContact?.waId]); // ✅ Agregamos newMessages como dependencia completa

  // ✅ Detectar NUEVOS CONTACTOS del socket y actualizar lista automáticamente
  useEffect(() => {
    if (newContacts.length > 0) {
      console.log("🆕 NUEVOS CONTACTOS DETECTADOS POR SOCKET:", {
        count: newContacts.length,
        contacts: newContacts,
        timestamp: new Date().toISOString(),
      });

      // ✅ Refrescar inmediatamente ambas listas cuando llega un nuevo contacto
      console.log(
        "🔄 Invalidando ambas listas de contactos por nuevo contacto detectado..."
      );

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
          console.log("✅ Lista de contactos abiertos actualizada por nuevo contacto");
          
          // También refetch contactos cerrados para evitar duplicados
          return queryClient.refetchQueries({
            queryKey: ["closedContacts", session?.executive?.id],
            exact: true,
            type: "active",
          });
        })
        .then(() => {
          console.log("✅ Lista de contactos cerrados actualizada por nuevo contacto");
          // ✅ Limpiar los nuevos contactos después de procesar ambas listas
          clearNewContacts();
        });
    }
  }, [newContacts, queryClient, session?.executive?.id, clearNewContacts]);

  // ✅ Sincronizar automáticamente las listas para evitar duplicados
  useEffect(() => {
    // Cuando se actualiza cualquiera de las listas, verificar si hay inconsistencias
    if (contactsData && closedContactsData) {
      const openWaIds = new Set(contactsData.map(c => c.waId));
      const closedWaIds = new Set(closedContactsData.map(c => c.waId));
      
      // Buscar duplicados (contactos que aparecen en ambas listas)
      const duplicates = contactsData.filter(contact => closedWaIds.has(contact.waId));
      
      if (duplicates.length > 0) {
        console.warn("⚠️ Duplicados detectados entre listas abierta y cerrada:", 
          duplicates.map(d => d.waId));
        
        // Refrescar ambas listas para resolver inconsistencias
        console.log("🔄 Refrescando ambas listas para resolver duplicados...");
        
        queryClient.invalidateQueries({
          queryKey: ["contacts", session?.executive?.id],
        });
        
        queryClient.invalidateQueries({
          queryKey: ["closedContacts", session?.executive?.id],
        });
      }
    }
  }, [contactsData, closedContactsData, queryClient, session?.executive?.id]);

  // ✅ Sincronización INTELIGENTE basada en eventos del socket
  useEffect(() => {
    console.log("🔄 USEEFFECT SINCRONIZACIÓN EJECUTADO:", {
      selectedContact: selectedContact?.waId,
      newMessagesCount: newMessages.length,
      timestamp: new Date().toISOString(),
    });

    console.log("🧪 VERIFICANDO CONDICIONES INICIALES:", {
      hasSelectedContact: !!selectedContact,
      selectedContactWaId: selectedContact?.waId,
      hasNewMessages: newMessages.length > 0,
      newMessagesLength: newMessages.length,
      newMessagesDetails: newMessages.map((m) => ({
        id: m.id,
        waId: m.waId,
        message: m.message?.slice(0, 30),
      })),
    });

    console.log({ selectedContact, newMessages });

    // ✅ NUEVA LÓGICA: Verificar si hay mensajes de contactos que NO están en la lista
    if (newMessages.length > 0 && (contactsData || closedContactsData)) {
      const allCurrentContacts = [...(contactsData || []), ...(closedContactsData || [])];
      const contactWaIds = new Set(allCurrentContacts.map((contact) => contact.waId));
      const newContactMessages = newMessages.filter(
        (msg) => !contactWaIds.has(msg.waId)
      );

      if (newContactMessages.length > 0) {
        console.log(
          "🆕 CONTACTOS NUEVOS DETECTADOS - Invalidando query de contactos:",
          {
            newContactsCount: newContactMessages.length,
            newContactWaIds: newContactMessages.map((m) => m.waId),
            currentContactsInList: Array.from(contactWaIds),
            timestamp: new Date().toISOString(),
          }
        );

        // ✅ Invalidar y refetch ambas listas de contactos para que aparezcan los nuevos
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
            console.log("✅ Lista de contactos abiertos actualizada - nuevos contactos deberían aparecer ahora");
            
            // También refetch contactos cerrados
            return queryClient.refetchQueries({
              queryKey: ["closedContacts", session?.executive?.id],
              exact: true,
              type: "active",
            });
          })
          .then((results) => {
            console.log("✅ Lista de contactos cerrados actualizada");
            console.log("📊 RESULTADO DEL REFETCH DE CONTACTOS:", results);

            // ✅ Verificar qué contactos están ahora en cache
            const updatedOpenContacts = queryClient.getQueryData([
              "contacts",
              session?.executive?.id,
            ]);
            const updatedClosedContacts = queryClient.getQueryData([
              "closedContacts",
              session?.executive?.id,
            ]);
            
            console.log("📋 CONTACTOS EN CACHE DESPUÉS DEL REFETCH:", {
              totalOpenContacts: Array.isArray(updatedOpenContacts)
                ? updatedOpenContacts.length
                : 0,
              totalClosedContacts: Array.isArray(updatedClosedContacts)
                ? updatedClosedContacts.length
                : 0,
              openContacts: Array.isArray(updatedOpenContacts)
                ? updatedOpenContacts.map((c: any) => ({
                    waId: c.waId,
                    executiveId: c.executiveId,
                    id: c.id,
                  }))
                : [],
              closedContacts: Array.isArray(updatedClosedContacts)
                ? updatedClosedContacts.map((c: any) => ({
                    waId: c.waId,
                    executiveId: c.executiveId,
                    id: c.id,
                  }))
                : [],
            });
          });
      }
    }

    if (!newMessages.length) {
      console.log("❌ SYNC: No hay mensajes nuevos");
      return;
    }

    console.log(
      "✅ Hay mensajes nuevos, verificando si hay contacto seleccionado..."
    );
    console.log("📋 selectedContact:", selectedContact);
    console.log("📋 !selectedContact:", !selectedContact);
    console.log("📋 typeof selectedContact:", typeof selectedContact);
    console.log("📋 selectedContact === null:", selectedContact === null);
    console.log(
      "📋 selectedContact === undefined:",
      selectedContact === undefined
    );

    // ✅ SEPARAR: Mensajes del contacto seleccionado vs mensajes de otros contactos
    const messagesFromSelectedContact = selectedContact
      ? newMessages.filter((msg) => msg.waId === selectedContact.waId)
      : [];

    const messagesFromOtherContacts = selectedContact
      ? newMessages.filter((msg) => msg.waId !== selectedContact.waId)
      : newMessages; // Si no hay contacto seleccionado, todos son de "otros"

    console.log("📊 MENSAJES SEPARADOS:", {
      delContactoSeleccionado: messagesFromSelectedContact.length,
      deOtrosContactos: messagesFromOtherContacts.length,
      selectedContactWaId: selectedContact?.waId,
    });

    // ✅ NUEVO: Actualizar unread counts para mensajes de OTROS contactos
    if (messagesFromOtherContacts.length > 0) {
      console.log("🎯 HAY MENSAJES DE OTROS CONTACTOS - Actualizando badges");
      console.log(
        "📊 SYNC: Mensajes de otros contactos - actualizando unread counts globales"
      );

      // Agrupar mensajes por waId para contar unread counts
      const unreadCountsByWaId: Record<string, number> = {};
      messagesFromOtherContacts.forEach((msg) => {
        unreadCountsByWaId[msg.waId] = (unreadCountsByWaId[msg.waId] || 0) + 1;
      });

      console.log("📈 Unread counts calculados:", unreadCountsByWaId);

      // ✅ Convertir a formato UnreadCount[] y disparar el evento manualmente
      const unreadCountsArray = Object.entries(unreadCountsByWaId).map(
        ([waId, count]) => ({
          waId,
          count,
        })
      );

      console.log(
        "🔔🔔🔔 DASHBOARD DISPARANDO unread count update manualmente:",
        unreadCountsArray
      );
      console.log("🕐 Timestamp Dashboard:", new Date().toISOString());
      console.log(
        "🎯 Mensaje que activó esto:",
        messagesFromOtherContacts.map((m: any) => ({
          waId: m.waId,
          content: m.content,
        }))
      );

      // Disparar el evento directamente
      socketService.triggerUnreadCountUpdate(unreadCountsArray);
      console.log("✅ triggerUnreadCountUpdate ejecutado desde Dashboard");

      // Actualizar ambas listas de contactos con los nuevos unread counts
      queryClient.invalidateQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["closedContacts", session?.executive?.id],
        exact: true,
      });
    }

    // ✅ PROCESAR mensajes del contacto seleccionado (si los hay)
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

    // Filtrar mensajes para el contacto actual (ahora solo los relevantes)
    const relevantMessages = messagesFromSelectedContact;

    console.log("🔍 FILTRO DE MENSAJES RELEVANTES:", {
      totalNewMessages: newMessages.length,
      relevantMessagesCount: relevantMessages.length,
      selectedContactWaId: selectedContact.waId,
      allNewMessagesWaIds: newMessages.map((m) => m.waId),
      relevantMessagesDetails: relevantMessages.map((m) => ({
        id: m.id,
        waId: m.waId,
        message: m.message?.slice(0, 30),
      })),
    });

    console.log("🧪 EVALUANDO CONDICIÓN IF relevantMessages.length > 0:", {
      relevantMessagesLength: relevantMessages.length,
      conditionResult: relevantMessages.length > 0,
      willEnterIf: relevantMessages.length > 0,
    });

    if (relevantMessages.length > 0) {
      console.log("📨 EVENTO: Nuevos mensajes detectados por socket:", {
        count: relevantMessages.length,
        contact: selectedContact.waId,
        messages: relevantMessages.map((m) => ({
          id: m.id,
          sender: m.sender,
          message: m.message?.slice(0, 30) + "...",
          timestamp: m.timestamp,
        })),
        currentMessagesCount: messagesData?.length || 0,
      });

      // ✅ REFETCH INMEDIATO Y FORZADO basado en evento del socket
      console.log("🔄 Iniciando refetch forzado INMEDIATO...");
      console.log("🔑 Query key que se va a refetch:", [
        "messages",
        selectedContact.waId,
      ]);
      console.log("🕐 Timestamp del refetch:", new Date().toISOString());

      // ✅ FORZAR que la query sea stale antes del refetch
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedContact.waId],
        exact: true,
      });

      console.log("🔄 Query invalidada, ahora ejecutando refetch INMEDIATO...");

      const refetchPromise = queryClient.refetchQueries({
        queryKey: ["messages", selectedContact.waId],
        exact: true,
        type: "active", // ✅ Solo refetch queries activas
      });

      console.log("🚀 Refetch promise creado:", refetchPromise);

      refetchPromise
        .then((results) => {
          console.log("✅ Refetch completado exitosamente:", {
            contact: selectedContact.waId,
            timestamp: new Date().toISOString(),
            results: results,
          });

          // ✅ Verificar si realmente hay datos nuevos
          const currentData = queryClient.getQueryData([
            "messages",
            selectedContact.waId,
          ]);
          console.log("📊 Datos actuales en cache después del refetch:", {
            dataLength: Array.isArray(currentData) ? currentData.length : 0,
            lastMessages: Array.isArray(currentData)
              ? currentData.slice(-3).map((m) => ({
                  id: m.id,
                  message: m.message?.slice(0, 30),
                  timestamp: m.timestamp,
                }))
              : [],
          });

          // ✅ Limpiar inmediatamente los mensajes del socket
          console.log(
            "🧹 Limpiando mensajes nuevos después del refetch para:",
            selectedContact.waId
          );
          clearNewMessages(selectedContact.waId); // ✅ Limpiar solo mensajes del contacto actual
        })
        .catch((error) => {
          console.error("❌ Error en refetch:", error);
          console.error("❌ Stack trace:", error.stack);
          // Limpiar anyway para evitar loops
          console.log(
            "🧹 Limpiando mensajes nuevos después de error para:",
            selectedContact.waId
          );
          clearNewMessages(selectedContact.waId); // ✅ Limpiar solo mensajes del contacto actual
        });
    }
  }, [newMessages, selectedContact?.waId, queryClient, contactsData, closedContactsData]); // ✅ Dependencias con ambos datasets para detectar nuevos contactos

  // ✅ SIMPLE: Solo usar datos del API (socket invalida cache automáticamente)
  const allMessages = React.useMemo(() => {
    if (!selectedContact || !messagesData) return [];

    console.log("📋 Procesando mensajes:", messagesData.length);

    // ✅ Simple ordenamiento por timestamp
    const sortedMessages = messagesData.sort((a, b) => {
      const timeA = parseInt(a.metaTimestamp) || 0;
      const timeB = parseInt(b.metaTimestamp) || 0;
      return timeA - timeB;
    });

    return sortedMessages;
  }, [messagesData, selectedContact?.waId, isRefetching]); // ✅ Agregamos isRefetching para triggear re-render

  // ✅ Función para seleccionar contacto
  const handleContactSelect = (contact: Contact2) => {
    setSelectedContact(contact);
    markAsRead(contact.waId);

    // ✅ Refetch de todas las listas de contactos y mensajes al seleccionar
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

  // ✅ Envío de mensaje BASADO EN EVENTOS (sin polling manual)
  const handleSendMessage = (message: string) => {
    if (!selectedContact) {
      console.warn("⚠️ No hay contacto seleccionado");
      return;
    }

    console.log(
      "📤 Enviando mensaje via eventos:",
      message.slice(0, 50) + "..."
    );

    // ✅ 1. Envío inmediato via socket
    socketSendMessage(
      selectedContact.waId,
      message,
      session?.executive?.id?.toString() || ""
    );

    // ✅ 2. Actualización optimista inmediata en UI
    queryClient.setQueryData(
      ["messages", selectedContact.waId],
      (oldMessages: any[] = []) => {
        // ✅ Crear timestamp consistente con el servidor (en segundos, no milisegundos)
        const now = new Date();
        const timestampSeconds = Math.floor(now.getTime() / 1000); // ✅ Solo segundos (10 dígitos)
        
        console.log("🕐 Creando mensaje optimista con timestamp:", {
          now: now.toISOString(),
          timestampSeconds,
          timestampLength: timestampSeconds.toString().length,
          localTime: now.toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Santiago",
          })
        });
        
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

    // ✅ 3. Envío API en background
    sendMessage(selectedContact.waId, message)
      .then((response) => {
        console.log("✅ API confirma envío:", response);

        // ✅ Refetch para obtener el mensaje con ID real del servidor
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedContact.waId],
          exact: true,
        });
      })
      .catch((error) => {
        console.error("❌ Error API:", error.message);

        // ✅ Marcar mensaje como fallido pero mantenerlo
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

        // ✅ Refetch para verificar si el mensaje llegó al servidor anyway
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
          contacts={filteredContacts} // ✅ Usar contactos filtrados con unread counts
          allContacts={allContactsWithUnread} // ✅ Todos los contactos para calcular contadores
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </SidebarContainer>

      {/* Área principal de chat */}
      <MainChatContainer elevation={0}>
        {selectedContact ? (
          <>
            {/* ✅ Log inmediatamente antes de pasar datos al ChatArea */}
            {(() => {
              console.log("🔄 Dashboard: Pasando datos a ChatArea:", {
                contact: selectedContact.waId,
                messagesCount: allMessages.length,
                messages: allMessages.slice(-3), // Últimos 3 mensajes
                timestamp: new Date().toISOString(),
              });
              return null;
            })()}
            <ChatArea
              contact={selectedContact}
              messages={allMessages} // ✅ Usar mensajes combinados (API + Socket)
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
