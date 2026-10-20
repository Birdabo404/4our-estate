"use client";

import { useEffect } from "react";

import { saveOwnLicense } from "@/lib/actions/license";
import { PENDING_LICENSE_KEY } from "@/components/auth/pending-license";

export function PendingLicense() {
  useEffect(() => {
    const license = sessionStorage.getItem(PENDING_LICENSE_KEY);
    if (!license) return;
    sessionStorage.removeItem(PENDING_LICENSE_KEY);
    const formData = new FormData();
    formData.set("licenseNo", license);
    void saveOwnLicense(null, formData);
  }, []);

  return null;
}
