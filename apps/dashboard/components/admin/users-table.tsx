"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
  GitHubIcon,
  GitLabIcon,
  GoogleIcon,
} from "@workspace/ui/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { adminApiFetcher } from "@workspace/ui/lib/fetcher";
import { format } from "date-fns";
import {
  Ban,
  Check,
  CheckCircle,
  Mail,
  Search,
  Shield,
  User,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UserActions } from "./user-actions";
import { UserAddDialog } from "./user-add-dialog";

// Helper function to render account icons
const getAccountIcon = (account: string) => {
  switch (account) {
    case "credential":
      return <Mail className="h-4 w-4 dark:text-neutral-300" />;
    case "google":
      return <GoogleIcon />;
    case "gitlab":
      return <GitLabIcon />;
    case "github":
      return <GitHubIcon />;
    default:
      return null;
  }
};

export function UsersTable() {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();
  const t = dashboardT.usersTable;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Filters and sort state, initialized from URL
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [debouncedEmail, setDebouncedEmail] = useState(email);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, 300);

    return () => clearTimeout(timer);
  }, [email]);

  // Update URL when filters/sort/page change
  useEffect(() => {
    const params = new URLSearchParams();
    if (role && role !== "all") params.set("role", role);
    if (debouncedEmail) params.set("email", debouncedEmail);
    if (page) params.set("page", String(page));
    params.set("limit", String(limit));
    router.replace(`?${params.toString()}`);
  }, [role, debouncedEmail, page, router]);

  // Build query key with all params
  const queryKey = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (role && role !== "all") params.role = role;
    if (debouncedEmail) params.email = debouncedEmail;
    return ["admin-users", params];
  }, [role, debouncedEmail, page, limit]);

  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role && role !== "all") params.set("role", role);
      if (debouncedEmail) params.set("email", debouncedEmail);
      params.set("page", String(page));
      params.set("limit", String(limit));

      return await adminApiFetcher(
        (client) => client.users.$get({ query: Object.fromEntries(params) }),
        sharedT.apiCodes,
      );
    },
    staleTime: 0,
  });

  const handleActionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  // Filter and sort controls
  const filterControls = (
    <div className="mb-2 flex w-full flex-wrap items-end justify-between gap-2">
      <div className="flex items-end gap-2">
        {/* Search by email */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchEmail}
            className="bg-background w-50 rounded-md border py-2 pr-2 pl-8 text-sm"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {/* Role select with icon */}
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t.allRoles}
              </span>
            </SelectItem>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t.admin}
              </span>
            </SelectItem>
            <SelectItem value="user">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.user}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button
        className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-xs transition-colors"
        onClick={() => setIsAddDialogOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        {t.addUser}
      </button>
    </div>
  );

  if (error) return <div>{t.failedToLoad}</div>;
  if (!data)
    return (
      <div className="border-accent-foreground space-y-4">
        {filterControls}
        <div className="overflow-hidden">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                {[
                  { label: t.name },
                  { label: t.verification },
                  { label: t.linkedAccounts },
                  { label: t.role },
                  { label: t.status },
                  { label: t.lastSignIn },
                  { label: t.createdAt },
                  { label: t.actions, className: "w-[80px]" },
                ].map((col) => (
                  <TableHead
                    key={col.label}
                    className={[
                      col.className,
                      "text-muted-foreground px-4 py-3 text-xs font-medium",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-30" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8 rounded-full" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-15" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-35" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-35" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );

  const { users, total, totalPages } = data;

  // Transform serialized dates back to Date objects
  // (API sends Date objects, but they're serialized to strings during JSON transport)
  const transformedUsers = users.map((user) => ({
    ...user,
    banExpires: user.banExpires ? new Date(user.banExpires) : null,
    lastSignIn: user.lastSignIn ? new Date(user.lastSignIn) : null,
    createdAt: new Date(user.createdAt),
  }));

  // Pagination logic for shadcn/ui Pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : 0}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          {pageNumbers.map((pNum) => (
            <PaginationItem key={pNum}>
              <PaginationLink
                isActive={pNum === page}
                onClick={() => setPage(pNum)}
              >
                {pNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-disabled={page === totalPages}
              tabIndex={page === totalPages ? -1 : 0}
              className={
                page === totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {filterControls}
      <div className="border-muted overflow-hidden rounded-lg border-2">
        <Table className="text-sm">
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {[
                { label: t.name },
                { label: t.verification },
                { label: t.linkedAccounts },
                { label: t.role },
                { label: t.status },
                { label: t.lastSignIn },
                { label: t.createdAt },
                { label: t.actions, className: "w-[80px]" },
              ].map((col) => (
                <TableHead
                  key={col.label}
                  className={[
                    col.className,
                    "text-muted-foreground px-4 py-3 text-xs font-medium",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-30" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 w-8 rounded-full" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-6 w-15" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-35" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-4 w-35" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : transformedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                          {user.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground text-sm font-medium">
                            {user.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {user.email.replace(/^[^@]+/, (match) =>
                              "*".repeat(match.length),
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {user.verified ? (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {t.verified}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-yellow-200 bg-yellow-50 px-2 py-1 text-xs text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          <XCircle className="h-3 w-3" />
                          {t.unverified}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {user.accounts.map((account) => (
                          <div
                            key={account}
                            className="bg-muted text-muted-foreground rounded-full p-1.5 dark:bg-neutral-700"
                            title={account}
                          >
                            {getAccountIcon(account)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 px-2 py-1 text-xs ${
                          user.role === "admin"
                            ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200"
                            : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {user.role === "admin" ? t.admin : t.user}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {user.banned ? (
                        <div className="flex flex-col gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="destructive"
                                className="flex cursor-help items-center gap-1 px-2 py-1 text-xs"
                              >
                                <Ban className="h-3 w-3" />
                                {t.banned}
                              </Badge>
                            </TooltipTrigger>
                            {user.banReason && (
                              <TooltipContent>
                                {t.reason.replace("{reason}", user.banReason)}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          {user.banExpires && (
                            <span className="text-muted-foreground text-xs">
                              {t.expires.replace(
                                "{date}",
                                format(user.banExpires, "MMM d, yyyy"),
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
                        >
                          <Check className="h-3 w-3" />
                          {t.active}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-xs">
                      {user.lastSignIn
                        ? format(user.lastSignIn, "MMM d, yyyy 'at' h:mm a")
                        : t.never}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-xs">
                      {format(user.createdAt, "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <UserActions
                        user={user}
                        onActionComplete={handleActionComplete}
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-1">
        <div className="text-muted-foreground text-sm">
          {t.showingUsers
            .replace("{count}", String(transformedUsers.length))
            .replace("{total}", String(total))}
        </div>
        {renderPagination()}
      </div>
      <UserAddDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["admin-users"] })
        }
      />
    </div>
  );
}
