import { useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import AccountCircle from "@mui/icons-material/AccountCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
// import Chip from "@mui/material/Chip";

import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { createLink } from "@tanstack/react-router";
import { Link as MUILink } from "@mui/material";
import { useSuspenseQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { fetchSession } from "@/queries/session";
import { useNavigate } from "@tanstack/react-router";
import { colors } from "@/styles/colors";
import { useAuth } from "@/hooks/useAuth";
import { assignExecutiveAvailable, executiveAvailable } from "@/api/chatService";

const drawerWidth = 240;
const drawerClosedWidth = 60;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: drawerClosedWidth,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: drawerWidth,
      },
    },
  ],
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: `calc(100% - ${drawerClosedWidth}px)`,
  marginLeft: `${drawerClosedWidth}px`,
  backgroundColor: colors.secondary.var95,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const CustomLink = createLink(MUILink);

export const LayoutComponent = ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [availabilityAnchorEl, setAvailabilityAnchorEl] = useState<null | HTMLElement>(null); // ✅ Nuevo estado
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  const navigate = useNavigate();
  const queryClientHook = useQueryClient();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAvailabilityMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAvailabilityAnchorEl(event.currentTarget);
  };

  const handleAvailabilityClose = () => {
    setAvailabilityAnchorEl(null);
  };

  const handleSetAvailable = async (available: boolean) => {
    if (!session?.executive?.id || isUpdatingAvailability) return;
    
    setIsUpdatingAvailability(true);
    
    try {
      queryClientHook.setQueryData(['session'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          executive: {
            ...oldData.executive,
            available: available,
          }
        };
      });

      const response = await executiveAvailable(session.executive.id, available);

      if (response.message && response.message.includes('successfully')) {
        if (response.result) {
          queryClientHook.setQueryData(['session'], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              executive: {
                ...oldData.executive,
                ...response.result,
              }
            };
          });
          await assignExecutiveAvailable(session.executive.id, session.executive.name);
        await queryClientHook.invalidateQueries({ queryKey: ['waitingContacts'] });
        await queryClientHook.invalidateQueries({ queryKey: ['openContacts'] });
        await queryClient.refetchQueries({
        queryKey: ["waitingContacts", session?.executive?.id],
        exact: true,
      });
      
      await queryClient.refetchQueries({
        queryKey: ["contacts", session?.executive?.id],
        exact: true,
      });
        }
      } else {
        throw new Error('Error del servidor');
      }

    } catch (error) {
      queryClientHook.setQueryData(['session'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          executive: {
            ...oldData.executive,
            available: session.executive.available
          }
        };
      });
    } finally {
      setIsUpdatingAvailability(false);
      handleAvailabilityClose(); // Cerrar menú
    }
  };

  const handleLogout = async () => {
    try {

      if (session?.executive?.id && session.executive.available) {
        
        try {
          await executiveAvailable(session.executive.id, false);
        } catch (error) {
          console.warn('⚠️ No se pudo marcar como no disponible antes del logout:', error);
        }
      }
      
      const API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL || "http://localhost:3000";
      const response = await fetch(`${API_WHATSAPP_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ logout: true }),
      });

      if (!response.ok) {
        console.error("Error during logout");
      }
      localStorage.removeItem("access_token");

      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.removeQueries({ queryKey: ["session"] });

      navigate({ to: "/login" });
    } catch (error) {
      localStorage.removeItem("access_token");
      navigate({ to: "/login" });
    }
  };

  const { data: session, isPending } = useSuspenseQuery(fetchSession());
  const { user } = useAuth();

  const menuItems = useMemo(
    () => {
      const baseItems = [
        {
          text: "Dashboard",
          icon: <InboxIcon />,
          to: "/dashboard",
        },
      ];

      if (user?.role === 'admin') {
        baseItems.push({
          text: "Administración",
          icon: <AdminPanelSettingsIcon />,
          to: "/admin",
        });
      }

      return baseItems;
    },
    [user?.role]
  );

  const handleDrawerEnter = () => {
    setOpen(true);
  };

  const handleDrawerLeave = () => {
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Eliminado: No marcar como no disponible al recargar/cerrar la página

  return (
    <Box sx={{ flexGrow: 1 }}>
      <CssBaseline />
      <AppBar position="static" open={open}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <div></div>

          {!isPending && session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              
              {/* ✅ Menú desplegable de disponibilidad independiente */}
              <Box sx={{ position: 'relative' }}>
                <Button
                  onClick={handleAvailabilityMenu}
                  disabled={isUpdatingAvailability}
                  variant="outlined"
                  startIcon={
                    session.executive?.available ? (
                      <CheckCircleIcon sx={{ color: colors.success.main }} />
                    ) : (
                      <PauseCircleIcon sx={{ color: colors.error.main }} />
                    )
                  }
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{
                    borderColor: session.executive?.available ? colors.success.main : colors.error.main,
                    color: session.executive?.available ? colors.success.main : colors.error.main,
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: session.executive?.available ? colors.success.var80 : colors.error.var80,
                      backgroundColor: session.executive?.available ? colors.success.var95 : colors.error.var95,
                    },
                    '&:disabled': {
                      opacity: 0.6
                    }
                  }}
                >
                  {isUpdatingAvailability 
                    ? "Actualizando..." 
                    : session.executive?.available 
                      ? "Disponible" 
                      : "No Disponible"
                  }
                </Button>
                
                <Menu
                  id="availability-menu"
                  anchorEl={availabilityAnchorEl}
                  open={Boolean(availabilityAnchorEl)}
                  onClose={handleAvailabilityClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: '8px',
                      minWidth: '180px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      border: `1px solid ${colors.secondary.var80}`
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleSetAvailable(true)}
                    disabled={isUpdatingAvailability || session.executive?.available}
                    sx={{ 
                      py: 1.5,
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    <CheckCircleIcon sx={{ mr: 2, color: colors.success.main }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Disponible
                    </Typography>
                  </MenuItem>
                  
                  <MenuItem 
                    onClick={() => handleSetAvailable(false)}
                    disabled={isUpdatingAvailability || !session.executive?.available}
                    sx={{ 
                      py: 1.5,
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    <PauseCircleIcon sx={{ mr: 2, color: colors.error.main }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      No Disponible
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>

              {/* Información del ejecutivo */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: colors.secondary.var90
                }
              }}
              onClick={handleMenu}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: colors.primary.main,
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {getInitials(session.executive?.name || 'Usuario')}
                </Avatar>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.secondary.var20,
                      fontWeight: 600,
                      lineHeight: 1.2
                    }}
                  >
                    {session.executive?.name || 'Usuario'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.secondary.var50,
                      lineHeight: 1.2
                    }}
                  >
                    {session.executive?.email}
                  </Typography>
                </Box>
              </Box>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: '8px',
                    minWidth: '200px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${colors.secondary.var80}`
                  }
                }}
              >
                <Box sx={{ p: 2, borderBottom: `1px solid ${colors.secondary.var80}` }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: colors.secondary.var20 }}>
                    {session.executive?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.secondary.var50 }}>
                    {session.executive?.email}
                  </Typography>
                </Box>
                
                {/* Divider removido - ya no hay MenuItem de disponibilidad aquí */}
                {/* <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                  <AccountCircle sx={{ mr: 2, color: colors.secondary.var50 }} />
                  Perfil
                </MenuItem>
                <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                  <AccountCircle sx={{ mr: 2, color: colors.secondary.var50 }} />
                  Configuración
                </MenuItem> */}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: colors.error.main }}>
                  <AccountCircle sx={{ mr: 2, color: colors.error.main }} />
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="inherit">Login</Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: open ? drawerWidth : drawerClosedWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : drawerClosedWidth,
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: "hidden",
            boxSizing: "border-box",
          },
        }}
        variant="permanent" // Cambio: siempre visible
        anchor="left"
        open={open}
        onMouseEnter={handleDrawerEnter}
        onMouseLeave={handleDrawerLeave}
      >
        <DrawerHeader>
          {open ? (
            // Logo completo cuando está abierto
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <img
                src="/images/logo_correos.svg"
                alt="Correos Chile"
                style={{
                  height: "22px",
                  width: "auto",
                  marginRight: "16px",
                }}
              />
            </Box>
          ) : (
            // Logo pequeño cuando está cerrado
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <img
                src="/images/iso_correos.svg"
                alt="Correos Chile"
                style={{
                  height: "20px",
                  width: "auto",
                }}
              />
            </Box>
          )}
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={CustomLink}
                to={item.to}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Drawer>
      <Main open={open}>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
        {/* <DrawerHeader /> */}
        {/* <Typography sx={{ marginBottom: 2 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus
          dolor purus non enim praesent elementum facilisis leo vel. Risus at
          ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum
          quisque non tellus. Convallis convallis tellus id interdum velit
          laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed
          adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies
          integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate
          eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo
          quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat
          vivamus at augue. At augue eget arcu dictum varius duis at consectetur
          lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien
          faucibus et molestie ac.
        </Typography>
        <Typography sx={{ marginBottom: 2 }}>
          Consequat mauris nunc congue nisi vitae suscipit. Fringilla est
          ullamcorper eget nulla facilisi etiam dignissim diam. Pulvinar
          elementum integer enim neque volutpat ac tincidunt. Ornare suspendisse
          sed nisi lacus sed viverra tellus. Purus sit amet volutpat consequat
          mauris. Elementum eu facilisis sed odio morbi. Euismod lacinia at quis
          risus sed vulputate odio. Morbi tincidunt ornare massa eget egestas
          purus viverra accumsan in. In hendrerit gravida rutrum quisque non
          tellus orci ac. Pellentesque nec nam aliquam sem et tortor. Habitant
          morbi tristique senectus et. Adipiscing elit duis tristique
          sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis
          eleifend. Commodo viverra maecenas accumsan lacus vel facilisis. Nulla
          posuere sollicitudin aliquam ultrices sagittis orci a.
        </Typography> */}
      </Main>
    </Box>
  );
};
