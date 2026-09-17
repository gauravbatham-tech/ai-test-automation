import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert QA engineer.

Analyze this repository and generate 5-10 useful end-to-end test cases.

Return ONLY valid JSON:
{
  "tests": [
    {
      "title": "string",
      "category": "UI | API | Integration | Authentication",
      "steps": ["string"],
      "actions": [
        {
          "type": "goto | click | fill | expectText",
          "selector": "string",
          "value": "string"
        }
      ],
      "expectedResult": "string"
    }
  ]
}

IMPORTANT:
- Generate actions that can be executed directly by Playwright.
- For click actions, use reliable selectors such as text, role, label, placeholder, or CSS selectors.
- For fill actions, provide the input value.
- Do not put natural-language instructions inside actions.

Repository: ${repository}

SOURCE CODE:
${source}`,
            config: {
                responseMimeType: "application/json",
            },
        });

        const result = JSON.parse(response.text ?? '{"tests":[]}');

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
        console.error("GEMINI ERROR:", error);

        return NextResponse.json(
            { error: "Failed to generate and save tests" },
            { status: 500 }
        );
    }
}