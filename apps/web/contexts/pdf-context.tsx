"use client";

import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useState,
} from "react";
import { type PanelImperativeHandle } from "react-resizable-panels";
import { toast } from "sonner";

interface PDFContextType {
  currentPdfUrl: string | null;
  currentFileName: string | null;
  openPdf: (
    isMobile: boolean,
    panelRef: RefObject<PanelImperativeHandle | null>,
    folderId: string,
    fileId: string,
  ) => Promise<void>;
  isFetching: boolean;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

const CACHE_KEY_PREFIX = "pdf_signed_url_";
const CACHE_EXPIRY_MS = 180 * 60 * 1000; // 3 hours

interface CachedUrl {
  url: string;
  expiresAt: number;
}

function getCachedUrl(folderId: string, fileId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${folderId}:${fileId}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const data: CachedUrl = JSON.parse(cached);
    const now = Date.now();

    if (data.expiresAt > now) {
      return data.url;
    }

    // Clean up expired cache entry
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

function setCachedUrl(folderId: string, fileId: string, url: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${folderId}:${fileId}`;
    const data: CachedUrl = {
      url,
      expiresAt: Date.now() + CACHE_EXPIRY_MS,
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

export function PDFProvider({ children }: { children: ReactNode }) {
  const { sharedT } = useSharedTranslations();

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);

  const [, setEditorMode] = useEditor();

  const [isFetching, setIsFetching] = useState(false);

  const getSignedUrl = useCallback(
    async (folderId: string, fileId: string): Promise<string> => {
      // Check if we have a cached URL that's still valid
      const cached = getCachedUrl(folderId, fileId);
      if (cached) {
        return cached;
      }

      // Otherwise, fetch a new signed URL
      const { signedUrl } = await apiFetcher(
        (client) =>
          client.files["get-signed-url"][":folderId"][":fileId"].$get({
            param: { folderId, fileId },
          }),
        sharedT.apiCodes,
      );

      // Cache the URL
      setCachedUrl(folderId, fileId, signedUrl);

      return signedUrl;
    },
    [sharedT.apiCodes],
  );

  const loadPdf = useCallback(
    async (folderId: string, fileId: string) => {
      setCurrentFileName(fileId);
      setIsFetching(true);

      try {
        const signedUrl = await getSignedUrl(folderId, fileId);
        setCurrentPdfUrl(signedUrl);
        setEditorMode("pdf");
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast.error("Failed to load PDF. Please try again later.");
      } finally {
        setIsFetching(false);
      }
    },
    [getSignedUrl, setEditorMode],
  );

  const openPdf = useCallback(
    async (
      isMobile: boolean,
      panelRef: RefObject<PanelImperativeHandle | null>,
      folderId: string,
      fileId: string,
    ) => {
      if (isMobile) {
        try {
          const signedUrl = await getSignedUrl(folderId, fileId);
          window.open(signedUrl, "_blank");
        } catch (error) {
          console.error("Error opening PDF on mobile:", error);
          toast.error("Failed to open PDF. Please try again later.");
        }
      } else {
        resizeEditor(panelRef, false);
        loadPdf(folderId, fileId);
      }
    },
    [getSignedUrl, loadPdf],
  );

  return (
    <PDFContext.Provider
      value={{
        currentPdfUrl,
        currentFileName,
        openPdf,
        isFetching,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
}

export function usePdf() {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error("usePdf must be used within a PDFProvider");
  }
  return context;
}
