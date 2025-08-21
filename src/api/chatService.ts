const VITE_API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL;

const getAccessToken = (): string => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No se encontró token de acceso en localStorage');
  }
  return token;
};
export async function sendMessage(waId: string, message: string) {
    console.log({ waId, message });
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
            console.log('✅ Mensaje enviado - respuesta vacía del servidor');
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
            console.warn('⚠️ Respuesta no es JSON válido:', text);
            return { 
                id: Date.now(), 
                success: true, 
                timestamp: new Date().toISOString(),
                rawResponse: text
            };
        }
    } catch (error) {
        console.error('❌ Error en sendMessage:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error(`Error enviando mensaje: ${errorMessage}`);
    }
}

export async function getMessages(waId: string) {
    console.log('🔍 API: Solicitando mensajes para:', waId);
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
            console.log('⚠️ No hay mensajes para:', waId);
            return [];
        }
        
        try {
            const messages = JSON.parse(text);
            console.log('📨 API: Mensajes recibidos:', {
                waId,
                count: messages.length,
                lastMessage: messages[messages.length - 1],
                allMessageIds: messages.map((m: any) => m.id),
                allTimestamps: messages.map((m: any) => ({
                    id: m.id,
                    timestamp: m.metaTimestamp,
                    message: m.message.slice(0, 30) + '...'
                }))
            });
            return messages;
        } catch (jsonError) {
            console.error('❌ Error parsing JSON para getMessages:', text);
            return [];
        }
    } catch (error) {
        console.error('❌ Error en getMessages:', error);
        throw new Error("No se pudieron obtener los mensajes");
    }
}

export async function getContacts(executiveId: number) {
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
            console.log('⚠️ No hay contactos para executive:', executiveId);
            return [];
        }
        
        try {
            return JSON.parse(text);
        } catch (jsonError) {
            console.error('❌ Error parsing JSON para getContacts:', text);
            return [];
        }
    } catch (error) {
        console.error('❌ Error en getContacts:', error);
        throw new Error("No se pudieron obtener los contactos");
    }
}

export async function closeChat(waId: string) {
    console.log('🔒 API: Cerrando chat para:', waId);
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
}
