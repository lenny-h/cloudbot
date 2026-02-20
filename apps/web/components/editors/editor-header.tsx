import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useDiffActions } from "@/hooks/use-diff-actions";
import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { KeyboardShortcut } from "@workspace/ui/shared-components/keyboard-shortcut";
import { Check, Copy, X } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { EditorDropdownMenu } from "./editor-dropdown-menu";
import { LoadButton } from "./load-button";
import { ModeSwitcher } from "./mode-switcher";
import {
  mathLatexSerializer,
  mathMarkdownSerializer,
} from "./prosemirror-math/utils/text-serializer";
import { SaveDocumentForm } from "./save-document-form";
import { VersionSelector } from "./version-selector";

export const EditorHeader = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const { editorMode, textDocumentIdentifier, codeDocumentIdentifier } =
    useEditor();
  const { showDiffActions, isViewingVersion, isBlocked } = useDiff();
  const { handleDiffAction } = useDiffActions();

  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const documentIdentifier =
    editorMode === "text" ? textDocumentIdentifier : codeDocumentIdentifier;

  const saveDocument = useCallback(
    async (idToSave?: string) => {
      if (isSaving || !idToSave) return;

      let content: string | undefined;

      switch (editorMode) {
        case "text":
          content = textEditorRef.current?.state.doc
            ? mathMarkdownSerializer.serialize(textEditorRef.current.state.doc)
            : "";
          break;
        case "code":
          content = codeEditorRef.current?.state.doc.toString();
          break;
        default:
          content = "";
      }

      if (!content) {
        toast.error(webT.editorHeader.noContentToSave);
        return;
      }

      setIsSaving(true);

      try {
        await apiFetcher(
          (client) =>
            client["documents"][":documentId"].$patch({
              param: { documentId: idToSave },
              json: { content },
            }),
          sharedT.apiCodes,
        );
      } catch (error) {
        toast.error(webT.editorHeader.failedToSave);
      } finally {
        setTimeout(() => setIsSaving(false), 600);
      }
    },
    [isSaving, editorMode, textEditorRef, codeEditorRef, webT],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (documentIdentifier.id) {
          saveDocument(documentIdentifier.id);
        } else {
          setSaveDialogOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDocument]);

  const handleCopy = useCallback(
    (format?: "markdown" | "latex") => {
      if (editorMode === "text" && textEditorRef.current) {
        const serializedContent =
          format === "latex"
            ? mathLatexSerializer.serialize(textEditorRef.current.state.doc)
            : mathMarkdownSerializer.serialize(textEditorRef.current.state.doc);
        copyToClipboard(serializedContent);
        setCopied(true);
      } else if (editorMode === "code" && codeEditorRef.current) {
        copyToClipboard(codeEditorRef.current.state.doc.toString());
        setCopied(true);
      }

      setTimeout(() => setCopied(false), 3500);
    },
    [editorMode, textEditorRef, codeEditorRef, copyToClipboard],
  );

  return (
    <div className="bg-sidebar flex h-14 items-center gap-2 overflow-x-auto border-b px-3">
      <Button variant="ghost" onClick={() => panelRef.current?.collapse()}>
        <X />
      </Button>

      <div className="flex-1 truncate text-left text-lg font-semibold">
        {showDiffActions
          ? webT.editorHeader.diffView
          : documentIdentifier.title}
      </div>

      {showDiffActions ? (
        <ButtonGroup>
          <Button onClick={() => handleDiffAction(true)}>
            {webT.editorHeader.accept}
          </Button>
          <Button variant="outline" onClick={() => handleDiffAction(false)}>
            {webT.editorHeader.deny}
          </Button>
        </ButtonGroup>
      ) : (
        <>
          <ButtonGroup>
            {editorMode === "code" ? (
              <Button variant="ghost" disabled={isBlocked}>
                {copied ? (
                  <Check className="text-green-500" />
                ) : (
                  <Copy onClick={() => handleCopy()} />
                )}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" disabled={isBlocked}>
                    {copied ? <Check className="text-green-500" /> : <Copy />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleCopy("markdown")}
                  >
                    {webT.editorHeader.markdown}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleCopy("latex")}
                  >
                    {webT.editorHeader.latex}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>

          {!showDiffActions && !isViewingVersion && <ModeSwitcher />}

          {!showDiffActions && (
            <LoadButton type={editorMode === "pdf" ? "files" : "documents"} />
          )}

          {!showDiffActions && documentIdentifier.id && (
            <VersionSelector
              documentId={documentIdentifier.id}
              isBlocked={isBlocked}
            />
          )}

          <ButtonGroup>
            {documentIdentifier.id ? (
              <Button
                className="px-2"
                disabled={isSaving || isBlocked}
                onClick={() => saveDocument(documentIdentifier.id)}
                variant="outline"
              >
                {isSaving ? webT.editorHeader.saving : webT.editorHeader.save}
                <KeyboardShortcut keys={["⌘", "s"]} />
              </Button>
            ) : (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="px-2"
                    variant="outline"
                    disabled={isBlocked}
                  >
                    {webT.editorHeader.save}
                    <KeyboardShortcut keys={["⌘", "s"]} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{webT.editorHeader.setTitle}</DialogTitle>
                    <DialogDescription>
                      {webT.editorHeader.saveDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <SaveDocumentForm onClose={() => setSaveDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}

            <EditorDropdownMenu />
          </ButtonGroup>
        </>
      )}
    </div>
  );
});
