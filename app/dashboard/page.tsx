"use client";

import { useEffect, useState } from "react";
import {
    GitBranch as Github,
    Play,
    Sparkles,
    Globe,
    Settings,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    FlaskConical,
    History,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Repository = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
};

type Action = {
    type: "goto" | "click" | "fill" | "expectText";
    selector: string;
    value?: string;
};

type Test = {
    id?: string;
    title: string;
    category: "UI" | "API" | "Integration" | "Authentication";
    steps: string[];
    actions: Action[];
    expectedResult: string;
};

type Execution = {
    success?: boolean;
    status: string;
    title?: string;
    error?: string;
    logs?: string[];
    sessionId?: string | null;
};

export default function DashboardPage() {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    const [error, setError] = useState("");

    const [tests, setTests] = useState<Test[]>([]);

    const [targetUrl, setTargetUrl] = useState("");
    const [demoEmail, setDemoEmail] = useState("");
    const [demoPassword, setDemoPassword] = useState("");
    const [globalInstructions, setGlobalInstructions] = useState("");

    const [settingsSaved, setSettingsSaved] = useState(false);

    const [execution, setExecution] = useState<Execution | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [runMode, setRunMode] = useState<"cached" | "ai">("cached");

    // --------------------------------------------------
    // LOAD GITHUB REPOSITORIES
    // --------------------------------------------------

    useEffect(() => {
        fetch("/api/auth/github/repos")
            .then(async (res) => {
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load repositories");
                }

                return data;
            })
            .then((data) => {
                setRepos(data);
            })
            .catch((err) => {
                setError(err.message);
            });
    }, []);

    // --------------------------------------------------
    // LOAD PROJECT SETTINGS WHEN REPOSITORY CHANGES
    // --------------------------------------------------

    useEffect(() => {
        if (!selectedRepo) return;

        fetch(
            `/api/project-settings?repository=${encodeURIComponent(
                selectedRepo.full_name
            )}`
        )
            .then(async (res) => {
                const data = await res.json();

                if (!res.ok) return null;

                return data;
            })
            .then((data) => {
                if (!data) return;

                setTargetUrl(data.targetUrl ?? "");
                setDemoEmail(data.demoEmail ?? "");
                setDemoPassword(data.demoPassword ?? "");
                setGlobalInstructions(data.globalInstructions ?? "");
            })
            .catch(() => { });
    }, [selectedRepo]);

    // --------------------------------------------------
    // LOAD CACHED TESTS
    // --------------------------------------------------

    useEffect(() => {
        if (!selectedRepo) return;

        fetch(
            `/api/tests?repository=${encodeURIComponent(
                selectedRepo.full_name
            )}`
        )
            .then(async (res) => {
                const data = await res.json();

                if (!res.ok) {
                    return [];
                }

                return data;
            })
            .then((data) => {
                const parsedTests = data.map((test: any) => ({
                    ...test,
                    steps:
                        typeof test.steps === "string"
                            ? JSON.parse(test.steps)
                            : test.steps ?? [],
                    actions:
                        typeof test.actions === "string"
                            ? JSON.parse(test.actions)
                            : test.actions ?? [],
                }));

                setTests(parsedTests);
            })
            .catch(() => {
                setTests([]);
            });
    }, [selectedRepo]);

    // --------------------------------------------------
    // SAVE PROJECT SETTINGS
    // --------------------------------------------------

    async function saveSettings() {
        if (!selectedRepo) {
            alert("Select a repository first.");
            return;
        }

        try {
            setSettingsSaved(false);

            const response = await fetch("/api/project-settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repository: selectedRepo.full_name,
                    targetUrl,
                    demoEmail,
                    demoPassword,
                    globalInstructions,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save settings");
            }

            setSettingsSaved(true);

            setTimeout(() => {
                setSettingsSaved(false);
            }, 2500);
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Failed to save project settings"
            );
        }
    }

    // --------------------------------------------------
    // ANALYZE REPOSITORY
    // --------------------------------------------------

    async function analyzeRepository() {
        if (!selectedRepo) {
            alert("Select a repository first.");
            return;
        }

        try {
            setIsAnalyzing(true);
            setError("");

            const response = await fetch("/api/auth/github/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner: selectedRepo.full_name.split("/")[0],
                    repo: selectedRepo.name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Repository analysis failed");
            }

            alert(
                `Repository analyzed successfully.\n\nFiles analyzed: ${data.files?.length ?? 0
                }`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Repository analysis failed"
            );
        } finally {
            setIsAnalyzing(false);
        }
    }

    // --------------------------------------------------
    // GENERATE TESTS
    // --------------------------------------------------

    async function generateTests() {
        if (!selectedRepo) {
            alert("Select a repository first.");
            return;
        }

        try {
            setIsGenerating(true);
            setError("");

            const analyzeResponse = await fetch("/api/auth/github/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner: selectedRepo.full_name.split("/")[0],
                    repo: selectedRepo.name,
                }),
            });

            const analyzeData = await analyzeResponse.json();

            if (!analyzeResponse.ok) {
                throw new Error(
                    analyzeData.error || "Failed to analyze repository"
                );
            }

            const response = await fetch("/api/ai/generate-tests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repository: analyzeData.repository,
                    files: analyzeData.files,
                    targetUrl,
                    demoEmail,
                    demoPassword,
                    globalInstructions,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to generate tests"
                );
            }

            setTests(data.tests ?? []);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate tests"
            );
        } finally {
            setIsGenerating(false);
        }
    }

    // --------------------------------------------------
    // RUN TEST
    // --------------------------------------------------

    async function runTest() {
        if (!targetUrl) {
            alert("Enter the target application URL first.");
            return;
        }

        try {
            setIsRunning(true);
            setExecution(null);

            let availableTests = tests;

            // -----------------------------
            // CACHED MODE
            // -----------------------------

            if (runMode === "cached") {
                if (!selectedRepo) {
                    alert("Select a repository first.");
                    return;
                }

                const response = await fetch(
                    `/api/tests?repository=${encodeURIComponent(
                        selectedRepo.full_name
                    )}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Failed to load cached tests"
                    );
                }

                availableTests = data.map((test: any) => ({
                    ...test,
                    steps:
                        typeof test.steps === "string"
                            ? JSON.parse(test.steps)
                            : test.steps ?? [],
                    actions:
                        typeof test.actions === "string"
                            ? JSON.parse(test.actions)
                            : test.actions ?? [],
                }));

                setTests(availableTests);
            }

            if (!availableTests.length) {
                alert("No tests available. Generate tests first.");
                return;
            }

            const selectedTest = availableTests[0];

            if (
                !selectedTest.actions ||
                !selectedTest.actions.length
            ) {
                alert("Selected test has no executable actions.");
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

            const response = await fetch("/api/browser/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: targetUrl,
                    steps: selectedTest.actions,
                }),
            });

            const data = await response.json();

            setExecution(data);

        } catch (err) {
            setExecution({
                success: false,
                status: "failed",
                logs: ["Execution failed"],
                error:
                    err instanceof Error
                        ? err.message
                        : String(err),
            });
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <main className="min-h-screen bg-muted/30">
            {/* ==================================================
          HEADER
      ================================================== */}

            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            QA Automation
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            AI-powered end-to-end testing
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() =>
                                (window.location.href = "/tests")
                            }
                        >
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Tests
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() =>
                                (window.location.href = "/executions")
                            }
                        >
                            <History className="mr-2 h-4 w-4" />
                            Executions
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

                {/* ==================================================
            ERROR
        ================================================== */}

                {error && (
                    <Card className="border-destructive/40">
                        <CardContent className="flex items-center gap-3 p-4 text-destructive">
                            <XCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </CardContent>
                    </Card>
                )}

                {/* ==================================================
            REPOSITORY
        ================================================== */}

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2">
                                <Github className="h-5 w-5" />
                            </div>

                            <div>
                                <CardTitle>GitHub Repository</CardTitle>
                                <CardDescription>
                                    Choose the repository you want to test.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <select
                            value={selectedRepo?.full_name ?? ""}
                            onChange={(e) => {
                                const repo = repos.find(
                                    (item) =>
                                        item.full_name === e.target.value
                                );

                                setSelectedRepo(repo ?? null);
                                setExecution(null);
                            }}
                            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">
                                Select a GitHub repository
                            </option>

                            {repos.map((repo) => (
                                <option
                                    key={repo.id}
                                    value={repo.full_name}
                                >
                                    {repo.full_name}
                                    {repo.private ? " 🔒" : ""}
                                </option>
                            ))}
                        </select>

                        {selectedRepo && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
                                <div>
                                    <p className="font-medium">
                                        {selectedRepo.full_name}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {selectedRepo.private
                                            ? "Private repository"
                                            : "Public repository"}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={analyzeRepository}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Github className="mr-2 h-4 w-4" />
                                        )}

                                        {isAnalyzing
                                            ? "Analyzing..."
                                            : "Analyze Repository"}
                                    </Button>

                                    <Button
                                        onClick={generateTests}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}

                                        {isGenerating
                                            ? "Generating..."
                                            : "Generate AI Tests"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ==================================================
            PROJECT SETTINGS
        ================================================== */}

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2">
                                <Settings className="h-5 w-5" />
                            </div>

                            <div>
                                <CardTitle>Project Settings</CardTitle>
                                <CardDescription>
                                    Configure the application that QA tests will run against.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5">

                        {/* TARGET URL */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Target Application URL
                            </label>

                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                <Input
                                    value={targetUrl}
                                    onChange={(e) =>
                                        setTargetUrl(e.target.value)
                                    }
                                    placeholder="https://your-app.com"
                                    className="pl-9"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Browserbase must be able to access this URL.
                                localhost URLs will not work from the cloud browser.
                            </p>
                        </div>

                        {/* CREDENTIALS */}

                        <div className="grid gap-4 md:grid-cols-2">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Demo Email
                                </label>

                                <Input
                                    type="email"
                                    value={demoEmail}
                                    onChange={(e) =>
                                        setDemoEmail(e.target.value)
                                    }
                                    placeholder="demo@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Demo Password
                                </label>

                                <Input
                                    type="password"
                                    value={demoPassword}
                                    onChange={(e) =>
                                        setDemoPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                />
                            </div>

                        </div>

                        {/* GLOBAL INSTRUCTIONS */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Global QA Instructions
                            </label>

                            <textarea
                                value={globalInstructions}
                                onChange={(e) =>
                                    setGlobalInstructions(e.target.value)
                                }
                                placeholder="Example: Focus on authentication, form validation and error handling."
                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                {settingsSaved && (
                                    <p className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Settings saved
                                    </p>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                onClick={saveSettings}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Save Settings
                            </Button>
                        </div>

                    </CardContent>
                </Card>

                {/* ==================================================
            EXECUTION
        ================================================== */}

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* EXECUTION MODE */}

                    <Card>
                        <CardHeader>
                            <CardTitle>Execution Mode</CardTitle>

                            <CardDescription>
                                Choose how tests are prepared.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-3">

                                <button
                                    type="button"
                                    onClick={() => setRunMode("cached")}
                                    className={`rounded-lg border p-4 text-left transition ${runMode === "cached"
                                        ? "border-primary bg-primary/5"
                                        : "hover:bg-muted"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <History className="h-5 w-5" />

                                        <div>
                                            <p className="font-medium">
                                                Run Cached
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Use previously generated tests.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRunMode("ai")}
                                    className={`rounded-lg border p-4 text-left transition ${runMode === "ai"
                                        ? "border-primary bg-primary/5"
                                        : "hover:bg-muted"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-5 w-5" />

                                        <div>
                                            <p className="font-medium">
                                                AI Generate
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Generate fresh tests with Gemini.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                            </div>
                        </CardContent>
                    </Card>

                    {/* RUN TEST */}

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Run Test</CardTitle>

                            <CardDescription>
                                Execute the first available generated test against your target application.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">

                                <div>
                                    <p className="font-medium">
                                        {tests.length} test
                                        {tests.length === 1 ? "" : "s"} available
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        Mode:{" "}
                                        {runMode === "cached"
                                            ? "Cached tests"
                                            : "AI-generated tests"}
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={runTest}
                                    disabled={isRunning || !targetUrl}
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Run Test
                                        </>
                                    )}
                                </Button>

                            </div>

                            {!targetUrl && (
                                <p className="text-sm text-amber-600">
                                    Enter a target application URL before running a test.
                                </p>
                            )}

                        </CardContent>
                    </Card>
                </div>

                {/* ==================================================
            EXECUTION RESULT
        ================================================== */}

                {execution && (
                    <Card
                        className={
                            execution.status === "passed"
                                ? "border-green-500/40"
                                : execution.status === "failed"
                                    ? "border-destructive/40"
                                    : ""
                        }
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    {execution.status === "passed" ? (
                                        <div className="rounded-full bg-green-100 p-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        </div>
                                    ) : execution.status === "failed" ? (
                                        <div className="rounded-full bg-destructive/10 p-2">
                                            <XCircle className="h-5 w-5 text-destructive" />
                                        </div>
                                    ) : (
                                        <div className="rounded-full bg-muted p-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    )}

                                    <div>
                                        <CardTitle>
                                            Execution Result
                                        </CardTitle>

                                        <CardDescription>
                                            Status:{" "}
                                            <span className="font-medium capitalize">
                                                {execution.status}
                                            </span>
                                        </CardDescription>
                                    </div>

                                </div>

                                {execution.sessionId && (
                                    <a
                                        href={`https://browserbase.com/sessions/${execution.sessionId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-primary underline"
                                    >
                                        Open Session
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                )}

                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            {execution.title && (
                                <div>
                                    <p className="text-sm font-medium">
                                        Page Title
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {execution.title}
                                    </p>
                                </div>
                            )}

                            {execution.error && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                    <p className="font-medium text-destructive">
                                        Error
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {execution.error}
                                    </p>
                                </div>
                            )}

                            {execution.logs &&
                                execution.logs.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium">
                                            Execution Logs
                                        </p>

                                        <pre className="max-h-80 overflow-auto rounded-lg bg-black p-4 text-xs text-white">
                                            {execution.logs.join("\n")}
                                        </pre>
                                    </div>
                                )}

                            {execution.sessionId && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-sm font-medium">
                                        Browserbase Session
                                    </p>

                                    <p className="mt-1 break-all text-xs text-muted-foreground">
                                        {execution.sessionId}
                                    </p>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                )}

                {/* ==================================================
            GENERATED TESTS
        ================================================== */}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">

                            <div>
                                <CardTitle>
                                    Generated Tests
                                </CardTitle>

                                <CardDescription>
                                    AI-generated browser tests for your repository.
                                </CardDescription>
                            </div>

                            <div className="rounded-full bg-muted px-3 py-1 text-sm">
                                {tests.length} tests
                            </div>

                        </div>
                    </CardHeader>

                    <CardContent>

                        {tests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">

                                <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />

                                <h3 className="font-medium">
                                    No tests generated yet
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    Select a GitHub repository and generate AI tests to see them here.
                                </p>

                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">

                                {tests.map((test, index) => (
                                    <div
                                        key={test.id ?? index}
                                        className="rounded-lg border p-5 transition hover:bg-muted/30"
                                    >

                                        <div className="flex items-start justify-between gap-3">

                                            <div>
                                                <p className="font-semibold">
                                                    {test.title}
                                                </p>

                                                <span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                                    {test.category}
                                                </span>
                                            </div>

                                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />

                                        </div>

                                        <div className="mt-4">

                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Steps
                                            </p>

                                            <ol className="mt-2 space-y-1.5 text-sm">

                                                {test.steps.map(
                                                    (step, stepIndex) => (
                                                        <li
                                                            key={stepIndex}
                                                            className="flex gap-2"
                                                        >
                                                            <span className="font-medium text-muted-foreground">
                                                                {stepIndex + 1}.
                                                            </span>

                                                            <span>{step}</span>
                                                        </li>
                                                    )
                                                )}

                                            </ol>
                                        </div>

                                        <div className="mt-4 rounded-md bg-muted/50 p-3">

                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Expected Result
                                            </p>

                                            <p className="mt-1 text-sm">
                                                {test.expectedResult}
                                            </p>

                                        </div>

                                        <div className="mt-3 text-xs text-muted-foreground">
                                            {test.actions?.length ?? 0} executable browser actions
                                        </div>

                                    </div>
                                ))}

                            </div>
                        )}

                    </CardContent>
                </Card>

            </div>
        </main>
    );
}