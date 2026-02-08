"use client";

import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema.js";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

interface Props {
  children: ReactNode;
}

interface ContextFilter {
  prompts: Array<{ id: string; name: string }>;
  folders: Array<{ id: string; name: string }>;
  files: Array<{ id: string; name: string }>;
  documents: Array<{ id: string; title: string; kind: ArtifactKind }>;
}

interface FilterContextType {
  filter: ContextFilter;
  setFilter: React.Dispatch<React.SetStateAction<ContextFilter>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: Props) {
  const [filter, setFilter] = useState<ContextFilter>({
    prompts: [],
    folders: [],
    files: [],
    documents: [],
  });

  return (
    <FilterContext.Provider
      value={{
        filter,
        setFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextType {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
