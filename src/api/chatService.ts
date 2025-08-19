const VITE_API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL;
export async function sendMessage(waId: string, message: string) {
    console.log({ waId, message });
    const res = await fetch(`${VITE_API_WHATSAPP_URL}/meta/send_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waId, message }),
    });
    if (!res.ok) throw new Error("No se pudo enviar el mensaje");
    return res.json();
}

export async function getMessages(waId: string) {
    const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/chats?waId=${waId}&take=10`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("No se pudieron obtener los mensajes");
    return res.json();
}

export async function getContacts(executiveId: number) {
    const res = await fetch(`${VITE_API_WHATSAPP_URL}/maintainer/executive_sessions?executiveId=${executiveId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("No se pudieron obtener los contactos");
    return res.json();
}

export async function transferChat(waId: string, agentId: string) {
    const res = await fetch(`https://${VITE_API_WHATSAPP_URL}/meta/conversation/${waId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
    });
    if (!res.ok) throw new Error("No se pudo transferir el chat");
    return res.json();
}

export async function getChatHistory(waId: string) {
    const res = await fetch(`https://${VITE_API_WHATSAPP_URL}/meta/conversation/${waId}/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("No se pudo obtener el historial de chat");
    return res.json();
}
