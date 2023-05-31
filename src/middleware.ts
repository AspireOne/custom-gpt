// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {getToken} from "next-auth/jwt"
import paths from "~/paths";

//documentation, cookies, sessions etc.: https://nextjs.org/docs/advanced-features/middleware
// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
    // get part of url after hostname.
    const pathname = new URL(req.url).pathname;
    const hostname = new URL(req.url).hostname;

    /*if (pathname.startsWith(paths.bot)) {
        if (!await isSignedIn(req))
            return NextResponse.redirect(new URL(paths.index, req.url));
    }*/

    return NextResponse.next()
}

async function isSignedIn(req: NextRequest): Promise<boolean> {
    return getToken({ req, secret: process.env.SECRET })
        .then((session) => !!session?.email);

    // You could also check for any property on the session object,
    // like role === "admin" or name === "John Doe", etc.
}