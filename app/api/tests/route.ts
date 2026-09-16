import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const tests = await db
        .select()
        .from(testCases)
        .where(eq(testCases.userId, userId));

    return NextResponse.json(tests);
}