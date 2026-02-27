"use client";

import { useEditor } from "@/contexts/editor-context";
import { resizeEditor } from "@/lib/utils";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
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
  currentFilename: string | null;
  openPdf: (
    isMobile: boolean,
    panelRef: RefObject<PanelImperativeHandle | null>,
    folderId: string,
    filename: string,
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

function getCachedUrl(folderId: string, filename: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${folderId}:${filename}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (!cached) return null;

    const data: CachedUrl = JSON.parse(cached);
    const now = Date.now();

    if (data.expiresAt > now) {
      return data.url;
    }

    // Clean up expired cache entry
    sessionStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

function setCachedUrl(folderId: string, filename: string, url: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${folderId}:${filename}`;
    const data: CachedUrl = {
      url,
      expiresAt: Date.now() + CACHE_EXPIRY_MS,
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

export function PDFProvider({ children }: { children: ReactNode }) {
  const { sharedT } = useSharedTranslations();
  const { setEditorMode } = useEditor();

  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const getSignedUrl = useCallback(
    async (folderId: string, filename: string): Promise<string> => {
      // Check if we have a cached URL that's still valid
      const cached = getCachedUrl(folderId, filename);
      if (cached) {
        return cached;
      }

      // Otherwise, fetch a new signed URL
      const { signedUrl } = await apiFetcher(
        (client) =>
          client.files["get-signed-url"][":folderId"][":filename"].$get({
            param: { folderId, filename },
          }),
        sharedT.apiCodes,
      );

      // Cache the URL
      setCachedUrl(folderId, filename, signedUrl);

      return signedUrl;
    },
    [sharedT.apiCodes],
  );

  const loadPdf = useCallback(
    async (folderId: string, filename: string) => {
      setCurrentFilename(filename);
      setIsFetching(true);

      try {
        const signedUrl = await getSignedUrl(folderId, filename);
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
      filename: string,
    ) => {
      if (isMobile) {
        try {
          const signedUrl = await getSignedUrl(folderId, filename);
          window.open(signedUrl, "_blank");
        } catch (error) {
          console.error("Error opening PDF on mobile:", error);
          toast.error("Failed to open PDF. Please try again later.");
        }
      } else {
        resizeEditor(panelRef, false);
        loadPdf(folderId, filename);
      }
    },
    [getSignedUrl, loadPdf],
  );

  return (
    <PDFContext.Provider
      value={{
        currentPdfUrl,
        currentFilename,
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
