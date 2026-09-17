import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testExecutions } from "@/db/schema";
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

    const executions = await db
        .select()
        .from(testExecutions)
        .where(eq(testExecutions.userId, userId));

    return NextResponse.json(executions);
}