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