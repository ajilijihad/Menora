import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { EnvConfigError } from "@/lib/env/error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getAuthenticatedUser = cache(async function getAuthenticatedUser() {
  try {
    await connection();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }

    throw error;
  }
});

export const getOwnProfile = cache(async function getOwnProfile() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_platform_admin, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
});
