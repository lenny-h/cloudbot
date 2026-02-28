import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { resizeEditor } from "@/lib/utils";
import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { toast } from "sonner";

export function useDocumentHandler() {
  const { sharedT } = useSharedTranslations();
  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const {
    setEditorMode,
    setTextDocumentIdentifier,
    setCodeDocumentIdentifier,
  } = useEditor();

  const handleDocumentClick = ({
    documentId,
    documentTitle,
    documentKind,
  }: {
    documentId: string;
    documentTitle: string;
    documentKind: ArtifactKind;
  }) => {
    toast.promise(
      (async () => {
        const document = await apiFetcher(
          (client) =>
            client["documents"][":documentId"].$get({
              param: { documentId },
            }),
          sharedT.apiCodes,
        );

        if (!document.content) {
          throw new Error("Document content is empty");
        }

        setEditorMode(documentKind);

        const { updateEditorWithDispatch } =
          await import("@/components/editors/helper-functions/update-editor-with-dispatch");

        if (documentKind === "text") {
          updateEditorWithDispatch("text", textEditorRef, document.content);

          setTextDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        } else {
          updateEditorWithDispatch("code", codeEditorRef, document.content);

          setCodeDocumentIdentifier({
            id: documentId,
            title: documentTitle,
          });
        }

        resizeEditor(panelRef, false);
      })(),
      {
        loading: "Loading document...",
        success: "Document loaded successfully",
        error: (error) => "Error loading document: " + error,
      },
    );
  };

  return { handleDocumentClick };
}
