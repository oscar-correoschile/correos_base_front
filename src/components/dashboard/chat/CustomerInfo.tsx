import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Person, Phone, Email, Assignment, Schedule } from '@mui/icons-material';
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

interface CustomerInfoProps {
  contact: Contact;
}

const InfoSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1, 2),
}));

const StatusChip = styled(Chip)<{ status: 'reclamation' | 'priority' | 'attention' }>(({ status }) => ({
  fontSize: '0.75rem',
  height: 24,
  backgroundColor: 
    status === 'reclamation' ? colors.error.var90 :
    status === 'priority' ? colors.warning.var90 :
    colors.success.var90,
  color: 
    status === 'reclamation' ? colors.error.main :
    status === 'priority' ? colors.warning.main :
    colors.success.main,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

const CustomerInfo: React.FC<CustomerInfoProps> = ({ contact }) => {
  const customerData = {
    name: 'Ana',
    phone: '+52 123: 46 780',
    tags: [
      { label: 'Reclamo', type: 'reclamation' as const },
      { label: 'Prioridad alta', type: 'priority' as const },
    ],
    status: 'En atención',
    activities: [
      {
        time: '12:29',
        action: 'Transferido desde el bot',
        description: 'Hola, necesito ayuda con mi pedido.',
      },
    ],
  };

  return (
    <Box>
      {/* Header con nombre y teléfono */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ color: colors.secondary.var20, fontWeight: 600 }}>
            {contact.waId}
          </Typography>
          <Button
            variant="text"
            size="small"
            sx={{ 
              color: colors.secondary.var50,
              minWidth: 'auto',
              p: 0.5,
            }}
          >
            ⋮
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ color: colors.secondary.var50, mb: 2 }}>
          +52 123 455 7890
        </Typography>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <ActionButton
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: colors.secondary.var80,
              color: colors.secondary.var50,
              flex: 1,
            }}
          >
            Cerrar
          </ActionButton>
          {/* <ActionButton
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: colors.secondary.var80,
              color: colors.secondary.var50,
              flex: 1,
            }}
          >
            Transferir
          </ActionButton> */}
          <ActionButton
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: colors.secondary.var80,
              color: colors.secondary.var50,
              flex: 1,
            }}
          >
            Agregar nota
          </ActionButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Información del cliente */}
      <InfoSection>
        <Typography variant="subtitle2" sx={{ color: colors.secondary.var20, fontWeight: 600, mb: 2 }}>
          Info del cliente
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Person sx={{ fontSize: 16, color: colors.secondary.var50, mr: 1 }} />
            <Typography variant="body2" sx={{ color: colors.secondary.var50, minWidth: 60 }}>
              Name
            </Typography>
            <Typography variant="body2" sx={{ color: colors.secondary.var20 }}>
              {customerData.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Phone sx={{ fontSize: 16, color: colors.secondary.var50, mr: 1 }} />
            <Typography variant="body2" sx={{ color: colors.secondary.var50, minWidth: 60 }}>
              Teléfono
            </Typography>
            <Typography variant="body2" sx={{ color: colors.secondary.var20 }}>
              {customerData.phone}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Assignment sx={{ fontSize: 16, color: colors.secondary.var50, mr: 1 }} />
            <Typography variant="body2" sx={{ color: colors.secondary.var50, minWidth: 60 }}>
              Etaiga
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {customerData.tags.map((tag, index) => (
                <StatusChip
                  key={index}
                  label={tag.label}
                  status={tag.type}
                  size="small"
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: colors.success.main,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: colors.secondary.var50, minWidth: 60 }}>
              Status
            </Typography>
            <Typography variant="body2" sx={{ color: colors.secondary.var20 }}>
              {customerData.status}
            </Typography>
          </Box>
        </Box>
      </InfoSection>

      <Divider sx={{ mb: 3 }} />

      {/* Actividad reciente */}
      <InfoSection>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Schedule sx={{ fontSize: 16, color: colors.secondary.var50, mr: 1 }} />
          <Typography variant="body2" sx={{ color: colors.secondary.var50, flex: 1 }}>
            Transferido desde el bot
          </Typography>
          <Typography variant="caption" sx={{ color: colors.secondary.var50 }}>
            12:29
          </Typography>
        </Box>
        
        <Box sx={{ 
          backgroundColor: colors.success.var95,
          borderRadius: 1,
          p: 1.5,
          mb: 2,
        }}>
          <Typography variant="body2" sx={{ color: colors.secondary.var20 }}>
            Hola, necesito ayuda con mi pedido.
          </Typography>
        </Box>
        
        <Box sx={{ 
          backgroundColor: colors.primary.var95,
          borderRadius: 1,
          p: 1.5,
          mb: 2,
        }}>
          <Typography variant="body2" sx={{ color: colors.secondary.var20 }}>
            Hola, Ana. Claro, ¿en qué puedo asistirte?
          </Typography>
          <Typography variant="caption" sx={{ color: colors.secondary.var50 }}>
            12:31
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: colors.secondary.var20, mb: 1 }}>
          El producto que recibí está dañado.
        </Typography>
        
        <Box sx={{ 
          backgroundColor: colors.secondary.var95,
          borderRadius: 1,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: colors.secondary.var50,
            }}
          />
          <Typography variant="body2" sx={{ color: colors.secondary.var50 }}>
            Seleccionar respuesta rápida
          </Typography>
        </Box>
      </InfoSection>
    </Box>
  );
};

export default CustomerInfo;
