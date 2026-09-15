import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { owner, repo } = await req.json();

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user?.githubAccessToken) {
        return NextResponse.json(
            { error: "GitHub not connected" },
            { status: 400 }
        );
    }

    const octokit = new Octokit({ auth: user.githubAccessToken });

    const repository = await octokit.rest.repos.get({ owner, repo });

    const tree = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repository.data.default_branch,
        recursive: "true",
    });

    const sourceFiles = tree.data.tree
        .filter(
            (item) =>
                item.type === "blob" &&
                item.path &&
                /\.(tsx?|jsx?|py|java|go|rs|php|html|css)$/.test(item.path)
        )
        .slice(0, 30);

    const files = [];

    for (const file of sourceFiles) {
        const response = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.path!,
            ref: repository.data.default_branch,
        });

        if (!Array.isArray(response.data) && "content" in response.data) {
            files.push({
                path: file.path,
                content: Buffer.from(response.data.content, "base64").toString("utf-8"),
            });
        }
    }

    return NextResponse.json({
        repository: repository.data.full_name,
        branch: repository.data.default_branch,
        language: repository.data.language,
        files,
    });
}