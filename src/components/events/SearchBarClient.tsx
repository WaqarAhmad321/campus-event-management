
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce"; // You might need to create this hook

export default function SearchBarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce

  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!debouncedSearchTerm) {
      current.delete("search");
    } else {
      current.set("search", debouncedSearchTerm);
    }
    
    // Maintain other search params like category and tags
    const queryString = current.toString();
    const path = queryString ? `/?${queryString}` : "/";
    router.push(path, { scroll: false }); // scroll: false to prevent jumping to top
  }, [debouncedSearchTerm, router, searchParams]);
  
  // Update searchTerm if URL changes from outside (e.g. browser back/forward)
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search events by keyword..."
        className="w-full pl-10 pr-4 py-2"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
