// components/TagText.tsx
"use client";
import { useMemo } from "react";
import { stringToColor } from "@/utils/color";

export default function TagText({ tag }: { tag: string }) {
    const color = useMemo(() => stringToColor(tag), [tag]);
    return (
        <span style={{ color }}>
            {tag}
        </span>
    );
}