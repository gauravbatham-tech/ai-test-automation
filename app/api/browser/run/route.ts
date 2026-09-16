import { chromium } from "playwright";
import Browserbase from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { url, steps } = await req.json();

        if (!url || !steps?.length) {
            return NextResponse.json(
                { error: "URL and test steps are required" },
                { status: 400 }
            );
        }

        const session = await browserbase.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
        });

        const browser = await chromium.connectOverCDP(session.connectUrl);

        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();

        const logs: string[] = [];

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        logs.push(`Opened ${url}`);

        for (const step of steps) {
            logs.push(`Executing: ${step}`);

            const lower = step.toLowerCase();

            if (lower.includes("click")) {
                const text = step
                    .replace(/click/i, "")
                    .replace(/button/i, "")
                    .trim();

                if (text) {
                    await page.getByText(text, { exact: false }).first().click();
                }
            } else if (lower.includes("navigate") || lower.includes("open")) {
                const match = step.match(/https?:\/\/[^\s]+/);

                if (match) {
                    await page.goto(match[0], {
                        waitUntil: "domcontentloaded",
                    });
                }
            } else {
                logs.push(`Skipped unsupported action: ${step}`);
            }
        }

        const title = await page.title();

        await browser.close();

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            title,
            logs,
        });
    } catch (error) {
        console.error("BROWSER ERROR:", error);

        return NextResponse.json(
            { error: "Browser execution failed" },
            { status: 500 }
        );
    }
}