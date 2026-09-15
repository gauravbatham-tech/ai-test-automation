"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
    const [repos, setRepos] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    useEffect(() => {
        fetch("/api/auth/github/repos")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) setError(data.error);
                else setRepos(data);
            });
    }, []);

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <h2 className="mt-8 text-xl font-semibold">Your GitHub Repositories</h2>

            {error && <p className="mt-4 text-red-500">{error}</p>}

            <div className="mt-4 space-y-3">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className="cursor-pointer rounded-lg border p-4 hover:bg-gray-50"
                    >
                        <p className="font-semibold">{repo.name}</p>
                        <p className="text-sm text-gray-500">{repo.description}</p>
                    </div>
                ))}
            </div>

            {selectedRepo && (
                <>
                    <button
                        onClick={async () => {
                            const [owner, repo] = selectedRepo.full_name.split("/");

                            const response = await fetch("/api/auth/github/analyze", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ owner, repo }),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                alert(data.error);
                                return;
                            }

                            alert(
                                `Repository: ${data.fullName}\nLanguage: ${data.language}\nBranch: ${data.defaultBranch}`
                            );
                        }}
                        className="mt-4 rounded-lg bg-black px-5 py-2 text-white"
                    >
                        Analyze Repository
                    </button>
                    <button
                        onClick={async () => {
                            const [owner, repo] = selectedRepo.full_name.split("/");

                            const response = await fetch("/api/auth/github/analyze", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ owner, repo }),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                alert(data.error);
                                return;
                            }

                            const aiResponse = await fetch("/api/ai/generate-tests", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    repository: data.repository,
                                    files: data.files,
                                }),
                            });

                            const responseText = await aiResponse.text();
                            let tests: { tests?: { tests?: unknown[] }; error?: string } = {};

                            if (responseText) {
                                try {
                                    tests = JSON.parse(responseText);
                                } catch {
                                    alert("The test generation service returned an invalid response");
                                    return;
                                }
                            }

                            if (!aiResponse.ok) {
                                alert(tests.error ?? "Failed to generate tests");
                                return;
                            }

                            console.log(tests);
                            alert(`Generated ${tests.tests?.tests?.length ?? 0} test cases`);
                        }}
                        className="ml-3 mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white"
                    >
                        Generate Tests
                    </button>
                    <div className="mt-8 rounded-lg border p-6">
                        <h2 className="text-xl font-bold">Selected Repository</h2>
                        <p className="mt-2">{selectedRepo.full_name}</p>
                    </div>
                </>
            )}
        </main>
    );
}