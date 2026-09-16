"use client";

import { useEffect, useState } from "react";

export default function TestsPage() {
    const [tests, setTests] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/tests")
            .then((res) => res.json())
            .then((data) => setTests(data));
    }, []);

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Test Cases</h1>

            {tests.length === 0 ? (
                <p className="mt-6 text-gray-500">
                    No test cases generated yet.
                </p>
            ) : (
                <div className="mt-6 space-y-4">
                    {tests.map((test) => (
                        <div key={test.id} className="rounded-xl border p-6">
                            <h2 className="text-xl font-semibold">{test.title}</h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Category: {test.category}
                            </p>

                            <ol className="mt-4 list-decimal pl-5">
                                {JSON.parse(test.steps).map(
                                    (step: string, index: number) => (
                                        <li key={index}>{step}</li>
                                    )
                                )}
                            </ol>

                            <p className="mt-4">
                                <strong>Expected:</strong> {test.expectedResult}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}