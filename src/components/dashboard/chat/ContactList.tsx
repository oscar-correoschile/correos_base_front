import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Button,
} from '@mui/material';
import { Search, Person, PersonAdd } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { colors } from '@/styles/colors';
import { socketService, type UnreadCount } from '@/api/socketService';

interface Contact {
    id:          number;
    executiveId: number;
    waId:        string;
    createdAt:   Date;
    updatedAt:   Date;
    deletedAt:   null;
    open: boolean;
    activo:      boolean;
    executive:   Executive;
    unreadCount?: number;
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

interface ContactListProps {
  contacts: Contact[];
  allContacts?: Contact[];
  waitingContacts?: Contact[];
  selectedContact: Contact | null;
  onContactSelect: (contact: Contact) => void;
  activeTab: 'abierto' | 'espera' | 'cerrado';
  onTabChange: (tab: 'abierto' | 'espera' | 'cerrado') => void;
  onTakeChat?: (contact: Contact) => Promise<void>;
}

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: colors.secondary.var95,
    borderRadius: theme.spacing(1),
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

const ContactListItem = styled(ListItemButton)<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  borderRadius: theme.spacing(1),
  margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  backgroundColor: isSelected ? colors.primary.var95 : 'transparent',
  '&:hover': {
    backgroundColor: isSelected ? colors.primary.var95 : colors.secondary.var95,
  },
  '&.Mui-selected': {
    backgroundColor: colors.primary.var95,
    '&:hover': {
      backgroundColor: colors.primary.var90,
    },
  },
}));

const ContactItem = React.memo<{
  contact: any;
  isSelected: boolean;
  onContactSelect: (contact: any) => void;
  shouldShowBadge: (contact: any) => boolean;
  getBadgeContent: (contact: any) => number;
  activeTab: 'abierto' | 'espera' | 'cerrado';
  onTakeChat?: (contact: any) => Promise<void>;
}>(({ contact, isSelected, onContactSelect, shouldShowBadge, getBadgeContent, activeTab, onTakeChat }) => {
  
  const [isTakingChat, setIsTakingChat] = useState(false);
  
  const badgeVisible = shouldShowBadge(contact);
  const badgeContent = getBadgeContent(contact);

  const finalBadgeVisible = badgeVisible && badgeContent > 0;

  const handleTakeChat = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el contacto
    
    if (!onTakeChat || isTakingChat) return;
    
    setIsTakingChat(true);
    try {
      await onTakeChat(contact);
    } catch (error) {
      console.error('❌ Error tomando chat:', error);
    } finally {
      setIsTakingChat(false);
    }
  };
  
  return (
    <ContactListItem
      isSelected={isSelected}
      selected={isSelected}
      onClick={() => {
        // No permitir seleccionar contactos en la pestaña "En Espera"
        if (activeTab === 'espera') {
          return;
        }
        onContactSelect(contact);
      }}
      sx={{
        cursor: activeTab === 'espera' ? 'default' : 'pointer',
        opacity: activeTab === 'espera' ? 0.8 : 1,
        '&:hover': {
          backgroundColor: activeTab === 'espera' ? 'transparent' : undefined,
        }
      }}
    >
      <ListItemAvatar>
        <Badge
          badgeContent={finalBadgeVisible ? badgeContent : 0}
          color="primary"
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: colors.primary.main,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              minWidth: '20px',
              height: '20px',
              top: '8px',
              right: '8px',
            },
          }}
        >
          <Avatar
            sx={{ 
              bgcolor: colors.secondary.var80,
              color: colors.secondary.var30,
              width: 40,
              height: 40,
            }}
          >
            <Person />
          </Avatar>
        </Badge>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: colors.secondary.var20,
                fontWeight: 500,
                flex: 1,
              }}
            >
              {contact.waId}
            </Typography>
            
            {/* Botón "Tomar Chat" solo en la pestaña "En Espera" */}
            {activeTab === 'espera' && onTakeChat && (
              <Button
                size="small"
                variant="contained"
                disabled={isTakingChat}
                onClick={handleTakeChat}
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5,
                  fontSize: '0.7rem',
                  backgroundColor: colors.primary.main,
                  '&:hover': {
                    backgroundColor: colors.primary.var80,
                  },
                  '&:disabled': {
                    backgroundColor: colors.secondary.var80,
                  }
                }}
                startIcon={isTakingChat ? undefined : <PersonAdd sx={{ fontSize: '14px !important' }} />}
              >
                {isTakingChat ? 'Tomando...' : 'Tomar'}
              </Button>
            )}
            
            <Typography 
              variant="caption" 
              sx={{ color: colors.secondary.var50 }}
            >
              {/* {contact.time} */}
            </Typography>
          </Box>
        }
      />
    </ContactListItem>
  );
});

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  allContacts = [],
  waitingContacts = [],
  selectedContact,
  onContactSelect,
  activeTab,
  onTabChange,
  onTakeChat,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visitedContacts, setVisitedContacts] = React.useState<Set<string>>(new Set());

  const [realtimeUnreadCounts, setRealtimeUnreadCounts] = React.useState<Map<number, number>>(new Map());

  React.useEffect(() => {
    const initialMap = new Map();
    contacts.forEach(contact => {
      if (contact.unreadCount && contact.unreadCount > 0) {
        initialMap.set(contact.id, contact.unreadCount);
      }
    });
    setRealtimeUnreadCounts(initialMap);
  }, []); // Solo ejecutar al montar
  
  // Efecto para escuchar actualizaciones de unread counts en tiempo real
  React.useEffect(() => {
    // ✅ Función optimizada que busca en todos los contactos disponibles
    const handleUnreadUpdate = (unreadData: UnreadCount[]) => {
      setRealtimeUnreadCounts(prevMap => {
        const newMap = new Map(prevMap);
        
        unreadData.forEach(item => {
          // ✅ Buscar en todos los contactos disponibles (contacts + allContacts)
          const allContactsList = [...contacts, ...allContacts];
          const contact = allContactsList.find(c => c.waId === item.waId);
          
          if (contact) {
            if (item.count > 0) {
              newMap.set(contact.id, item.count);
            } else {
              newMap.delete(contact.id);
            }
          }
        });
        return newMap;
      });
    };

    try {
      socketService.onUnreadCountUpdate(handleUnreadUpdate);
    } catch (error) {
      console.error('❌ Error configurando listener de unread counts:', error);
    }

    return () => {
      try {
        socketService.removeListener('unread_count_update', handleUnreadUpdate);
      } catch (error) {
        console.error('❌ Error removiendo listener:', error);
      }
    };
  }, []);
  
  // Crear un mapa de unreadCounts que combine datos iniciales + tiempo real
  const unreadCountsMap = React.useMemo(() => {
    const map = new Map();
    let propsCount = 0;
    let realtimeCount = 0;
    
    // Primero agregar los datos iniciales de los props
    contacts.forEach(contact => {
      if (contact.unreadCount && contact.unreadCount > 0) {
        map.set(contact.id, contact.unreadCount);
        propsCount++;
      }
    });
    
    // Luego sobrescribir/agregar con los datos en tiempo real
    realtimeUnreadCounts.forEach((count, contactId) => {
      if (count > 0) {
        map.set(contactId, count);
        realtimeCount++;
      } else {
        map.delete(contactId);
      }
    });
    
    return map;
  }, [contacts, realtimeUnreadCounts]);

  const handleContactSelect = React.useCallback((contact: any) => {

    setVisitedContacts(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(contact.id)) {
        newSet.add(contact.id);
      }
      return newSet;
    });

    setRealtimeUnreadCounts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(contact.id)) {
        newMap.delete(contact.id);
      }
      return newMap;
    });

    try {
      socketService.markAsRead(contact.waId);
    } catch (error) {
      console.error(`[handleContactSelect] Error marcando como leído:`, error);
    }

    onContactSelect(contact);
  }, [onContactSelect]);

  const shouldShowBadge = React.useCallback((contact: any) => {
    const isSelected = selectedContact?.id === contact.id;
    const hasUnread = (unreadCountsMap.get(contact.id) || 0) > 0;
    const isVisited = visitedContacts.has(contact.id);

    if (activeTab === 'cerrado') {
      return false;
    }

    if (isSelected) {
      return false;
    }

    if (hasUnread) {
      return true;
    }

    if (!isVisited) {
      return true;
    }
    return false;
  }, [selectedContact?.id, unreadCountsMap, visitedContacts, activeTab]);

  const getBadgeContent = React.useCallback((contact: any) => {
    const unreadCount = unreadCountsMap.get(contact.id) || 0;
    const isVisited = visitedContacts.has(contact.id);

    if (isVisited) {
      return unreadCount;
    }

    return Math.max(1, unreadCount);
  }, [unreadCountsMap, visitedContacts]);

  const contactCounts = React.useMemo(() => {
    if (!allContacts.length) {
      return { abierto: 0, espera: 0, cerrado: 0 };
    }

    const abierto = allContacts.filter(contact => contact.open === true).length;
    const espera = waitingContacts.length;
    const cerrado = 0;
    
    return { abierto, espera, cerrado };
  }, [allContacts, waitingContacts]); // ✅ Depender de waitingContacts

  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact =>
      contact.waId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Barra de búsqueda */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${colors.secondary.var80}` }}>
        <SearchField
          fullWidth
          placeholder="Buscar contactos o chats"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: colors.secondary.var50 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabs de estado */}
      <Box sx={{ borderBottom: `1px solid ${colors.secondary.var80}` }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => onTabChange(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              color: colors.secondary.var50,
              '&.Mui-selected': {
                color: colors.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.primary.main,
            },
          }}
        >
          <Tab 
            value="abierto" 
            label={
              <Badge 
                badgeContent={contactCounts.abierto} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: contactCounts.abierto > 0 ? '#1976d2' : 'transparent',
                    color: contactCounts.abierto > 0 ? 'white' : 'transparent',
                  }
                }}
              >
                Abierto
              </Badge>
            } 
          />
          <Tab 
            value="espera" 
            label={
              <Badge 
                badgeContent={contactCounts.espera} 
                color="warning"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: contactCounts.espera > 0 ? '#ed6c02' : 'transparent',
                    color: contactCounts.espera > 0 ? 'white' : 'transparent',
                  }
                }}
              >
                En espera
              </Badge>
            } 
          />
          <Tab 
            value="cerrado" 
            label={
              <Badge 
                badgeContent={contactCounts.cerrado} 
                color="success"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: contactCounts.cerrado > 0 ? '#2e7d32' : 'transparent',
                    color: contactCounts.cerrado > 0 ? 'white' : 'transparent',
                  }
                }}
              >
                Cerrado
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Lista de contactos */}
      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {filteredContacts.map((contact) => (
          <ContactItem
            key={`contact-${contact.id}-${contact.waId}`}
            contact={contact}
            isSelected={selectedContact?.id === contact.id}
            onContactSelect={handleContactSelect}
            shouldShowBadge={shouldShowBadge}
            getBadgeContent={getBadgeContent}
            activeTab={activeTab}
            onTakeChat={onTakeChat}
          />
        ))}
      </List>
    </Box>
  );
};

export default ContactList;
