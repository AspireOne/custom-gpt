/*
import {z} from "zod";
import {createTRPCRouter, protectedProcedure,} from "~/server/api/trpc";
import {Prisma} from ".prisma/client";
import {prisma} from "~/server/db";
import ChatUtils, {Role} from "~/server/ChatUtils";
import Ai from "~/server/Ai";
import {TRPCError} from "@trpc/server";

const Chat = z.object({
    id: z.string(),
    messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string()
    }))
})
export type ChatType = z.infer<typeof Chat>;


export const chatRouter = createTRPCRouter({
    getReply: protectedProcedure
        .output(z.object({
            content: z.string(),
        }))
        .input(z.object({
            chatId: z.string(),
            message: z.string()
        }))
        .mutation(async ({input, ctx}) => {
            const chat = await prisma.chat.findFirstOrThrow({
                where: {
                    id: input.chatId
                },
                include: {
                    messages: {
                        select: {
                            role: true,
                            content: true
                        }
                    }
                },
            });

            const messages = chat.messages;
            messages.push(ChatUtils.constructMessage(Role.user, input.message));

            let response;
            try {
                // @ts-ignore
                response = await Ai.generateResponse(messages, ctx.session.user.email);
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Spojení s nebem se dočasně přerušilo. Zkuste to prosím později.",
                    cause: error
                });
            }

            prisma.message.create({
                data: {
                    chatId: input.chatId,
                    content: input.message,
                    role: "user"
                }
            })
            prisma.message.create({
                data: {
                    chatId: input.chatId,
                    content: response,
                    role: "assistant"
                }
            })

            return {content: response};
        }),

    getAll: protectedProcedure
        .output(z.array(
            z.object({
                id: z.string(),
                preview: z.string(),
                updatedAt: z.date(),
            })
        ))
        .query(async ({input, ctx}) => {
            // Get all user chats and the last message in each chat.
            const chats = await prisma.chat.findMany({
                where: {
                    userId: ctx.session.user.id,
                },
                include: {
                    // only last message
                    messages: {
                        orderBy: {
                            createdAt: "desc"
                        },
                        take: 1,
                        select: {
                            id: true,
                            content: true
                        }
                    }
                }
            })
            return chats.map(chat => {
                return {
                    id: chat.id,
                    updatedAt: chat.updatedAt,
                    preview: chat.messages[0]!.content.substring(0, 50)
                }
            })
        }),

    get: protectedProcedure
        .input(z.object({id: z.string()}))
        .output(Chat)
        .query(async ({input, ctx}) => {
            return await prisma.chat.findFirstOrThrow({
                where: {
                    id: input.id
                },
                include: {
                    messages: {
                        select: {
                            id: true,
                            content: true,
                            role: true
                        },
                    }
                }
            })
        }),

    create: protectedProcedure
        .output(z.object({id: z.string()}))
        .query(async ({ctx}) => {
            // generate random id.
            const id = Math.random().toString(36).substring(7);
            // TODO: Example.
            await prisma.chat.create({
                data: {
                    id: id,
                    userId: ctx.session.user.id,
                    messages: {
                        create: {
                            role: "system",
                            content: "Jsi nápomocný rádce Ježíš. Mluvíš jako Ježíš z bible a pomáháš lidem s jejich problémy."
                        }
                    }
                }
            })
            return {id: id};
        })
});
*/
