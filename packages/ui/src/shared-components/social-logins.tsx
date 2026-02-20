"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/button";
import { GitHubIcon, GitLabIcon, GoogleIcon } from "../components/icons";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { client } from "../lib/auth-client";

export const SocialLogins = memo(() => {
  const { locale, sharedT } = useSharedTranslations();
  const [isPending, setIsPending] = useState(false);

  const handleGoogleLogin = () => {
    const googleLoginPromise = async () => {
      setIsPending(true);

      const response = await client.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/${locale}`,
      });

      setIsPending(false);

      return response;
    };

    toast.promise(googleLoginPromise, {
      loading: sharedT.socialLogins.redirectingTo.replace(
        "{provider}",
        "Google",
      ),
      success: sharedT.socialLogins.redirectingTo.replace(
        "{provider}",
        "Google",
      ),
      error: sharedT.socialLogins.redirectError.replace("{provider}", "Google"),
    });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        className="border border-primary w-full"
        onClick={handleGoogleLogin}
        type="submit"
        variant="outline"
        disabled={isPending}
      >
        {isPending ? (
          sharedT.signIn.redirecting
        ) : (
          <>
            <GoogleIcon />
            Google
          </>
        )}
      </Button>
      <Button
        className="border border-primary w-full"
        type="submit"
        variant="outline"
        disabled
      >
        <GitHubIcon />
        GitHub
      </Button>
      <Button
        className="border border-primary w-full"
        type="submit"
        variant="outline"
        disabled
      >
        <GitLabIcon />
        GitLab
      </Button>
    </div>
  );
});
