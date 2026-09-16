import { chromium } from "playwright";
import Browserbase from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const session = await browserbase.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
        });

        const browser = await chromium.connectOverCDP(session.connectUrl);

        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        const title = await page.title();

        await browser.close();

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url,
            title,
        });
    } catch (error) {
        console.error("BROWSER ERROR:", error);

        return NextResponse.json(
            { error: "Browser execution failed" },
            { status: 500 }
        );
    }
}