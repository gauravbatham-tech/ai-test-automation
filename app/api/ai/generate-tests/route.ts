import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { testCases } from "@/db/schema";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

type Action = {
    type: "goto" | "click" | "fill" | "expectText";
    selector: string;
    value?: string;
};

type GeneratedTest = {
    title: string;
    category: "UI" | "API" | "Integration" | "Authentication";
    steps: string[];
    actions: Action[];
    expectedResult: string;
};

function isValidAction(action: unknown): action is Action {
    if (!action || typeof action !== "object") return false;

    const item = action as Record<string, unknown>;

    return (
        ["goto", "click", "fill", "expectText"].includes(
            String(item.type)
        ) &&
        typeof item.selector === "string" &&
        item.selector.trim().length > 0
    );
}

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

        if (!repository || !Array.isArray(files) || !files.length) {
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

        const prompt = `
You are an expert QA automation engineer.

Analyze the following repository and generate 5 useful end-to-end tests.

Focus primarily on functionality that can actually be executed in a browser.

Return ONLY valid JSON in exactly this structure:

{
  "tests": [
    {
      "title": "string",
      "category": "UI",
      "steps": ["string"],
      "actions": [
        {
          "type": "goto",
          "selector": "",
          "value": "https://example.com"
        },
        {
          "type": "click",
          "selector": "exact visible button or link text"
        },
        {
          "type": "fill",
          "selector": "CSS selector",
          "value": "example"
        },
        {
          "type": "expectText",
          "selector": "expected visible text"
        }
      ],
      "expectedResult": "string"
    }
  ]
}

STRICT RULES:

1. actions MUST contain only:
   goto
   click
   fill
   expectText

2. Every action MUST be executable by Playwright.

3. For click:
   - selector should normally be the exact visible text of the button/link.
   - Do not include explanations.
   - Do not include words such as "click", "the button", or punctuation around the selector.

4. For fill:
   - selector must be a CSS selector.
   - Prefer:
     input[name="..."]
     input[type="email"]
     input[type="password"]
     textarea[name="..."]
     [placeholder="..."]

5. For expectText:
   - selector must be the exact or distinctive visible text expected on the page.

6. For goto:
   - value must be an absolute HTTP(S) URL.
   - Use the target application's homepage URL only when one is known from the repository.
   - Otherwise use "/" as the value.

7. Do NOT invent buttons, links, forms, routes, or text that are not supported by the source code.

8. Each test must contain at least 2 actions.

9. Keep actions in the exact order they should execute.

10. steps are human-readable descriptions.
    actions are machine-executable instructions.

11. Generate realistic tests from actual routes, pages, buttons, forms, authentication flows, and API behavior found in the repository.

Repository:
${repository}

SOURCE CODE:
${source}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const parsed = JSON.parse(
            response.text ?? '{"tests":[]}'
        );

        if (!Array.isArray(parsed.tests)) {
            return NextResponse.json(
                { error: "AI returned an invalid test format" },
                { status: 500 }
            );
        }

        const validTests: GeneratedTest[] = [];

        for (const test of parsed.tests) {
            if (
                !test ||
                typeof test.title !== "string" ||
                typeof test.expectedResult !== "string" ||
                !Array.isArray(test.actions)
            ) {
                continue;
            }

            const actions = test.actions.filter(isValidAction);

            if (actions.length < 2) {
                continue;
            }

            validTests.push({
                title: test.title,
                category: [
                    "UI",
                    "API",
                    "Integration",
                    "Authentication",
                ].includes(test.category)
                    ? test.category
                    : "UI",
                steps: Array.isArray(test.steps)
                    ? test.steps
                    : [],
                actions,
                expectedResult: test.expectedResult,
            });
        }

        if (!validTests.length) {
            return NextResponse.json(
                { error: "AI could not generate executable tests" },
                { status: 422 }
            );
        }

        for (const test of validTests) {
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

        return NextResponse.json({
            tests: validTests,
        });
    } catch (error) {
        console.error("GEMINI ERROR:", error);

        return NextResponse.json(
            { error: "Failed to generate tests" },
            { status: 500 }
        );
    }
}