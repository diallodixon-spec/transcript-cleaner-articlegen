"use client";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState(null);

  async function handleUpload() {
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "sample text"
      })
    });

    const data = await res.json();
    setResult(data.entities);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Transcript Cleaner</h1>

      <button onClick={handleUpload}>
        Upload & Process
      </button>

      {result && (
        <div>
          <h2>Entities Found</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}