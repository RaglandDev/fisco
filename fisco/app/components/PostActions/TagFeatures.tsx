"use client";

import { Tag } from "lucide-react";
import type { Tag as PostTag } from "@/types/index";

// Props for the TagButton component
interface TagButtonProps {
  tagsVisible: boolean;
  onToggleTags: () => void;
}

// Props for the TagsDisplay component
interface TagsDisplayProps {
  tags: PostTag[];
  visible: boolean;
}

// Helper function to determine label position based on pin position
export const getLabelPosition = (x: number, y: number) => {
  // Threshold values for edges (as percentage)
  const topThreshold = 0.15; // 15% from top
  const leftThreshold = 0.15; // 15% from left
  const rightThreshold = 0.85; // 15% from right

  // Default position (above the pin)
  const position = {
    top: "-top-10",
    left: "left-1/2",
    transform: "-translate-x-1/2",
    origin: "",
  };

  // If pin is near the top, place label below
  if (y < topThreshold) {
    position.top = "top-10";
  }

  // If pin is near the left edge, align label to start from pin
  if (x < leftThreshold) {
    position.left = "left-0";
    position.transform = "translate-x-0";
    position.origin = "origin-left";
  }

  // If pin is near the right edge, align label to end at pin
  if (x > rightThreshold) {
    position.left = "right-0";
    position.transform = "translate-x-0";
    position.origin = "origin-right";
  }

  return position;
};

// TagButton component to toggle tag visibility
export function TagButton({ tagsVisible, onToggleTags }: TagButtonProps) {
  return (
    <button
      aria-label="Show tags button"
      data-testid="Show tags button"
      onClick={onToggleTags}
      className={`flex flex-col items-center transition-all duration-200 hover:scale-110 ${tagsVisible ? "text-red-500" : "text-white"}`}
    >
      <Tag
        className={`w-7 h-7 transition-all duration-300 ease-in-out ${tagsVisible ? "scale-110" : ""}`}
      />
    </button>
  );
}

// TagsDisplay component to show the tags on a post
export function TagsDisplay({ tags, visible }: TagsDisplayProps) {
  if (!tags) {
    return null;
  }

  return (
    <>
      {(() => {
        try {
          return tags.map((tag, tagIndex) => {
            // Get dynamic position for label based on tag position
            const labelPosition = getLabelPosition(tag.x, tag.y);

            return (
              <div
                id={`post tag ${tagIndex}`}
                key={tagIndex}
                className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
                style={{
                  left: `${tag.x * 100}%`,
                  top: `${tag.y * 100}%`,
                  pointerEvents: visible ? "auto" : "none",
                }}
              >
                <div className="flex items-center justify-center">
                  <Tag className="h-6 w-6 text-red-500 fill-red-500/50" />
                </div>

{/* since parent toggles opacity, e2e tests can still 'see' this element unless you check for conditional attribute vis/notvis*/}
                {/* tag label */}
                {tag.label && (
                  <div
                    className={`${visible ? 'vis' : 'notvis'} absolute ${labelPosition.top} ${labelPosition.left} ${labelPosition.origin} transform ${labelPosition.transform} bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-30`}
                  >
                    {tag.label}
                  </div>
                )}
              </div>
            );
          });
        } catch (e) {
          console.error("Error parsing tag data:", e);
          return null;
        }
      })()}
    </>
  );
}
