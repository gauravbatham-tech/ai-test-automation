import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    const tests = repository
        ? await db
            .select()
            .from(testCases)
            .where(eq(testCases.userId, userId))
        : await db
            .select()
            .from(testCases)
            .where(eq(testCases.userId, userId));

    const filteredTests = repository
        ? tests.filter((test) => test.repository === repository)
        : tests;

    return NextResponse.json(filteredTests);
}