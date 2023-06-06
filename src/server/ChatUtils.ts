export type Message = {
    role: "assistant" | "user" | "system",
    content: string,
}

export const enum Role {
    system = "system",
    user = "user",
    assistant = "assistant",
}

export default class ChatUtils {
    static constructMessage(role: Role, message: string) {
        return {
            role: role,
            content: message,
        }
    }
}