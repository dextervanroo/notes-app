"use client";

import { useState } from "react";
import { SketchPicker } from "react-color";
import { createCategory, type Category } from "@/lib/api";

export interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (category: Category) => void;
}

export default function CategoryDialog({
    isOpen,
    onClose,
    onSuccess,
}: CategoryDialogProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#4ECDC4");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Category name is required");
            return;
        }

        setLoading(true);
        try {
            const category = await createCategory(name, color);
            onSuccess(category);
            setName("");
            setColor("#4ECDC4");
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create category",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: "#faf1e3" }}>
                <h2 className="text-xl font-bold mb-4">New Category</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Work, Personal, Ideas"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <SketchPicker
                            color={color}
                            onChangeComplete={(c) => setColor(c.hex)}
                            width="100%"
                            presetColors={[
                                "#FF6B6B",
                                "#4ECDC4",
                                "#45B7D1",
                                "#FFA07A",
                                "#98D8C8",
                                "#F7DC6F",
                                "#BB8FCE",
                                "#85C1E2",
                                "#F8B195",
                                "#C7CEEA",
                            ]}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <div className="flex gap-2 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
