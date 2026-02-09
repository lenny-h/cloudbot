"use client";

import * as z from "zod";

import { useWebTranslations } from "@/contexts/web-translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const folderKeySchema = z.object({
  key: z.string().min(1, "Folder key is required"),
});

type FolderKeyData = z.infer<typeof folderKeySchema>;

interface FolderKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  onSuccess: () => void;
}

export const FolderKeyDialog = memo(
  ({
    open,
    onOpenChange,
    folderId,
    folderName,
    onSuccess,
  }: FolderKeyDialogProps) => {
    const { sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();

    const form = useForm<FolderKeyData>({
      resolver: zodResolver(folderKeySchema),
      defaultValues: {
        key: "",
      },
    });

    const onSubmit = async (values: FolderKeyData) => {
      const requestAccessPromise = apiFetcher(
        (client) =>
          client.folders["request-access"].$post({
            json: {
              folderId,
              key: values.key,
            },
          }),
        {
          ...sharedT.apiCodes,
          403: "Invalid folder key",
        },
      ).then(() => {
        form.reset();
        onSuccess();
      });

      toast.promise(requestAccessPromise, {
        loading: webT.folderKeyDialog.requestingAccess,
        success: webT.folderKeyDialog.accessGranted,
        error: (error) =>
          error.message || webT.folderKeyDialog.failedToRequestAccess,
      });
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {webT.folderKeyDialog.folderAccessRequired}
            </DialogTitle>
            <DialogDescription>
              {webT.folderKeyDialog.enterAccessKey.replace(
                "{folderName}",
                folderName,
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{webT.folderKeyDialog.folderKey}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            webT.folderKeyDialog.enterFolderAccessKey
                          }
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                >
                  {webT.folderKeyDialog.cancel}
                </Button>
                <Button type="submit">{webT.folderKeyDialog.submit}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);
