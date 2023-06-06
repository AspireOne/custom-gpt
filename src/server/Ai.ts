import {OpenAIApi} from "openai";
import {Message} from "~/server/ChatUtils";

export default class Ai {
    static async generateResponse(messages: Message[], api: OpenAIApi, userMail?: string): Promise<string> {
        const completion = await api.createChatCompletion({
            messages: messages,
            model: "gpt-3.5-turbo",
            user: userMail,
            max_tokens: 1500,
        });

        // @ts-ignore
        const response = completion?.data?.choices?.[0].message?.content ?? null;
        if (!response) throw new Error("Invalid response from OpenAI.");
        return response;
    }
}