"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { isAdminUser, signOut, useSession } from "@workspace/ui/lib/auth-client";
import { LogOut, Shield, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  const { data: session } = useSession();

  const isAdmin = isAdminUser(session?.user?.id);

  const initials = session?.user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <nav className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Image
                src="/logo.png"
                alt="Zexa Logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="text-xl font-bold">Zexa Better Auth Starter</span>
          </Link>

          {/* Navigation Links */}
          {session && (
            <div className="hidden items-center gap-4 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {!session ? (
            <div className="flex items-center gap-2">
              <Link href="/auth/register">
                <Button variant="ghost" size="sm">
                  Sign Up
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Admin Badge */}
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="hidden items-center gap-1 sm:flex"
                >
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                      {initials}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-muted-foreground text-xs leading-none">
                        {session.user.email
                          ? session.user.email.replace(/^[^@]+/, "***")
                          : ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  {/* Admin Panel Link - Only show for admin users */}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
