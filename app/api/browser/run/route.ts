import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testExecutions } from "@/db/schema";
import { chromium } from "playwright";
import Browserbase from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
});

function isValidNavigationUrl(value: unknown): value is string {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    let session: Awaited<ReturnType<typeof browserbase.sessions.create>> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

    try {
        const { url, steps } = await req.json();
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        if (!isValidNavigationUrl(url) || !Array.isArray(steps) || !steps.length) {
            return NextResponse.json(
                { error: "A valid HTTP(S) URL and test steps are required" },
                { status: 400 }
            );
        }

        for (const action of steps) {
            if (action.type === "goto" && !isValidNavigationUrl(action.value)) {
                return NextResponse.json(
                    { error: "A goto action must include a valid HTTP(S) URL" },
                    { status: 400 }
                );
            }
        }

        session = await browserbase.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            api_timeout: 300,
        });

        browser = await chromium.connectOverCDP(session.connectUrl);

        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();

        const logs: string[] = [];

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        logs.push(`Opened ${url}`);

        for (const action of steps) {
            logs.push(`Executing: ${JSON.stringify(action)}`);

            if (action.type === "goto") {
                await page.goto(action.value, {
                    waitUntil: "domcontentloaded",
                });
            }

            else if (action.type === "click") {
                await page.getByText(action.selector, {
                    exact: false,
                }).first().click({ timeout: 5000 });
            }

            else if (action.type === "fill") {
                await page.locator(action.selector).fill(action.value ?? "");
            }

            else if (action.type === "expectText") {
                await page.getByText(action.selector, {
                    exact: false,
                }).first().waitFor({ timeout: 5000 });

                logs.push(`Verified text: ${action.selector}`);
            }

            else {
                logs.push(`Unsupported action: ${action.type}`);
            }
        }

        const title = await page.title();
        await db.insert(testExecutions).values({
            id: crypto.randomUUID(),
            userId,
            status: "passed",
            sessionId: session.id,
            logs: JSON.stringify(logs),
        });

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            title,
            logs,
        });
    } catch (error) {
        if (session) {
            await db.insert(testExecutions).values({
                id: crypto.randomUUID(),
                userId: (await auth()).userId!,
                status: "failed",
                sessionId: session.id,
                logs: JSON.stringify([
                    "Browser execution failed",
                    String(error),
                ]),
            });
        }
        console.error("BROWSER ERROR:", error);

        const status = typeof error === "object" && error !== null && "status" in error
            ? error.status
            : undefined;

        if (status === 429) {
            return NextResponse.json(
                { error: "Browser capacity is currently full. Please try again shortly." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Browser execution failed" },
            { status: 500 }
        );
    } finally {
        try {
            await browser?.close();
        } finally {
            if (session) {
                try {
                    await browserbase.sessions.update(session.id, {
                        status: "REQUEST_RELEASE",
                    });
                } catch (releaseError) {
                    console.error("BROWSER SESSION RELEASE ERROR:", releaseError);
                }
            }
        }
    }
}