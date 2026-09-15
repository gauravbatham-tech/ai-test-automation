import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            { error: "Missing authorization code" },
            { status: 400 }
        );
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const data = await response.json();

    if (!data.access_token) {
        await db
            .update(users)
            .set({
                githubAccessToken: data.access_token,
            })
            .where(eq(users.id, userId));
    }

    return NextResponse.json({
        message: "GitHub connected successfully",
    });
}