import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { repository, files } = await req.json();

        if (!repository || !files?.length) {
            return NextResponse.json(
                { error: "Repository code is required" },
                { status: 400 }
            );
        }

        const source = files
            .map(
                (file: { path: string; content: string }) =>
                    `FILE: ${file.path}\n${file.content}`
            )
            .join("\n\n")
            .slice(0, 100000);

        const response = await openai.responses.create({
            model: "gpt-5-mini",
            input: `You are an expert QA engineer.

Generate 5-10 useful end-to-end test cases.

Return ONLY valid JSON:
{
  "tests": [
    {
      "title": "string",
      "category": "UI",
      "steps": ["string"],
      "expectedResult": "string"
    }
  ]
}

Repository: ${repository}

SOURCE:
${source}`,
        });

        const cleaned = response.output_text
            .trim()
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "");

        const result = JSON.parse(cleaned);

        for (const test of result.tests) {
            await db.insert(testCases).values({
                id: crypto.randomUUID(),
                userId,
                repository,
                title: test.title,
                category: test.category,
                steps: JSON.stringify(test.steps),
                expectedResult: test.expectedResult,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("AI ERROR:", error);

        return NextResponse.json(
            { error: "Failed to generate and save tests" },
            { status: 500 }
        );
    }
}