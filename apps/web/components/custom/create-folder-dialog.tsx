"use client";

import * as z from "zod";

import { useWebTranslations } from "@/contexts/web-translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@workspace/ui/components/textarea";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { FolderPlus, Globe, Lock, ShieldCheck } from "lucide-react";
import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const createFolderSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Folder name must be at least 3 characters." })
      .max(128, { message: "Folder name must be less than 128 characters." }),
    description: z.string().max(512, {
      message: "Description must be less than 512 characters.",
    }),
    visibility: z.enum(["private", "protected", "public"]),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.visibility === "protected") {
        return data.password && data.password.length >= 8;
      }
      return true;
    },
    {
      message: "Password must be at least 8 characters for protected folders.",
      path: ["password"],
    },
  );

type CreateFolderData = z.infer<typeof createFolderSchema>;

const visibilityOptions = [
  {
    value: "private" as const,
    icon: Lock,
    color: "text-orange-500",
  },
  {
    value: "public" as const,
    icon: Globe,
    color: "text-green-500",
  },
  {
    value: "protected" as const,
    icon: ShieldCheck,
    color: "text-blue-500",
  },
];

export const CreateFolderDialog = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateFolderData>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "private",
      password: "",
    },
  });

  const visibility = form.watch("visibility");

  const onSubmit = async (values: CreateFolderData) => {
    const createFolderPromise = apiFetcher(
      (client) =>
        client.folders.$post({
          json: {
            values: {
              name: values.name,
              description: values.description,
              visibility: values.visibility,
              ...(values.visibility === "protected" && values.password
                ? { password: values.password }
                : {}),
            },
          },
        }),
      sharedT.apiCodes,
    ).then(() => {
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["managed-folders"] });
    });

    toast.promise(createFolderPromise, {
      loading: webT.createFolderDialog.creating,
      success: webT.createFolderDialog.created,
      error: (error) => error.message || webT.createFolderDialog.failedToCreate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <FolderPlus className="size-4" />
          {webT.createFolderDialog.createFolder}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{webT.createFolderDialog.createFolder}</DialogTitle>
          <DialogDescription>
            {webT.createFolderDialog.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{webT.createFolderDialog.folderName}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        webT.createFolderDialog.folderNamePlaceholder
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {webT.createFolderDialog.folderDescription}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        webT.createFolderDialog.folderDescriptionPlaceholder
                      }
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{webT.createFolderDialog.visibility}</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            field.onChange(option.value);
                            if (option.value !== "protected") {
                              form.setValue("password", "");
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-5",
                              isSelected
                                ? option.color
                                : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isSelected
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {
                              webT.createFolderDialog.visibilityOptions[
                                option.value
                              ]
                            }
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {webT.createFolderDialog.visibilityDescriptions[visibility]}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {visibility === "protected" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{webT.createFolderDialog.password}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder={
                            webT.createFolderDialog.passwordPlaceholder
                          }
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                {webT.createFolderDialog.cancel}
              </Button>
              <Button type="submit">{webT.createFolderDialog.create}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
