"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, X, Clock, TrendingUp, Filter, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'user' | 'event' | 'document';
  title: string;
  subtitle?: string;
  url: string;
  icon: string;
}

export function GlobalSearch({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search queries
  const searchResults = useQuery(
    api.search.globalSearch,
    query.length >= 2 ? { query, limit: 8 } : "skip"
  );
  
  const searchHistory = useQuery(api.search.getSearchHistory, {});
  const trendingSearches = useQuery(api.search.getTrendingSearches, {});
  const addToHistory = useMutation(api.search.addSearchHistory);

  // Keyboard shortcuts (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
      }

      if (isOpen && searchResults) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
        }
        
        if (e.key === 'Enter' && searchResults[selectedIndex]) {
          handleSelectResult(searchResults[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectResult = async (result: SearchResult) => {
    await addToHistory({ query, resultType: result.type, resultId: result.id });
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const handleHistoryClick = async (historyItem: any) => {
    setQuery(historyItem.query);
    await addToHistory({ 
      query: historyItem.query, 
      resultType: historyItem.resultType,
      resultId: historyItem.resultId 
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      project: "💼",
      task: "✅",
      user: "👤",
      event: "📅",
      document: "📄"
    };
    return icons[type] || "📌";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      project: "text-purple-400",
      task: "text-blue-400",
      user: "text-emerald-400",
      event: "text-yellow-400",
      document: "text-pink-400"
    };
    return colors[type] || "text-gray-400";
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects, tasks, users... (Ctrl+K)"
          className="w-full bg-gray-800/50 border border-white/10 rounded-lg pl-10 pr-24 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          <button
            onClick={() => router.push('/search/advanced')}
            className="p-1.5 hover:bg-white/10 rounded transition-colors group"
            title="Advanced Search"
          >
            <Filter className="w-4 h-4 text-gray-400 group-hover:text-emerald-400" />
          </button>
          
          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-gray-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto">
          {query.length < 2 ? (
            // Show history and trending when no query
            <div className="p-2">
              {/* Search History */}
              {searchHistory && searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </div>
                  {searchHistory.slice(0, 5).map((item: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(item)}
                      className="w-full px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <span className="text-lg">{getTypeIcon(item.resultType)}</span>
                      <span className="text-white flex-1">{item.query}</span>
                      <span className={cn("text-xs", getTypeColor(item.resultType))}>
                        {item.resultType}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches && trendingSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending Searches
                  </div>
                  {trendingSearches.slice(0, 5).map((item: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(item.query)}
                      className="w-full px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <span className="text-emerald-400 font-mono text-sm">#{idx + 1}</span>
                      <span className="text-white flex-1">{item.query}</span>
                      <span className="text-xs text-gray-400">{item.count} searches</span>
                    </button>
                  ))}
                </div>
              )}

              {(!searchHistory || searchHistory.length === 0) && 
               (!trendingSearches || trendingSearches.length === 0) && (
                <div className="px-3 py-8 text-center text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start typing to search...</p>
                  <p className="text-xs mt-1">Try searching for projects, tasks, or users</p>
                </div>
              )}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            // Show search results
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400">
                Found {searchResults.length} results
              </div>
              {searchResults.map((result: SearchResult, idx: number) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    "w-full px-3 py-3 text-left rounded-lg transition-colors flex items-start gap-3",
                    selectedIndex === idx ? "bg-emerald-600/20 border border-emerald-500/50" : "hover:bg-white/5"
                  )}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="text-2xl">{result.icon || getTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium truncate">{result.title}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full bg-white/10", getTypeColor(result.type))}>
                        {result.type}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-400 truncate">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            // No results
            <div className="px-3 py-8 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
