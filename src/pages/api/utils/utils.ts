export function checkAuthed(request: Request) {
    const cookie = request.headers.get("cookie");
    const authed = cookie!.includes("next-auth.session-token")
        && cookie!.includes("next-auth.csrf-token");

    if (!authed) {
        return new Response("Unauthorized", { status: 401 });
    }
}