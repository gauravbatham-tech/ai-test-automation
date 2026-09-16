import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
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
            input: `Analyze this repository as an expert QA engineer.

Generate 5-10 useful end-to-end tests.

Return ONLY JSON:
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

        const text = response.output_text.trim();

        const cleaned = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const result = JSON.parse(cleaned);

        return NextResponse.json(result);
    } catch (error) {
        console.error("AI ERROR:", error);

        return NextResponse.json(
            { error: "Failed to generate tests" },
            { status: 500 }
        );
    }
}