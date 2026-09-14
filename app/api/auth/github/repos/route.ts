import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user?.githubAccessToken) {
        return NextResponse.json(
            { error: "GitHub not connected" },
            { status: 400 }
        );
    }

    const octokit = new Octokit({
        auth: user.githubAccessToken,
    });

    const { data } =
        await octokit.rest.repos.listForAuthenticatedUser();

    return NextResponse.json(data);
}