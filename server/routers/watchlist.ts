import { z } from "zod";
import {
  createWatchlistEntry,
  deleteWatchlistEntry,
  listWatchlistEntries,
  MEDIA_TYPES,
  updateWatchlistEntry,
  WATCH_STATUSES,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const monthYear = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month and year");
const title = z.string().trim().min(1, "A title is required").max(255);
const mediaType = z.enum(MEDIA_TYPES);
const watchStatus = z.enum(WATCH_STATUSES);
const notes = z.string().trim().max(4000).nullable().optional();

const createInput = z.object({
  title,
  mediaType,
  watchStatus,
  monthYear,
  notes,
});

const updateInput = z
  .object({
    id: z.number().int().positive(),
    title: title.optional(),
    mediaType: mediaType.optional(),
    watchStatus: watchStatus.optional(),
    monthYear: monthYear.optional(),
    notes,
  })
  .refine(
    value =>
      value.title !== undefined ||
      value.mediaType !== undefined ||
      value.watchStatus !== undefined ||
      value.monthYear !== undefined ||
      value.notes !== undefined,
    "Provide at least one field to update"
  );

export const watchlistRouter = router({
  list: protectedProcedure.query(({ ctx }) => listWatchlistEntries(ctx.user.id)),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    createWatchlistEntry(ctx.user.id, input)
  ),

  update: protectedProcedure.input(updateInput).mutation(({ ctx, input }) => {
    const { id, ...changes } = input;
    return updateWatchlistEntry(ctx.user.id, id, changes);
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => deleteWatchlistEntry(ctx.user.id, input.id)),
});

export const watchlistValidation = { createInput, updateInput };
