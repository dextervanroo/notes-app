"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getNotes,
  getCategories,
  clearTokens,
  hexToRgba,
  formatDate,
  type Note,
  type Category,
} from "@/lib/api";
import CategoryDialog from "@/components/CategoryDialog";

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 1v12M1 7h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoteCard({ note }: { note: Note }) {
  const bg = hexToRgba(note.category.color, 0.5);
  const border = note.category.color;

  return (
    <Link
      href={`/notes/${note.id}`}
      className="flex flex-col gap-3 p-4 rounded-[11px] h-[246px] overflow-hidden shrink-0"
      style={{
        backgroundColor: bg,
        border: `3px solid ${border}`,
        boxShadow: "1px 1px 2px 0px rgba(0,0,0,0.25)",
        width: "303px",
      }}
    >
      <div className="flex gap-2 items-start text-xs whitespace-nowrap">
        <span className="font-bold">{formatDate(note.updatedAt)}</span>
        <span>{note.category.name}</span>
      </div>
      <p
        className="font-serif font-bold text-2xl leading-tight"
        style={{ width: "268px" }}
      >
        {note.title}
      </p>
      <p
        className="text-xs leading-relaxed overflow-hidden"
        style={{ height: "125px", width: "268px" }}
      >
        {note.body}
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "#faf1e3" }} />}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "";

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesData, categoriesData] = await Promise.all([
        getNotes(selectedCategory ? { category: selectedCategory } : {}),
        getCategories(),
      ]);
      setNotes(notesData);
      setCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const countsByCategory = notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.category.id] = (acc[n.category.id] ?? 0) + 1;
    return acc;
  }, {});

  function handleCategoryClick(id: string) {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set("category", id);
    } else {
      params.delete("category");
    }
    router.push(`/?${params}`);
  }

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  function handleCategoryCreated(category: Category) {
    setCategories((prev) => [...prev, category]);
    setIsDialogOpen(false);
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#faf1e3" }}
    >
      {/* New Note button */}
      <div className="absolute top-[39px] right-[23px]">
        <Link
          href="/notes/new"
          className="flex items-center gap-1.5 h-[43px] px-4 rounded-[46px] border font-bold text-base"
          style={{ borderColor: "#957139", color: "#957139" }}
        >
          <PlusIcon />
          New Note
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="absolute top-[39px] right-[180px] h-[43px] px-4 text-xs cursor-pointer"
        style={{ color: "#957139" }}
      >
        Logout
      </button>

      <div className="flex min-h-screen pt-[35px] px-[23px]">
        {/* Sidebar */}
        <div
          className="w-[288px] shrink-0 rounded-[24px] mr-6 pt-[66px] pb-4"
          style={{ minHeight: "781px" }}
        >
          {/* All Categories */}
          <button
            onClick={() => handleCategoryClick("")}
            className="flex items-center w-full h-8 px-4 cursor-pointer"
          >
            <span
              className="text-xs font-bold"
              style={
                !selectedCategory
                  ? { color: "#957139", textDecoration: "underline" }
                  : {}
              }
            >
              All Categories
            </span>
          </button>

          {/* Category list */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="flex items-center gap-2 w-full h-8 px-4 cursor-pointer"
            >
              <span
                className="rounded-full shrink-0"
                style={{
                  width: "11px",
                  height: "11px",
                  backgroundColor: cat.color,
                }}
              />
              <span className="flex-1 text-xs text-left truncate">
                {cat.name}
              </span>
              <span className="text-xs shrink-0">
                {countsByCategory[cat.id] ?? 0}
              </span>
            </button>
          ))}

          {/* New Category button */}
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-1.5 w-full h-8 px-4 mt-4 text-xs font-bold cursor-pointer"
            style={{ color: "#957139" }}
          >
            <PlusIcon />
            New Category
          </button>
        </div>

        {/* Notes grid */}
        <div className="flex-1 pt-[66px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm" style={{ color: "#957139" }}>
                Loading…
              </p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-lg" style={{ color: "#957139" }}>
                I&apos;m just here waiting for your charming notes…
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-[13px]">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}
