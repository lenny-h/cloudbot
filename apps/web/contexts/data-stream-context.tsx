"use client";

import { type CustomUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type DataUIPart } from "ai";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface DataStreamContextType {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: Dispatch<SetStateAction<DataUIPart<CustomUIDataTypes>[]>>;
}

const DataStreamContext = createContext<DataStreamContextType | undefined>(
  undefined,
);

export function DataStreamProvider({ children }: { children: ReactNode }) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    [],
  );

  const value = useMemo(
    () => ({ dataStream, setDataStream }),
    [dataStream, setDataStream],
  );

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within DataStreamProvider");
  }
  return context;
}
