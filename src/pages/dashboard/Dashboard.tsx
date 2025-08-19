import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Chip, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { colors } from '@/styles/colors';
import ContactList from '@/components/dashboard/chat/ContactList';
import ChatArea from '@/components/dashboard/chat/ChatArea';
import CustomerInfo from '@/components/dashboard/chat/CustomerInfo';
import { getContacts, getMessages, sendMessage } from '@/api/chatService';
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { fetchSession } from '@/queries/session';

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

interface Contact2 {
    id:          number;
    executiveId: number;
    waId:        string;
    createdAt:   Date;
    updatedAt:   Date;
    deletedAt:   null;
    executive:   Executive;
}
interface Executive {
    id:        number;
    name:      string;
    email:     string;
    phone:     string;
    active:    boolean;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
}

const DashboardContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 140px)',
  backgroundColor: colors.secondary.var95,
  padding: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(2),
}));

const SidebarContainer = styled(Paper)(({ theme }) => ({
  width: 320,
  backgroundColor: colors.secondary.var99,
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${colors.secondary.var80}`,
}));

const MainChatContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  backgroundColor: colors.secondary.var99,
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
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
  const [activeTab, setActiveTab] = useState<'abierto' | 'espera' | 'cerrado'>('abierto');
  const { data: session } = useSuspenseQuery(fetchSession());
  // Datos de ejemplo
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Ana Martinez',
      lastMessage: 'Último mensaje...',
      time: '12:29',
      status: 'online',
      priority: 'alta',
      unreadCount: 2,
    },
    {
      id: '2',
      name: 'Juan Pérez',
      lastMessage: 'Último mensaje',
      time: '11:45',
      status: 'away',
      priority: 'media',
    },
    {
      id: '3',
      name: 'Isabel Gómez',
      lastMessage: 'En atención',
      time: '10:30',
      status: 'online',
      priority: 'baja',
    },
    {
      id: '4',
      name: 'Luis Rodriguez',
      lastMessage: 'Alao',
      time: 'Hoy',
      status: 'offline',
      priority: 'media',
    },
  ];

  const { data: contactsData } = useQuery<Contact2[], Error>({
    queryKey: ['contacts', session?.executive?.id],
    queryFn: () => getContacts(session.executive.id),
    enabled: !!session?.executive?.id, // Solo ejecutar si hay sesión
    // ✅ Configuraciones específicas para contactos
    staleTime: 1000 * 60 * 10, // 10 minutos - los contactos no cambian tan seguido
    gcTime: 1000 * 60 * 60,    // 1 hora en cache
  });

  const { data: messagesData } = useQuery<any[], Error>({
    queryKey: ['messages', selectedContact?.waId],
    queryFn: () => getMessages(selectedContact!.waId),
    enabled: !!selectedContact?.waId, // Solo ejecutar si hay un contacto seleccionado
    // ✅ Configuraciones específicas para mensajes
    staleTime: 1000 * 60 * 2,  // 2 minutos - los mensajes cambian más seguido
    gcTime: 1000 * 60 * 20,    // 20 minutos en cache
  });

  useEffect(() => {
    console.log('useEffect', session);
    if (contactsData) {
      // Manejar los contactos obtenidos
      console.log({ contactsData });
    }
    if (messagesData) {
      console.log({ messagesData });
    }
  }, [contactsData, messagesData]);

  const handleContactSelect = (contact: Contact2) => {
    console.log({ contact });
    setSelectedContact(contact);
  };

  const handleSendMessage = (message: string) => {
    // Lógica para enviar mensaje
    console.log('Enviando mensaje:', message);

    if (selectedContact) {
      sendMessage(selectedContact.waId, message)
        .then((response) => {
          console.log('Mensaje enviado:', response);
        })
        .catch((error) => {
          console.error('Error al enviar mensaje:', error);
        });
    }
  };

  return (
    <DashboardContainer>
      {/* Sidebar con lista de contactos */}
      <SidebarContainer elevation={0}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${colors.secondary.var80}` }}>
          <Typography variant="h6" sx={{ color: colors.secondary.var20, fontWeight: 600 }}>
            MESA DE AYUDA
          </Typography>
        </Box>
        <ContactList
          contacts={contactsData ?? []}
          // selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </SidebarContainer>

      {/* Área principal de chat */}
      <MainChatContainer elevation={0}>
        {selectedContact ? (
          <ChatArea
            contact={selectedContact}
            messages={messagesData ?? []} // ✅ Pasar mensajes del API directamente
            onSendMessage={handleSendMessage}
          />
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: colors.secondary.var50 
            }}
          >
            <Typography variant="h6">
              Selecciona una conversación para comenzar
            </Typography>
          </Box>
        )}
      </MainChatContainer>

      {/* Panel de información del cliente */}
      {selectedContact && (
        <CustomerInfoContainer elevation={0}>
          <CustomerInfo contact={selectedContact} />
        </CustomerInfoContainer>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;