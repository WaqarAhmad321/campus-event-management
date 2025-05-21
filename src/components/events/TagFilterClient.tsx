
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { EventTag } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagFilterClientProps {
  availableTags: readonly EventTag[];
}

export default function TagFilterClient({ availableTags }: TagFilterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const getSelectedTags = () => {
    const tagsQuery = searchParams.get("tags");
    return tagsQuery ? tagsQuery.split(",").map(tag => tag.trim()) : [];
  };

  const handleTagChange = (tag: EventTag, checked: boolean) => {
    const currentSelectedTags = getSelectedTags();
    let newSelectedTags: string[];

    if (checked) {
      newSelectedTags = [...currentSelectedTags, tag];
    } else {
      newSelectedTags = currentSelectedTags.filter(t => t !== tag);
    }

    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    if (newSelectedTags.length > 0) {
      currentParams.set("tags", newSelectedTags.join(","));
    } else {
      currentParams.delete("tags");
    }
    
    const queryString = currentParams.toString();
    const path = queryString ? `/?${queryString}` : "/";
    router.push(path, { scroll: false });
  };

  const selectedTagsSet = new Set(getSelectedTags());

  return (
    <ScrollArea className="h-48 rounded-md border p-3 bg-card">
      <div className="space-y-2">
        {availableTags.map((tag) => (
          <div key={tag} className="flex items-center space-x-2">
            <Checkbox
              id={`tag-${tag}`}
              checked={selectedTagsSet.has(tag)}
              onCheckedChange={(checked) => handleTagChange(tag, Boolean(checked))}
            />
            <Label htmlFor={`tag-${tag}`} className="font-normal text-sm cursor-pointer">
              {tag}
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
