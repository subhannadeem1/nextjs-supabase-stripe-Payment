import "server-only";
import { cache } from "react";

import { dbConnect } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import type { SettingsDTO } from "@/lib/types";
import { Settings } from "@/models/Settings";

export const getSettings = cache(async (): Promise<SettingsDTO> => {
  await dbConnect();
  const doc = await Settings.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" } },
    { upsert: true, returnDocument: "after", lean: true },
  );
  return serialize<SettingsDTO>(doc);
});
