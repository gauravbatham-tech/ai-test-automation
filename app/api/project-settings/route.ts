import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projectSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const repository = searchParams.get("repository");

    if (!repository) {
        return NextResponse.json(
            { error: "Repository is required" },
            { status: 400 }
        );
    }

    const settings = await db
        .select()
        .from(projectSettings)
        .where(
            and(
                eq(projectSettings.userId, userId),
                eq(projectSettings.repository, repository)
            )
        );

    return NextResponse.json(settings[0] ?? null);
}

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const body = await req.json();

    const {
        repository,
        targetUrl,
        demoEmail,
        demoPassword,
        globalInstructions,
    } = body;

    if (!repository || !targetUrl) {
        return NextResponse.json(
            {
                error:
                    "Repository and target URL are required",
            },
            { status: 400 }
        );
    }

    const existing = await db
        .select()
        .from(projectSettings)
        .where(
            and(
                eq(projectSettings.userId, userId),
                eq(projectSettings.repository, repository)
            )
        );

    if (existing.length) {
        const updated = await db
            .update(projectSettings)
            .set({
                targetUrl,
                demoEmail: demoEmail || null,
                demoPassword: demoPassword || null,
                globalInstructions:
                    globalInstructions || null,
                updatedAt: new Date(),
            })
            .where(
                eq(projectSettings.id, existing[0].id)
            )
            .returning();

        return NextResponse.json(updated[0]);
    }

    const created = await db
        .insert(projectSettings)
        .values({
            id: crypto.randomUUID(),
            userId,
            repository,
            targetUrl,
            demoEmail: demoEmail || null,
            demoPassword: demoPassword || null,
            globalInstructions:
                globalInstructions || null,
        })
        .returning();

    return NextResponse.json(created[0]);
}