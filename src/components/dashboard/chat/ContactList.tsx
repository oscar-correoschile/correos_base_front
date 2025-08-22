import React from 'react';
import {
  Box,
  List,
  ListItem,
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
  Chip,
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';
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
  selectedContact: Contact | null;
  onContactSelect: (contact: Contact) => void;
  activeTab: 'abierto' | 'espera' | 'cerrado';
  onTabChange: (tab: 'abierto' | 'espera' | 'cerrado') => void;
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

const StatusDot = styled(Box)<{ status: 'online' | 'away' | 'offline' }>(({ status }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: 
    status === 'online' ? colors.success.main :
    status === 'away' ? colors.warning.main :
    colors.secondary.var60,
  border: `2px solid ${colors.secondary.var99}`,
  position: 'absolute',
  bottom: 2,
  right: 2,
}));

const PriorityChip = styled(Chip)<{ priority: 'alta' | 'media' | 'baja' }>(({ priority }) => ({
  height: 20,
  fontSize: '0.7rem',
  backgroundColor: 
    priority === 'alta' ? colors.error.var90 :
    priority === 'media' ? colors.warning.var90 :
    colors.success.var90,
  color: 
    priority === 'alta' ? colors.error.main :
    priority === 'media' ? colors.warning.main :
    colors.success.main,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

const ContactItem = React.memo<{
  contact: any;
  isSelected: boolean;
  onContactSelect: (contact: any) => void;
  shouldShowBadge: (contact: any) => boolean;
  getBadgeContent: (contact: any) => number;
}>(({ contact, isSelected, onContactSelect, shouldShowBadge, getBadgeContent }) => {
  
  const badgeVisible = shouldShowBadge(contact);
  const badgeContent = getBadgeContent(contact);

  const finalBadgeVisible = badgeVisible && badgeContent > 0;

  console.log(`🏷️ ContactItem ${contact.waId}:`, {
    badgeVisible,
    badgeContent,
    finalBadgeVisible,
    unreadCount: contact.unreadCount,
    finalBadgeValue: finalBadgeVisible ? badgeContent : 0
  });
  
  return (
    <ContactListItem
      isSelected={isSelected}
      selected={isSelected}
      onClick={() => onContactSelect(contact)}
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
  selectedContact,
  onContactSelect,
  activeTab,
  onTabChange,
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
    console.log('🚀 Inicializando unread counts:', Object.fromEntries(initialMap));
  }, []); // Solo ejecutar al montar
  
  // Efecto para escuchar actualizaciones de unread counts en tiempo real
  React.useEffect(() => {
    console.log('🔌 Configurando listener para unread counts...');
    
    // Verificar estado de conexión del socket
    console.log('🔍 Estado del socket:', {
      service: !!socketService,
      // connected: socketService.isConnected() // Si existe este método
    });
    
    const handleUnreadUpdate = (unreadData: UnreadCount[]) => {
      console.log('📨 Actualizacion de unread counts recibida:', unreadData);
      console.log('📋 Contactos disponibles para mapear:', contacts.map(c => ({ id: c.id, waId: c.waId })));
      
      setRealtimeUnreadCounts(prevMap => {
        const newMap = new Map(prevMap);
        console.log('📊 Estado anterior del map:', Object.fromEntries(prevMap));
        
        // Actualizar con los nuevos datos
        unreadData.forEach(item => {
          // Buscar el contact.id correspondiente al waId
          const contact = contacts.find(c => c.waId === item.waId);
          if (contact) {
            if (item.count > 0) {
              newMap.set(contact.id, item.count);
              console.log(`✅ Actualizando unread count para contacto ${contact.id} (${contact.waId}): ${item.count}`);
            } else {
              newMap.delete(contact.id);
              console.log(`🗑️ Removiendo unread count para contacto ${contact.id} (${contact.waId})`);
            }
          } else {
            console.warn(`⚠️ No se encontró contacto con waId: ${item.waId}`);
          }
        });
        
        console.log('📊 Estado nuevo del map:', Object.fromEntries(newMap));
        return newMap;
      });
    };

    try {
      socketService.onUnreadCountUpdate(handleUnreadUpdate);
      console.log('✅ Listener de unread counts configurado');
    } catch (error) {
      console.error('❌ Error configurando listener de unread counts:', error);
    }
    
    // Cleanup
    return () => {
      console.log('🧹 Limpiando listener de unread counts');
    };
  }, [contacts]); // Dependemos de contacts para poder hacer el mapeo waId -> id
  
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
    
    console.log('� UnreadCounts map actualizado:', {
      fromProps: propsCount,
      fromRealtime: realtimeCount,
      total: map.size,
      finalMap: Object.fromEntries(map)
    });
    
    return map;
  }, [contacts, realtimeUnreadCounts]);

  // Función para manejar selección de contacto
  const handleContactSelect = React.useCallback((contact: any) => {
    console.log(`[handleContactSelect] Contacto seleccionado: ${contact.waId}`);
    
    // Marcar el contacto como visitado
    setVisitedContacts(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(contact.id)) {
        newSet.add(contact.id);
        console.log(`[handleContactSelect] Marcando contacto ${contact.id} como visitado`);
      }
      return newSet;
    });
    
    // ✅ Limpiar el unread count cuando se selecciona
    setRealtimeUnreadCounts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(contact.id)) {
        newMap.delete(contact.id);
        console.log(`[handleContactSelect] Limpiando unread count para contacto ${contact.id}`);
      }
      return newMap;
    });
    
    // ✅ Notificar al servidor que los mensajes se leyeron
    try {
      socketService.markAsRead(contact.waId);
      console.log(`[handleContactSelect] Marcando mensajes como leídos en servidor: ${contact.waId}`);
    } catch (error) {
      console.error(`[handleContactSelect] Error marcando como leído:`, error);
    }
    
    // Llamar la función original
    onContactSelect(contact);
  }, [onContactSelect]);
  
  // Función para determinar si mostrar badge
  const shouldShowBadge = React.useCallback((contact: any) => {
    const isSelected = selectedContact?.id === contact.id;
    const hasUnread = (unreadCountsMap.get(contact.id) || 0) > 0;
    const isVisited = visitedContacts.has(contact.id);
    
    console.log(`[shouldShowBadge] Contact ${contact.id}:`, {
      isSelected,
      hasUnread,
      isVisited,
      activeTab,
      unreadCount: unreadCountsMap.get(contact.id) || 0,
    });
    
    // ✅ NUEVA REGLA: Contactos cerrados NUNCA muestran badges
    if (activeTab === 'cerrado') {
      console.log(`[shouldShowBadge] Contact ${contact.id}: NO badge porque es tab cerrado`);
      return false;
    }
    
    // No mostrar badge si está seleccionado actualmente
    if (isSelected) {
      return false;
    }
    
    // ✅ PRIORIDAD 1: Si tiene mensajes no leídos, SIEMPRE mostrar badge (sin importar si fue visitado)
    if (hasUnread) {
      return true;
    }
    
    // ✅ PRIORIDAD 2: Si es un contacto nuevo (no visitado), mostrar badge
    if (!isVisited) {
      return true;
    }
    
    // En todos los demás casos, no mostrar badge
    return false;
  }, [selectedContact?.id, unreadCountsMap, visitedContacts, activeTab]);
  
  // Función para obtener el contenido del badge
  const getBadgeContent = React.useCallback((contact: any) => {
    const unreadCount = unreadCountsMap.get(contact.id) || 0;
    const isVisited = visitedContacts.has(contact.id);
    
    console.log(`[getBadgeContent] Contact ${contact.id}:`, {
      unreadCount,
      isVisited
    });
    
    // Si el contacto ha sido visitado, mostrar solo el número de mensajes no leídos
    if (isVisited) {
      return unreadCount;
    }
    
    // Si no ha sido visitado, es un contacto nuevo - mostrar 1 o el número de mensajes no leídos si los hay
    return Math.max(1, unreadCount);
  }, [unreadCountsMap, visitedContacts]);
  
  // ✅ Calcular contadores por estado - Memoizado estable
  const contactCounts = React.useMemo(() => {
    if (!allContacts.length) {
      return { abierto: 0, espera: 0, cerrado: 0 };
    }

    // ✅ Usar el campo 'activo' para determinar contactos abiertos y cerrados
    const abierto = allContacts.filter(contact => contact.activo === true).length;
    const espera = 0; // Implementar cuando tengamos contactos con status 'WAITING'
    const cerrado = allContacts.filter(contact => contact.activo === false).length;
    
    return { abierto, espera, cerrado };
  }, [allContacts]); // Solo depende de allContacts
  
  // ✅ Filtrar contactos - Memoizado estable
  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact =>
      contact.waId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]); // Solo depende de contacts y searchQuery
  
  console.log(filteredContacts);
  // const getInitials = (name: string) => {
  //   return name.split(' ').map(n => n[0]).join('').toUpperCase();
  // };

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
          />
        ))}
      </List>
    </Box>
  );
};

export default ContactList;
