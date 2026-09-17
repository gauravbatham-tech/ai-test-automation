"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
    const [repos, setRepos] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [tests, setTests] = useState<any[]>([]);
    const [demoEmail, setDemoEmail] = useState("");
    const [demoPassword, setDemoPassword] = useState("");
    const [globalInstructions, setGlobalInstructions] = useState("");
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [targetUrl, setTargetUrl] = useState("");
    const [execution, setExecution] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [runMode, setRunMode] = useState<"ai" | "cached">("ai");

    useEffect(() => {
        fetch("/api/auth/github/repos")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) setError(data.error);
                else setRepos(data);
            });
    }, []);

    useEffect(() => {
        if (!selectedRepo) return;

        fetch(
            `/api/project-settings?repository=${encodeURIComponent(
                selectedRepo.full_name
            )}`
        )
            .then((res) => res.json())
            .then((data) => {
                if (!data) return;

                setTargetUrl(data.targetUrl ?? "");
                setDemoEmail(data.demoEmail ?? "");
                setDemoPassword(
                    data.demoPassword ?? ""
                );
                setGlobalInstructions(
                    data.globalInstructions ?? ""
                );
            });
    }, [selectedRepo]);

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
                            const [owner, repo] =
                                selectedRepo.full_name.split("/");

                            const response = await fetch(
                                "/api/auth/github/analyze",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        owner,
                                        repo,
                                    }),
                                }
                            );

                            const data = await response.json();

                            if (!response.ok) {
                                alert(data.error);
                                return;
                            }

                            if (!data.repository || !data.files?.length) {
                                alert(
                                    "No readable source files were found"
                                );
                                return;
                            }

                            const aiResponse = await fetch(
                                "/api/ai/generate-tests",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        repository: data.repository,
                                        files: data.files,
                                        targetUrl,
                                        demoEmail,
                                        globalInstructions,
                                    }),
                                }
                            );

                            const responseText =
                                await aiResponse.text();

                            let result: {
                                tests?: any[];
                                error?: string;
                            } = {};

                            try {
                                result = responseText
                                    ? JSON.parse(responseText)
                                    : {};
                            } catch {
                                alert(
                                    "Invalid AI response"
                                );
                                return;
                            }

                            if (!aiResponse.ok) {
                                alert(
                                    result.error ??
                                    "Failed to generate tests"
                                );
                                return;
                            }

                            setTests(result.tests ?? []);
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

            <div className="mt-8 rounded-lg border p-6">
                <h2 className="text-xl font-semibold">Target Application</h2>
                <div className="mt-6 space-y-4">

                    <div>
                        <label className="font-medium">
                            Target Application URL
                        </label>

                        <input
                            value={targetUrl}
                            onChange={(e) =>
                                setTargetUrl(e.target.value)
                            }
                            placeholder="https://your-app.com"
                            className="mt-2 w-full rounded-lg border p-3"
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Demo Email
                        </label>

                        <input
                            type="email"
                            value={demoEmail}
                            onChange={(e) =>
                                setDemoEmail(e.target.value)
                            }
                            placeholder="demo@example.com"
                            className="mt-2 w-full rounded-lg border p-3"
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Demo Password
                        </label>

                        <input
                            type="password"
                            value={demoPassword}
                            onChange={(e) =>
                                setDemoPassword(e.target.value)
                            }
                            placeholder="Demo password"
                            className="mt-2 w-full rounded-lg border p-3"
                        />
                    </div>

                    <div>
                        <label className="font-medium">
                            Global QA Instructions
                        </label>

                        <textarea
                            value={globalInstructions}
                            onChange={(e) =>
                                setGlobalInstructions(e.target.value)
                            }
                            placeholder="Example: Always test authentication, validation, error states and mobile responsiveness."
                            className="mt-2 min-h-32 w-full rounded-lg border p-3"
                        />
                    </div>

                    <button
                        onClick={async () => {
                            if (!selectedRepo) {
                                alert("Please select a repository");
                                return;
                            }

                            if (!targetUrl) {
                                alert("Please enter the target URL");
                                return;
                            }

                            const response = await fetch(
                                "/api/project-settings",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json",
                                    },
                                    body: JSON.stringify({
                                        repository:
                                            selectedRepo.full_name,
                                        targetUrl,
                                        demoEmail,
                                        demoPassword,
                                        globalInstructions,
                                    }),
                                }
                            );

                            const data = await response.json();

                            if (!response.ok) {
                                alert(
                                    data.error ??
                                    "Failed to save settings"
                                );
                                return;
                            }

                            setSettingsSaved(true);
                        }}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-white"
                    >
                        Save Project Settings
                    </button>

                    {settingsSaved && (
                        <p className="text-sm text-green-600">
                            Project settings saved successfully.
                        </p>
                    )}

                </div>
                <div className="mt-4">
                    <label className="font-medium">Execution Mode</label>

                    <select
                        value={runMode}
                        onChange={(e) =>
                            setRunMode(e.target.value as "ai" | "cached")
                        }
                        className="mt-2 w-full rounded-lg border p-3"
                    >
                        <option value="ai">
                            AI Generate
                        </option>

                        <option value="cached">
                            Run Cached
                        </option>
                    </select>
                </div>

                <input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://your-app.com"
                    className="mt-3 w-full rounded-lg border p-3"
                />

                {tests.length > 0 && (
                    <div className="mt-4">
                        <label className="font-medium">Select Test</label>

                        <select
                            id="selected-test"
                            className="mt-2 w-full rounded-lg border p-3"
                        >
                            {tests.map((test, index) => (
                                <option key={index} value={index}>
                                    {test.title}
                                </option>
                            ))}
                        </select>

                        <button
                            disabled={isRunning}
                            onClick={async () => {
                                if (!targetUrl) {
                                    alert(
                                        "Please enter the target application URL"
                                    );
                                    return;
                                }

                                setIsRunning(true);

                                try {
                                    let availableTests: any[] = [];

                                    if (runMode === "cached") {
                                        const response = await fetch(
                                            `/api/tests?repository=${encodeURIComponent(
                                                selectedRepo.full_name
                                            )}`
                                        );

                                        const data = await response.json();

                                        if (!response.ok) {
                                            alert(
                                                data.error ??
                                                "Failed to load cached tests"
                                            );
                                            return;
                                        }

                                        availableTests = data.map(
                                            (test: any) => ({
                                                ...test,
                                                steps: JSON.parse(
                                                    test.steps
                                                ),
                                                actions: JSON.parse(
                                                    test.actions
                                                ),
                                            })
                                        );

                                        setTests(availableTests);
                                    } else {
                                        availableTests = tests;
                                    }

                                    if (!availableTests.length) {
                                        alert(
                                            "No tests available. Generate tests first."
                                        );
                                        return;
                                    }

                                    const selectedTest =
                                        availableTests[0];

                                    if (
                                        !selectedTest.actions ||
                                        !selectedTest.actions.length
                                    ) {
                                        alert(
                                            "Selected test has no executable actions."
                                        );
                                        return;
                                    }

                                    setExecution({
                                        status: "running",
                                        logs: [
                                            runMode === "cached"
                                                ? "Running cached test..."
                                                : "Running AI-generated test...",
                                        ],
                                    });

                                    const response = await fetch(
                                        "/api/browser/run",
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                url: targetUrl,
                                                steps: selectedTest.actions,
                                            }),
                                        }
                                    );

                                    const data = await response.json();

                                    setExecution(data);
                                } catch (error) {
                                    setExecution({
                                        success: false,
                                        status: "failed",
                                        logs: [
                                            "Execution failed",
                                            String(error),
                                        ],
                                    });
                                } finally {
                                    setIsRunning(false);
                                }
                            }}
                        >
                            {isRunning
                                ? "Running..."
                                : runMode === "cached"
                                    ? "Run Cached Test"
                                    : "Run AI Test"}
                        </button>
                    </div>
                )}
            </div>

            {execution && (
                <div className="mt-6 rounded-lg border p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">
                            Execution Result
                        </h3>

                        <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${execution.status === "passed"
                                ? "bg-green-100 text-green-700"
                                : execution.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                        >
                            {execution.status?.toUpperCase()}
                        </span>
                    </div>

                    {execution.title && (
                        <p className="mt-3">
                            Page Title: <strong>{execution.title}</strong>
                        </p>
                    )}

                    {execution.error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
                            <strong>Error:</strong>
                            <p className="mt-1">{execution.error}</p>
                        </div>
                    )}

                    <h4 className="mt-5 font-semibold">
                        Execution Logs
                    </h4>

                    <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
                        {execution.logs?.join("\n")}
                    </pre>

                    {execution.sessionId && (
                        <p className="mt-4 text-sm text-gray-500">
                            Session ID: {execution.sessionId}
                        </p>
                    )}
                </div>
            )}

            {tests.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold">Generated Test Cases</h2>

                    <div className="mt-4 space-y-4">
                        {tests.map((test, index) => (
                            <div key={index} className="rounded-lg border p-5">
                                <h3 className="font-semibold">{test.title}</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Category: {test.category}
                                </p>

                                <ol className="mt-3 list-decimal pl-5">
                                    {test.steps?.map((step: string, i: number) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>

                                <p className="mt-3">
                                    <strong>Expected:</strong> {test.expectedResult}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}