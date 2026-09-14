import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();

    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id")!,
        "svix-timestamp": headerPayload.get("svix-timestamp")!,
        "svix-signature": headerPayload.get("svix-signature")!,
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    let event;

    try {
        event = wh.verify(body, svixHeaders) as unknown as {
            type: string;
            data: {
                id: string;
                email_addresses: { email_address: string }[];
            };
        };
    } catch {
        return new NextResponse("Invalid signature", { status: 400 });
    }

    if (event.type === "user.created") {
        await db.insert(users).values({
            id: event.data.id,
            email: event.data.email_addresses[0].email_address,
        });
    }

    return NextResponse.json({ success: true });
}