"use client";

import { useEffect, useState } from "react";

export default function ExecutionsPage() {
    const [executions, setExecutions] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/executions")
            .then((res) => res.json())
            .then((data) => setExecutions(data));
    }, []);

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Execution History</h1>

            <div className="mt-6 space-y-4">
                {executions.map((execution) => (
                    <div
                        key={execution.id}
                        className="rounded-lg border p-5"
                    >
                        <p>
                            Status:{" "}
                            <strong>{execution.status.toUpperCase()}</strong>
                        </p>

                        <p className="mt-2">
                            Session: {execution.sessionId}
                        </p>

                        <pre className="mt-3 overflow-auto rounded bg-gray-100 p-3 text-sm">
                            {JSON.parse(execution.logs).join("\n")}
                        </pre>

                        <p className="mt-3 text-sm text-gray-500">
                            {new Date(execution.createdAt).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}