import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { type Document } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher, removeFromInfiniteCache } from "@workspace/ui/lib/fetcher";
import { FilePlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { DeleteForm } from "../custom/delete-form";
import { RenameForm, type RenameFormData } from "../custom/rename-form";
import { clearEditor } from "./helper-functions/clear-editor";

export const EditorDropdownMenu = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const { textEditorRef, codeEditorRef } = useRefs();

  const {
    editorMode,
    textDocumentIdentifier,
    setTextDocumentIdentifier,
    codeDocumentIdentifier,
    setCodeDocumentIdentifier,
  } = useEditor();
  const [autocomplete, setAutocomplete] = useLocalStorage<{
    text: boolean;
  }>("autocomplete", {
    text: false,
  });

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const documentIdentifier =
    editorMode === "text" ? textDocumentIdentifier : codeDocumentIdentifier;
  const setDocumentIdentifier =
    editorMode === "text"
      ? setTextDocumentIdentifier
      : setCodeDocumentIdentifier;

  const onSubmit = async (values: RenameFormData) => {
    if (!documentIdentifier.id) {
      throw new Error("Document Id is missing");
    }

    if (values.title === documentIdentifier.title) {
      setRenameDialogOpen(false);
      return;
    }

    await apiFetcher(
      (client) =>
        client["documents"]["title"][":documentId"][":title"].$patch({
          param: {
            documentId: documentIdentifier.id!,
            title: values.title,
          },
        }),
      sharedT.apiCodes,
    );
  };

  const handleRename = (values: RenameFormData) => {
    setDocumentIdentifier({
      id: documentIdentifier.id,
      title: values.title,
    });
    setRenameDialogOpen(false);

    queryClient.setQueryData(
      ["documents"],
      (oldData: { pages: Array<Document[]>; pageParams: number[] }) => {
        if (!oldData) return oldData;
        return {
          pages: oldData.pages.map((page) =>
            page.map((doc) =>
              doc.id === documentIdentifier.id
                ? { ...doc, title: values.title }
                : doc,
            ),
          ),
          pageParams: oldData.pageParams,
        };
      },
    );

    return "Document renamed!";
  };

  const handleDelete = async (deletedId?: string) => {
    if (!deletedId) {
      return;
    }

    await apiFetcher(
      (client) =>
        client["documents"][":documentId"].$delete({
          param: { documentId: deletedId },
        }),
      sharedT.apiCodes,
    );

    await clearEditor(editorMode, textEditorRef, codeEditorRef);
    setDocumentIdentifier({
      id: undefined,
      title: "",
    });

    setDeleteDialogOpen(false);
    removeFromInfiniteCache(queryClient, ["documents"], deletedId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {documentIdentifier.id && (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setRenameDialogOpen(true)}
              >
                <Pencil className="mr-2 size-4" />
                <span>{webT.editorDropdownMenu.rename}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-400"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                <span>{webT.editorDropdownMenu.delete}</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setDocumentIdentifier({
                id: undefined,
                title: "",
              });
              clearEditor(editorMode, textEditorRef, codeEditorRef);
            }}
          >
            <FilePlus className="mr-2 size-4" />
            <span>{webT.editorDropdownMenu.new}</span>
          </DropdownMenuItem>
          {editorMode === "text" && (
            <DropdownMenuItem className="flex cursor-pointer justify-between">
              <span>{webT.editorDropdownMenu.autocomplete}</span>
              <Switch
                className="cursor-pointer"
                checked={autocomplete.text}
                onCheckedChange={(checked) => {
                  setAutocomplete((prev) => ({
                    ...prev,
                    [editorMode]: checked,
                  }));
                }}
              />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameForm
        renameDialogOpen={renameDialogOpen}
        setRenameDialogOpen={setRenameDialogOpen}
        onSubmit={onSubmit}
        handleSuccess={handleRename}
        defaultTitle={documentIdentifier.title}
        type="document"
      />

      <DeleteForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onDelete={() => handleDelete(documentIdentifier.id)}
        type="document"
      />
    </>
  );
});
