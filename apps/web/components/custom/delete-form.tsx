import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { memo } from "react";
import { toast } from "sonner";

interface DeleteFormProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => Promise<void>;
  type: "document" | "chat" | "folder";
}

export const DeleteForm = memo(
  ({
    deleteDialogOpen,
    setDeleteDialogOpen,
    onDelete,
    type,
  }: DeleteFormProps) => {
    const { webT } = useWebTranslations();

    return (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{webT.deleteForm.title[type]}</DialogTitle>
            <DialogDescription>
              {webT.deleteForm.description[type]}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {webT.deleteForm.cancel}
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast.promise(onDelete(), {
                  loading: webT.deleteForm.deleting,
                  success: () => webT.deleteForm.deleted[type],
                  error: () => webT.deleteForm.error[type],
                });
              }}
            >
              {webT.deleteForm.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
