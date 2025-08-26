const VITE_API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL;

const getAccessToken = (): string => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No se encontró token de acceso en localStorage');
  }
  return token;
};
export async function sendMessage(waId: string, message: string) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/meta/send_message`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
            body: JSON.stringify({ waId, message }),
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const text = await res.text();
        if (!text || text.trim() === '') {
            return { 
                id: Date.now(), 
                success: true, 
                timestamp: new Date().toISOString(),
                message: 'Enviado exitosamente'
            };
        }
        
        try {
            return JSON.parse(text);
        } catch (jsonError) {
            return { 
                id: Date.now(), 
                success: true, 
                timestamp: new Date().toISOString(),
                rawResponse: text
            };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error(`Error enviando mensaje: ${errorMessage}`);
    }
}

export async function getMessages(waId: string) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/chats?waId=${waId}&take=50`, {
            method: "GET",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const text = await res.text();
        if (!text || text.trim() === '') {
            return [];
        }
        
        try {
            const messages = JSON.parse(text);
            return messages;
        } catch (jsonError) {
            return [];
        }
    } catch (error) {
        throw new Error("No se pudieron obtener los mensajes");
    }
}

export async function getOpenContacts(executiveId: number) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/executive_sessions?executiveId=${executiveId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const text = await res.text();
        if (!text || text.trim() === '') {
            return [];
        }
        
        try {
            return JSON.parse(text);
        } catch (jsonError) {
            return [];
        }
    } catch (error) {
        throw new Error("No se pudieron obtener los contactos");
    }
}

export async function closeChat(waId: string) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/close_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
            body: JSON.stringify({ waId }),
        });
        if (!res.ok) throw new Error("No se pudo cerrar el chat");
        return res.json();
        
    } catch (error) {
        throw new Error("No se pudo cerrar el chat");
    }
}

export async function getClosedChats() {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/closed_chats`, {
            method: "GET",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
        });
        if (!res.ok) throw new Error("No se pudieron obtener los chats cerrados");
        return res.json();
        
    } catch (error) {
        throw new Error("No se pudieron obtener los chats cerrados");
    }
}

export async function getWaitingChats() {
    
    try {
        const accessToken = getAccessToken();
        
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/get_waiting`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`No se pudieron obtener los chats en espera: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        
        return data;
    } catch (error) {
        throw new Error("No se pudieron obtener los chats en espera");
    }
}

export async function executiveAvailable(executiveId: number, available: boolean) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/toggle_executive_availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
            body: JSON.stringify({ executiveId, available }),
        });
        if (!res.ok) throw new Error("No se pudo obtener el estado del ejecutivo");
        return res.json();
    } catch (error) {
        throw new Error("No se pudo obtener el estado del ejecutivo");
    }
}

export async function takeChats(waId: string, executiveId: number, executiveName: string) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/take_chats`, {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
            body: JSON.stringify({ waId, executiveId, executiveName }),
        });
        if (!res.ok) throw new Error("No se pudo asignar el chat");
        return res.json();
    } catch (error) {
        throw new Error("No se pudo asignar el chat");
    }
}

export async function assignExecutiveAvailable(executiveId: number, executiveName: string) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/available_executive`, {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
             },
            body: JSON.stringify({ executiveId, executiveName }),
        });
        if (!res.ok) throw new Error("No se pudo asignar el chat");
        return res.json();
    } catch (error) {
        throw new Error("No se pudo asignar el chat");
    }
}
