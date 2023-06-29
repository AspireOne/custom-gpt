import {NextRequest, NextResponse} from "next/server";
import {createLLMService} from "usellm";
import {checkAuthed} from "~/pages/api/utils/utils";

export const config = {
    runtime: 'edge',
};

const llmService = createLLMService({
    openaiApiKey: process.env.OPENAI_API_KEY, // provide OpenAI API key
    actions: ["chat"], // enable specific actions
    templates: {
        gpt3516: {
            id: "gpt-3.5-16k",
            systemPrompt: "You are a helpful expert programming assistant.",
            model: "gpt-3.5-turbo-16k"
        },
        jesus: {
            id: "default-jesus",
            // TODO: Upravit prompt
            systemPrompt: "Jsi Ježíš. Odpovídáš lidem, radíš jim, povídáš si s němi. Musíš za každou" +
                " cenu zůstat v roli Ježíše. Piš krátké zprávy.",
            model: "gpt-3.5-turbo",
            max_tokens: 2000,
        },
    }
});

export default async function handler(request: Request) {
    checkAuthed(request);

    const body = await request.json();

    try {
        const { result } = await llmService.handle({ body, request });
        return new Response(result, { status: 200 });
    } catch (error: any) {
        return new Response(error.message, { status: error?.status || 400 });
    }
}