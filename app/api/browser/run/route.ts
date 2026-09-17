import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testExecutions } from "@/db/schema";
import { chromium } from "playwright";
import Browserbase from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
});

function isValidUrl(value: unknown): value is string {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    try {
        const parsed = new URL(value);

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    let session:
        | Awaited<
            ReturnType<typeof browserbase.sessions.create>
        >
        | undefined;

    let browser:
        | Awaited<ReturnType<typeof chromium.connectOverCDP>>
        | undefined;

    const logs: string[] = [];

    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { url, steps } = await req.json();

        if (
            !isValidUrl(url) ||
            !Array.isArray(steps) ||
            !steps.length
        ) {
            return NextResponse.json(
                {
                    error:
                        "A valid HTTP(S) URL and test actions are required",
                },
                { status: 400 }
            );
        }

        for (const action of steps) {
            if (
                !action ||
                typeof action !== "object" ||
                !["goto", "click", "fill", "expectText"].includes(
                    action.type
                )
            ) {
                return NextResponse.json(
                    { error: "Invalid browser action" },
                    { status: 400 }
                );
            }

            if (
                typeof action.selector !== "string" ||
                !action.selector.trim()
            ) {
                return NextResponse.json(
                    { error: "Browser action selector is required" },
                    { status: 400 }
                );
            }

            if (
                action.type === "goto" &&
                !isValidUrl(action.value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "goto actions require a valid HTTP(S) URL",
                    },
                    { status: 400 }
                );
            }
        }

        session = await browserbase.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            api_timeout: 300,
        });

        logs.push(`Browserbase session created: ${session.id}`);

        browser = await chromium.connectOverCDP(
            session.connectUrl
        );

        const context = browser.contexts()[0];

        const page =
            context.pages()[0] ||
            (await context.newPage());

        logs.push(`Opening target: ${url}`);

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        logs.push(`Opened ${url}`);

        for (const action of steps) {
            logs.push(
                `Action: ${action.type} | ${action.selector}`
            );

            if (action.type === "goto") {
                await page.goto(action.value, {
                    waitUntil: "domcontentloaded",
                });

                logs.push(`Navigated to ${action.value}`);
            }

            else if (action.type === "click") {
                const locator = page.getByText(
                    action.selector,
                    { exact: true }
                ).first();

                await locator.waitFor({
                    state: "visible",
                    timeout: 10000,
                });

                await locator.click();

                logs.push(
                    `Clicked "${action.selector}"`
                );
            }

            else if (action.type === "fill") {
                const locator =
                    page.locator(action.selector).first();

                await locator.waitFor({
                    state: "visible",
                    timeout: 10000,
                });

                await locator.fill(
                    action.value ?? ""
                );

                logs.push(
                    `Filled "${action.selector}"`
                );
            }

            else if (action.type === "expectText") {
                const locator = page.getByText(
                    action.selector,
                    { exact: false }
                ).first();

                await locator.waitFor({
                    state: "visible",
                    timeout: 10000,
                });

                logs.push(
                    `Verified "${action.selector}"`
                );
            }
        }

        const title = await page.title();
        const sessionResult = {
            sessionId: session.id,
            status: "passed",
            title,
            logs,
        };

        logs.push("All actions completed successfully");

        await db.insert(testExecutions).values({
            id: crypto.randomUUID(),
            userId,
            status: "passed",
            sessionId: session.id,
            recordingUrl: null,
            logs: JSON.stringify(logs),
        });

        return NextResponse.json({
            success: true,
            status: "passed",
            sessionId: session.id,
            title,
            logs,
        });
    } catch (error) {
        console.error("BROWSER ERROR:", error);

        logs.push(
            `Execution failed: ${error instanceof Error
                ? error.message
                : String(error)
            }`
        );

        try {
            const { userId } = await auth();

            if (userId && session) {
                await db.insert(testExecutions).values({
                    id: crypto.randomUUID(),
                    userId,
                    status: "failed",
                    sessionId: session.id,
                    recordingUrl: null,
                    logs: JSON.stringify(logs),
                });
            }
        } catch (dbError) {
            console.error(
                "EXECUTION SAVE ERROR:",
                dbError
            );
        }

        return NextResponse.json(
            {
                success: false,
                status: "failed",
                sessionId: session?.id ?? null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Browser execution failed",
                logs,
            },
            { status: 500 }
        );
    } finally {
        try {
            await browser?.close();
        } finally {
            if (session) {
                try {
                    await browserbase.sessions.update(
                        session.id,
                        {
                            status: "REQUEST_RELEASE",
                        }
                    );
                } catch (releaseError) {
                    console.error(
                        "BROWSER SESSION RELEASE ERROR:",
                        releaseError
                    );
                }
            }
        }
    }
}