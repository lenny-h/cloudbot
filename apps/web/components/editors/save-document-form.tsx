import * as z from "zod";

import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { DialogFooter } from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { renameSchema } from "../schemas/rename-schema";
import { mathMarkdownSerializer } from "./prosemirror-math/utils/text-serializer";

const titleFormSchema = z.object({
  title: renameSchema,
});

type TitleFormData = z.infer<typeof titleFormSchema>;

interface SaveDocumentFormProps {
  onClose: () => void;
}

export const SaveDocumentForm = memo(({ onClose }: SaveDocumentFormProps) => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();

  const { textEditorRef, codeEditorRef } = useRefs();
  const { editorMode, documentIdentifier, setDocumentIdentifier } = useEditor();

  const form = useForm<TitleFormData>({
    resolver: zodResolver(titleFormSchema),
    defaultValues: {
      title: documentIdentifier.title,
    },
  });

  const onSubmit = async (values: TitleFormData) => {
    let content, payload;
    if (editorMode === "text" && textEditorRef.current) {
      content = mathMarkdownSerializer.serialize(
        textEditorRef.current.state.doc,
      );
      payload = {
        title: values.title,
        content,
        kind: "text" as const,
      };
    } else if (editorMode === "code" && codeEditorRef.current) {
      content = codeEditorRef.current.state.doc.toString();
      payload = {
        title: values.title,
        content,
        kind: "code" as const,
      };
    } else {
      return;
    }

    const result = await apiFetcher(
      (client) => client.documents.$post({ json: payload }),
      sharedT.apiCodes,
    );

    setDocumentIdentifier({
      id: result.id,
      title: values.title,
    });
    onClose();

    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  useEffect(() => {
    form.setValue("title", documentIdentifier.title);
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          toast.promise(onSubmit(values), {
            loading: webT.saveDocumentForm.saving,
            success: webT.saveDocumentForm.saved,
            error: (error) => error.message || webT.saveDocumentForm.error,
          });
        })}
      >
        <div className="grid gap-4 py-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{webT.saveDocumentForm.titleLabel}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={webT.saveDocumentForm.titlePlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {webT.saveDocumentForm.cancel}
          </Button>
          <Button type="submit">{webT.saveDocumentForm.save}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
});
