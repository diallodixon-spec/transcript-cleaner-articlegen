"use client";
import { useState } from "react";



export default function Home() {
  const [file, setFile] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [cleanedTranscript, setCleanedTranscript] = useState("");
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [article, setArticle] = useState("");
  const [showArticle, setShowArticle] = useState(false);
  const [articleLoading, setArticleLoading] = useState(false);
  const [socialPosts, setSocialPosts] = useState("");
  const [showSocialPosts, setShowSocialPosts] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [articleUrl, setArticleUrl] = useState("");

  async function handleUpload() {
    if (!file) return alert("Please select a file");

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/process", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("API RESPONSE:", data);

    setEntities(
      (data.entities || []).map((e) => ({
        found: e.found,
        edited: e.suggested, // editable field
      }))
    );

    setLoading(false);
    const text = await file.text();
    setOriginalText(text);
  }

  function updateEntity(index, value) {
    const updated = [...entities];
    updated[index].edited = value;
    setEntities(updated);
  }

  function scrollDown() {
    window.scrollBy({
      top: 400,
      behavior: "smooth",
    });
  }

  async function applyCorrections() {
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: originalText,
        corrections: entities.map((e) => ({
          found: e.found,
          corrected: e.edited,
        })),
      }),
    });

    const data = await res.json();

    setCleanedTranscript(data.cleanedTranscript);
    setShowTranscriptEditor(true);

    setTimeout(() => {
      scrollDown();
    }, 100);
  }



  function saveTranscript() {
    const blob = new Blob(
      [cleanedTranscript],
      { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-transcript.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  function saveArticle() {
    const blob = new Blob([article], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "article.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  async function generateArticle() {
    setArticleLoading(true);

    const res = await fetch("/api/article", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: cleanedTranscript,
      }),
    });

    const data = await res.json();

    setArticle(data.article);
    setShowArticle(true);
    setArticleLoading(false);

    setTimeout(() => {
      scrollDown();
    }, 100);
  }

  async function createSocialPosts() {
    setSocialLoading(true);

    const res = await fetch("/api/social", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article: article,
        url: articleUrl,
      }),
    });

    const data = await res.json();

    setSocialPosts(data.posts || "");
    setShowSocialPosts(true);
    setSocialLoading(false);

    setTimeout(() => {
      scrollDown();
    }, 100);
  }

  return (
    <div className="page-container">
      <div className="header">
        <h1>Podcast Content Assistant</h1>
        <p>
          Upload a transcript, correct names, generate articles, and create social media posts.
        </p>
      </div>

      <input
        type="file"
        accept=".txt"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload & Extract Names"}
      </button>

      {/* TABLE */}
      {entities.length > 0 && (
        <div className="card">
          <h2>Review Names</h2>

          <table style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Found</th>
                <th>Edit</th>
              </tr>
            </thead>

            <tbody>
              {entities.map((e, i) => (
                <tr key={i}>
                  <td>{e.found}</td>

                  <td>
                    <input
                      value={e.edited}
                      onChange={(ev) => {
                        const updated = [...entities];
                        updated[i].edited = ev.target.value;
                        setEntities(updated);
                      }}
                        style={{
                          width: "100%",
                          minWidth: "300px"
                        }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <button onClick={applyCorrections}>
            Apply Adjustments
          </button>
        </div>
      )}

      {showTranscriptEditor && (
        <div className="card">
          <h2>Review Adjusted Transcript</h2>

          <textarea
            value={cleanedTranscript}
            onChange={(e) => setCleanedTranscript(e.target.value)}
            rows={25}
            style={{
              width: "98%",
              fontSize: "14px",
              padding: "10px"
            }}
          />

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px"
            }}
          >
            <button onClick={saveTranscript}>
              Save Transcript
            </button>

            <button onClick={generateArticle}  disabled={articleLoading}>
              {articleLoading ? "Processing..." : "Generate Article"}
            </button>
          </div>
        </div>
      )}
      {showArticle && (
        <div className="card">
          <h2>Generated Article</h2>

          {articleLoading ? (
            <p>Generating article...</p>
          ) : (
            <>
              <textarea
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                rows={20}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "10px",
                  whiteSpace: "pre-wrap",
                }}
              />

              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button onClick={saveArticle}>
                  Save Article
                </button>

                <button onClick={() => setShowSocialForm(true)}>
                  Create Social Media Posts
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showSocialForm && (
        <div className="card">
          <h3>URL for podcast episode</h3>

          <input
            type="text"
            placeholder="https://example.com/article"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px"
            }}
          />

          <button onClick={createSocialPosts} disabled={socialLoading}>
            {socialLoading ? "Processing..." : "Generate Posts"}
          </button>
        </div>
      )}

      {showSocialPosts && (
        <div className="card">
          <h2>Social Media Posts</h2>

          {socialLoading ? (
            <p>Generating social posts...</p>
          ) : (
            <textarea
              value={socialPosts}
              readOnly
              rows={15}
              style={{
                width: "100%",
                fontSize: "14px",
                padding: "10px",
              }}
            />
          )}
        </div>
        
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          color: "#6b7280",
          fontSize: "14px"
        }}
      >
        Podcast Content Assistant
      </div>

    </div>
  );

  

}