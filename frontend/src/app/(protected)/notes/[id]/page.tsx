"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getNote,
  updateNote,
  deleteNote,
  getCategories,
  getMe,
  hexToRgba,
  formatFullDate,
  type Note,
  type Category,
  type User,
} from "@/lib/api";

export default function NoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [note, setNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadNote = useCallback(async () => {
    try {
      const [noteData, catsData, userData] = await Promise.all([
        getNote(id),
        getCategories(),
        getMe(),
      ]);
      setNote(noteData);
      setCategories(catsData);
      setCurrentUser(userData);
      setTitle(noteData.title);
      setBody(noteData.body);
      setCategoryId(noteData.category.id);
    } catch {
      router.replace("/");
    }
  }, [id, router]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  async function handleSave() {
    if (!note) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateNote(note.id, { title, body, categoryId });
      setNote(updated);
      setEditing(false);
      router.replace("/");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!note) return;
    setTitle(note.title);
    setBody(note.body);
    setCategoryId(note.category.id);
    setEditing(false);
  }

  async function handleDelete() {
    if (!note || !confirm("Delete this note? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteNote(note.id);
      router.replace("/");
    } catch {
      setError("Failed to delete note.");
      setDeleting(false);
    }
  }

  if (!note) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#faf1e3" }}
      >
        <p className="text-sm" style={{ color: "#957139" }}>
          Loading…
        </p>
      </div>
    );
  }

  const displayCategory = editing
    ? (categories.find((c) => c.id === categoryId) ?? note.category)
    : note.category;

  const noteBg = hexToRgba(displayCategory.color, 0.5);
  const noteBorder = displayCategory.color;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#faf1e3" }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 px-10 py-4 flex-wrap">
        {editing ? (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 h-[39px] px-3 rounded-[6px] border bg-transparent"
              style={{ borderColor: "#957139" }}
            >
              <span
                className="rounded-full shrink-0"
                style={{
                  width: "11px",
                  height: "11px",
                  backgroundColor: displayCategory.color,
                  display: "inline-block",
                }}
              />
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

          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="rounded-full"
              style={{
                width: "11px",
                height: "11px",
                backgroundColor: note.category.color,
                display: "inline-block",
              }}
            />
            <span className="text-xs font-bold">{note.category.name}</span>
          </div>
        )}

        <div className="flex-1" />

        {error && <p className="text-xs text-red-600">{error}</p>}

        {editing ? (
          <>
            <button
              onClick={handleCancelEdit}
              className="text-sm cursor-pointer"
              style={{ color: "#957139" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer disabled:opacity-50"
              style={{ borderColor: "#957139", color: "#957139" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.replace("/")}
              className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer"
              style={{ borderColor: "#957139", color: "#957139" }}
            >
              Cancel
            </button>
            <button
              onClick={() => setEditing(true)}
              className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer"
              style={{ borderColor: "#957139", color: "#957139" }}
            >
              Edit
            </button>
            {currentUser?.isSuperuser && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-[39px] px-6 rounded-[46px] border font-bold text-sm cursor-pointer disabled:opacity-50"
                style={{ borderColor: "#c0392b", color: "#c0392b" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </>
        )}
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
          {/* Last Edited */}
          <div className="flex justify-end">
            <span className="text-xs" style={{ color: "#957139" }}>
              Last Edited: {formatFullDate(note.updatedAt)}
            </span>
          </div>

          {editing ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-serif font-bold text-3xl bg-transparent outline-none border-b pb-2"
                style={{ borderColor: "#957139" }}
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 text-lg bg-transparent outline-none resize-none leading-relaxed"
                style={{ minHeight: "400px" }}
              />
            </>
          ) : (
            <>
              <h1
                className="font-serif font-bold text-3xl border-b pb-2"
                style={{ borderColor: hexToRgba(note.category.color, 0.4) }}
              >
                {note.title}
              </h1>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {note.body}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
