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

interface Contact {
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

interface ContactListProps {
  contacts: Contact[];
  // selectedContact: Contact | null;
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

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  // selectedContact,
  onContactSelect,
  activeTab,
  onTabChange,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const filteredContacts = contacts.filter(contact =>
    // contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    contact.waId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
              <Badge badgeContent={3} color="primary">
                Abierto
              </Badge>
            } 
          />
          <Tab value="espera" label="En espera" />
          <Tab value="cerrado" label="Cerrado" />
        </Tabs>
      </Box>

      {/* Lista de contactos */}
      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {filteredContacts.map((contact) => (
          <ContactListItem
            key={contact.id}
            isSelected={false}
            selected={false}
            onClick={() => onContactSelect(contact)}
          >
            <ListItemAvatar>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{ 
                    bgcolor: colors.secondary.var80,
                    color: colors.secondary.var30,
                    width: 40,
                    height: 40,
                  }}
                >
                  {/* {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} />
                  ) : (
                    getInitials(contact.waId)
                  )} */}
                </Avatar>
                {/* <StatusDot status={contact.status} /> */}
              </Box>
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
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: colors.secondary.var50,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {/* {contact.lastMessage} */}
                  </Typography>
                  {/* <PriorityChip 
                    label={contact.priority.charAt(0).toUpperCase() + contact.priority.slice(1)}
                    priority={contact.priority}
                    size="small"
                  /> */}
                </Box>
              }
            />
            
            {/* {contact.unreadCount && contact.unreadCount > 0 && (
              <Badge 
                badgeContent={contact.unreadCount} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: colors.primary.main,
                    color: 'white',
                  },
                }}
              />
            )} */}
          </ContactListItem>
        ))}
      </List>
    </Box>
  );
};

export default ContactList;
