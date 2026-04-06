"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getCategories, createNote, hexToRgba, type Category } from "@/lib/api";

export default function NewNotePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Please select or create a category first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createNote({ title, body, categoryId });
      router.replace("/");
    } catch {
      setError("Failed to save note.");
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const noteBg = selectedCategory ? hexToRgba(selectedCategory.color, 0.5) : "#f0e8d8";
  const noteBorder = selectedCategory?.color ?? "#957139";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#faf1e3" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 px-10 py-4">
        <div
          className="flex items-center gap-2 h-[39px] px-3 rounded-[6px] border bg-transparent"
          style={{ borderColor: "#957139" }}
        >
          {selectedCategory && (
            <span
              className="rounded-full shrink-0"
              style={{
                width: "11px",
                height: "11px",
                backgroundColor: selectedCategory.color,
                display: "inline-block",
              }}
            />
          )}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="text-xs font-bold bg-transparent outline-none cursor-pointer appearance-none"
            style={{ color: "#000000" }}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={() => {
            if (title.trim() || body.trim()) {
              if (!confirm("Discard this note? Your changes will be lost.")) return;
            }
            router.back();
          }}
          className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer"
          style={{ borderColor: "#957139", color: "#957139" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer disabled:opacity-50"
          style={{ borderColor: "#957139", color: "#957139" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Post-it note box */}
      <div className="flex-1 px-10 pb-10">
        <div
          className="flex flex-col gap-4 p-8 rounded-[16px]"
          style={{
            backgroundColor: noteBg,
            border: `3px solid ${noteBorder}`,
            boxShadow: "1px 1px 2px 0px rgba(0,0,0,0.25)",
            minHeight: "500px",
          }}
        >
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-serif font-bold text-3xl bg-transparent outline-none border-b pb-2"
            style={{ borderColor: "#957139", color: "#000" }}
          />
          <textarea
            placeholder="Pour your heart out..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 text-lg bg-transparent outline-none resize-none leading-relaxed"
            style={{ minHeight: "400px", color: "#1a1a1a" }}
          />
        </div>
      </div>
    </div>
  );
}
