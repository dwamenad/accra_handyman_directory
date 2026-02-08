"use client";

import { useEffect } from "react";

export function ProfileViewTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, eventType: "PROFILE_VIEW" })
    });
  }, [profileId]);

  return null;
}
