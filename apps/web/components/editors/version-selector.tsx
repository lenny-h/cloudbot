import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { History, RotateCcw } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { disableEditor } from "./helper-functions/disable-editor";

interface VersionSelectorProps {
  documentId: string;
  isBlocked: boolean;
}

export const VersionSelector = memo(
  ({ documentId, isBlocked }: VersionSelectorProps) => {
    const { sharedT } = useSharedTranslations();
    const { textEditorRef, codeEditorRef } = useRefs();
    const { editorMode } = useEditor();
    const { textDiffPrev, codeDiffPrev, setIsViewingVersion } = useDiff();

    const [versionCount, setVersionCount] = useState(0);
    const [viewingVersion, setViewingVersion] = useState<number | null>(null);
    const [versionContent, setVersionContent] = useState<string | null>(null);
    const [isLoadingVersion, setIsLoadingVersion] = useState(false);

    // Fetch version count when document changes
    useEffect(() => {
      const fetchVersionCount = async () => {
        if (!documentId) {
          setVersionCount(0);
          return;
        }

        try {
          const result = await apiFetcher(
            (client) =>
              client["documents"]["versions"][":documentId"].$get({
                param: { documentId },
              }),
            sharedT.apiCodes,
          );

          setVersionCount(result.count);
        } catch (error) {
          console.error("Failed to fetch version count:", error);
        }
      };

      fetchVersionCount();
    }, [documentId, sharedT.apiCodes]);

    const loadVersion = useCallback(
      async (version: number) => {
        if (!documentId || isLoadingVersion) return;

        setIsLoadingVersion(true);
        setIsViewingVersion(true);

        try {
          const result = await apiFetcher(
            (client) =>
              client["documents"]["version"][":documentId"].$get({
                param: { documentId },
                query: { version: version.toString() },
              }),
            sharedT.apiCodes,
          );

          setVersionContent(result.previousText);
          setViewingVersion(version);

          // Store current editor state before loading version (similar to datastream handler)
          if (editorMode === "text" && textEditorRef.current) {
            textDiffPrev.current = textEditorRef.current.state;

            // Disable editor
            disableEditor(editorMode, textEditorRef, codeEditorRef);

            // Update editor with version content
            const { updateEditorWithDispatch } =
              await import("@/components/editors/helper-functions/update-editor-with-dispatch");
            updateEditorWithDispatch(
              "text",
              textEditorRef,
              result.previousText,
            );

            toast.info(`Viewing version ${version + 1}`);
          } else if (editorMode === "code" && codeEditorRef.current) {
            codeDiffPrev.current = codeEditorRef.current.state;

            // Disable editor
            disableEditor(editorMode, textEditorRef, codeEditorRef);

            // Update editor with version content
            const { updateEditorWithDispatch } =
              await import("@/components/editors/helper-functions/update-editor-with-dispatch");
            updateEditorWithDispatch(
              "code",
              codeEditorRef,
              result.previousText,
            );

            toast.info(`Viewing version ${version + 1}`);
          }
        } catch (error) {
          toast.error("Failed to load version");
          setIsViewingVersion(false);
        } finally {
          setIsLoadingVersion(false);
        }
      },
      [
        documentId,
        editorMode,
        textEditorRef,
        codeEditorRef,
        isLoadingVersion,
        setIsViewingVersion,
        textDiffPrev,
        codeDiffPrev,
        sharedT.apiCodes,
      ],
    );

    const restoreVersion = useCallback(async () => {
      if (!documentId || !versionContent) return;

      const toastId = toast.loading("Restoring version...");
      try {
        await apiFetcher(
          (client) =>
            client["documents"][":documentId"].$patch({
              param: { documentId },
              json: { content: versionContent },
            }),
          sharedT.apiCodes,
        );

        toast.success("Version restored successfully", { id: toastId });

        setViewingVersion(null);
        setIsViewingVersion(false);

        handleDiffAction(true); // Accept changes to update editor state
      } catch (error) {
        toast.error("Failed to restore version", { id: toastId });
      }
    }, [
      documentId,
      versionContent,
      editorMode,
      textEditorRef,
      codeEditorRef,
      setIsViewingVersion,
      textDiffPrev,
      codeDiffPrev,
      sharedT.apiCodes,
    ]);

    const exitVersionView = useCallback(() => {
      setViewingVersion(null);
      setIsViewingVersion(false);

      handleDiffAction(false); // Revert to previous state without saving
    }, [setViewingVersion, setIsViewingVersion, handleDiffAction]);

    // If viewing a version, show restore/exit buttons
    if (viewingVersion !== null) {
      return (
        <ButtonGroup>
          <Button onClick={restoreVersion}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore Version
          </Button>
          <Button variant="outline" onClick={exitVersionView}>
            Exit
          </Button>
        </ButtonGroup>
      );
    }

    // If there are no versions, don't show anything
    if (versionCount === 0) {
      return null;
    }

    // Show version dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isBlocked}>
            <History className="mr-2 h-4 w-4" />
            Previous versions ({versionCount})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Array.from({ length: versionCount }, (_, i) => (
            <DropdownMenuItem
              key={i}
              className="cursor-pointer"
              onClick={() => loadVersion(i)}
            >
              Version {i + 1}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

VersionSelector.displayName = "VersionSelector";
