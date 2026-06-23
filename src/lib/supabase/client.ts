"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";

export const supabaseBrowser = () =>
  createBrowserClient(env.supabaseUrl, env.supabaseAnon);
