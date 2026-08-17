import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CalendarDays, Check, ChevronRight, CircleDot, Clapperboard, Copy, Edit3, ExternalLink, Film, FilterX, ImagePlus, Loader2, Plus, Search, ShieldCheck, Star, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const mediaTypes = ["Movie", "Web Series", "Short Film"] as const;
const watchStatuses = ["Want to Watch", "Watching", "Watched"] as const;
type MediaType = (typeof mediaTypes)[number];
type WatchStatus = (typeof watchStatuses)[number];
type WatchlistEntry = {
  id: number;
  title: string;
  mediaType: MediaType;
  watchStatus: WatchStatus;
  monthYear: string | null;
  notes: string | null;
  posterUrl: string | null;
  imdbRating: string | null;
  releaseYear: string | null;
  sourceKind: string | null;
  moctaleUrl: string | null;
};

const statusStyles: Record<WatchStatus, string> = {
  "Want to Watch": "border-[#e4cda9] bg-[#fbf3e6] text-[#9b6230]",
  Watching: "border-[#bcd7cf] bg-[#eaf5f0] text-[#2f7667]",
  Watched: "border-[#cbdcc3] bg-[#edf4e9] text-[#57784c]",
};

function labelForMonth(monthYear: string | null) {
  if (!monthYear) return "Archive";
  const [year, month] = monthYear.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function sortGroups([a]: [string, WatchlistEntry[]], [b]: [string, WatchlistEntry[]]) {
  if (a === "archive") return 1;
  if (b === "archive") return -1;
  return b.localeCompare(a);
}

type WatchlistFormInput = Pick<WatchlistEntry, "title" | "mediaType" | "watchStatus" | "notes"> & { monthYear: string };

function EntryForm({ initial, onSubmit, isSaving }: { initial?: WatchlistEntry; onSubmit: (entry: WatchlistFormInput) => void; isSaving: boolean }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [mediaType, setMediaType] = useState<MediaType>(initial?.mediaType ?? "Movie");
  const [watchStatus, setWatchStatus] = useState<WatchStatus>(initial?.watchStatus ?? "Want to Watch");
  const [monthYear, setMonthYear] = useState(initial?.monthYear ?? new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ title: title.trim(), mediaType, watchStatus, monthYear, notes: notes.trim() || null });
  };

  return (
    <form onSubmit={submit} className="mt-2 space-y-5">
      <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" autoFocus required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. In the Mood for Love" className="h-11 rounded-xl border-[#dfe1d8] bg-[#faf9f6]" /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Type</Label><Select value={mediaType} onValueChange={value => setMediaType(value as MediaType)}><SelectTrigger className="h-11 rounded-xl border-[#dfe1d8] bg-[#faf9f6]"><SelectValue /></SelectTrigger><SelectContent>{mediaTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Watch status</Label><Select value={watchStatus} onValueChange={value => setWatchStatus(value as WatchStatus)}><SelectTrigger className="h-11 rounded-xl border-[#dfe1d8] bg-[#faf9f6]"><SelectValue /></SelectTrigger><SelectContent>{watchStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="monthYear">Month added</Label><Input id="monthYear" type="month" required value={monthYear} onChange={e => setMonthYear(e.target.value)} className="h-11 rounded-xl border-[#dfe1d8] bg-[#faf9f6]" /></div>
      <div className="space-y-2"><Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={4000} placeholder="A small note for your future self…" className="min-h-24 resize-none rounded-xl border-[#dfe1d8] bg-[#faf9f6]" /></div>
      <Button type="submit" disabled={isSaving || !title.trim()} className="h-11 w-full rounded-full bg-[#1e2a28] text-[#f9f6f0] hover:bg-[#34443f]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Save changes" : "Add to watchlist"}</Button>
    </form>
  );
}

function CollectionDashboard() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.watchlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const entries = (data ?? []) as WatchlistEntry[];
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<WatchStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [extensionToken, setExtensionToken] = useState<{ token: string; tokenHint: string } | null>(null);
  const [editing, setEditing] = useState<WatchlistEntry | null>(null);
  const [deleting, setDeleting] = useState<WatchlistEntry | null>(null);

  const createEntry = trpc.watchlist.create.useMutation({ onSuccess: async () => { await utils.watchlist.list.invalidate(); setShowAdd(false); toast.success("Title added to your collection"); }, onError: error => toast.error(error.message) });
  const updateEntry = trpc.watchlist.update.useMutation({ onSuccess: async () => { await utils.watchlist.list.invalidate(); setEditing(null); toast.success("Collection updated"); }, onError: error => toast.error(error.message) });
  const deleteEntry = trpc.watchlist.delete.useMutation({ onSuccess: async () => { await utils.watchlist.list.invalidate(); setDeleting(null); toast.success("Title removed from your collection"); }, onError: error => toast.error(error.message) });
  const createExtensionToken = trpc.watchlist.createExtensionToken.useMutation({ onSuccess: data => { setExtensionToken(data); toast.success("Private Brave token generated"); }, onError: error => toast.error(error.message) });
  const enrichEntries = trpc.watchlist.enrich.useMutation({ onSuccess: async result => { await utils.watchlist.list.invalidate(); toast.success(`${result.enriched} titles enriched with artwork`); }, onError: error => toast.error(error.message) });

  const filteredEntries = useMemo(() => entries.filter(entry => {
    const query = searchQuery.trim().toLowerCase();
    return (!query || entry.title.toLowerCase().includes(query) || (entry.notes ?? "").toLowerCase().includes(query)) &&
      (typeFilter === "all" || entry.mediaType === typeFilter) &&
      (statusFilter === "all" || entry.watchStatus === statusFilter);
  }), [entries, searchQuery, typeFilter, statusFilter]);

  const groups = useMemo(() => Object.entries(filteredEntries.reduce<Record<string, WatchlistEntry[]>>((all, entry) => {
    const key = entry.monthYear ?? "archive";
    (all[key] ??= []).push(entry);
    return all;
  }, {})).sort(sortGroups), [filteredEntries]);

  const allGroups = useMemo(() => Object.entries(entries.reduce<Record<string, WatchlistEntry[]>>((all, entry) => {
    const key = entry.monthYear ?? "archive";
    (all[key] ??= []).push(entry);
    return all;
  }, {})).sort(sortGroups), [entries]);

  const watchedCount = entries.filter(entry => entry.watchStatus === "Watched").length;
  const watchingCount = entries.filter(entry => entry.watchStatus === "Watching").length;
  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setStatusFilter("all"); };

  const inlineUpdate = (entry: WatchlistEntry, changes: Partial<Pick<WatchlistEntry, "mediaType" | "watchStatus">>) => {
    updateEntry.mutate({ id: entry.id, ...changes });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#9c6a3b]" /></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-[#7e4438]">Your collection could not be opened. Please refresh and try again.</div>;

  return (
    <main className="app-shell min-h-screen px-5 pb-12 pt-8 md:px-9 md:pt-12 xl:px-14">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col justify-between gap-8 border-b border-[#e3e0d9] pb-9 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Your private library</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] tracking-[-0.04em] text-[#1d2927] md:text-6xl">The watchlist.</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#68736e]">A quiet place for every film, series, and short that has stayed on your mind.</p>
          </div>
          <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setShowExtension(true)} className="h-12 rounded-full border-[#cfd8ce] bg-[#fbfaf7] px-5 text-sm font-semibold text-[#41534b] hover:bg-[#edf2ea]"><ShieldCheck className="mr-1.5 h-4 w-4" /> Connect Brave</Button><Button variant="outline" onClick={() => enrichEntries.mutate()} disabled={enrichEntries.isPending} className="h-12 rounded-full border-[#cfd8ce] bg-[#fbfaf7] px-5 text-sm font-semibold text-[#41534b] hover:bg-[#edf2ea]">{enrichEntries.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1.5 h-4 w-4" />} Add posters</Button><Button onClick={() => setShowAdd(true)} className="h-12 shrink-0 rounded-full bg-[#1d2927] px-5 text-sm font-semibold text-[#fbf7ee] shadow-[0_10px_24px_rgba(31,42,39,0.15)] hover:bg-[#34443f]"><Plus className="mr-1.5 h-4 w-4" /> Add a title</Button></div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="stat-card"><p>In the collection</p><strong>{entries.length}</strong><span><Clapperboard className="h-3.5 w-3.5" /> titles</span></div>
          <div className="stat-card"><p>Currently watching</p><strong>{watchingCount}</strong><span><CircleDot className="h-3.5 w-3.5" /> in progress</span></div>
          <div className="stat-card"><p>Stories completed</p><strong>{watchedCount}</strong><span><Check className="h-3.5 w-3.5" /> watched</span></div>
        </section>

        <section className="timeline-card mt-8 overflow-hidden rounded-3xl border border-[#e1e1d8] bg-[#fbfaf7] p-5 md:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Collection timeline</p><h2 className="font-display mt-2 text-2xl text-[#25322f]">Where your list began</h2></div><CalendarDays className="h-5 w-5 text-[#a66d37]" /></div>
          <div className="mt-7 flex min-w-max items-start gap-0 overflow-x-auto pb-2">
            {allGroups.map(([group, groupEntries], index) => <div key={group} className="timeline-node relative flex min-w-[178px] flex-1 flex-col last:min-w-[150px]"><div className="flex items-center"><span className="h-3 w-3 rounded-full border-[3px] border-[#fbfaf7] bg-[#a66d37] shadow-[0_0_0_1px_#d0b48e]" />{index < allGroups.length - 1 && <span className="h-px flex-1 bg-[#d8d9d1]" />}</div><p className="mt-4 text-xs font-semibold text-[#40514b]">{group === "archive" ? "Archive" : labelForMonth(group)}</p><p className="mt-1 text-xs text-[#8a948d]">{groupEntries.length} {groupEntries.length === 1 ? "title" : "titles"}</p></div>)}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Explore your list</p><h2 className="font-display mt-2 text-3xl text-[#25322f]">The collection</h2></div><p className="text-sm text-[#7d8881]">{filteredEntries.length} of {entries.length} titles</p></div>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e3e1da] bg-[#fbfaf7] p-3 lg:flex-row lg:items-center">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e9790]" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search titles or notes…" className="h-11 border-0 bg-[#f4f3ef] pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-[#b4c3b7]" /></div>
            <div className="grid grid-cols-2 gap-3 lg:w-[330px]"><Select value={typeFilter} onValueChange={value => setTypeFilter(value as MediaType | "all")}><SelectTrigger className="h-11 border-[#e4e2db] bg-white text-xs"><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{mediaTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={value => setStatusFilter(value as WatchStatus | "all")}><SelectTrigger className="h-11 border-[#e4e2db] bg-white text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{watchStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
            {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && <Button variant="ghost" onClick={clearFilters} className="h-10 shrink-0 text-xs text-[#69756e] hover:bg-[#eef1eb]"><FilterX className="mr-1.5 h-3.5 w-3.5" /> Clear</Button>}
          </div>
        </section>

        <section className="mt-7 space-y-9">
          {groups.map(([group, groupEntries]) => <div key={group}>
            <div className="mb-4 flex items-center gap-3"><h3 className="font-display text-3xl text-[#273530]">{group === "archive" ? "Archive" : labelForMonth(group)}</h3><span className="rounded-full bg-[#e8eee5] px-2.5 py-1 text-[11px] font-bold text-[#66776e]">{groupEntries.length}</span><span className="h-px flex-1 bg-[#e3e0d9]" /></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{groupEntries.map(entry => <article key={entry.id} className="entry-card group relative rounded-2xl border border-[#e0e1d9] bg-[#fbfaf7] p-5 transition-all hover:-translate-y-0.5 hover:border-[#ced7cd] hover:shadow-[0_10px_24px_rgba(49,67,60,0.07)]">
              <div className="flex items-start justify-between gap-3"><Badge variant="outline" className="rounded-full border-[#d9dfd6] bg-[#f6f7f3] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#69766f]">{entry.mediaType}</Badge><div className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><Button variant="ghost" size="icon" onClick={() => setEditing(entry)} className="h-8 w-8 text-[#5e6b64] hover:bg-[#edf0e9]"><Edit3 className="h-3.5 w-3.5" /><span className="sr-only">Edit {entry.title}</span></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(entry)} className="h-8 w-8 text-[#9a6355] hover:bg-[#f7eae5]"><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {entry.title}</span></Button></div></div>
              <div className="mt-5 flex gap-3"><div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#e8ebe5]">{entry.posterUrl ? <img src={entry.posterUrl} alt={`Poster for ${entry.title}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Film className="h-4 w-4 text-[#9ba69e]" /></div>}</div><div className="min-w-0"><h4 className="font-display text-[26px] leading-[1.05] text-[#25322f]">{entry.title}</h4>{(entry.releaseYear || entry.imdbRating) && <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#718078]">{entry.releaseYear && <span>{entry.releaseYear}</span>}{entry.imdbRating && <span className="flex items-center gap-1 text-[#9b6739]"><Star className="h-3 w-3 fill-current" /> IMDb {entry.imdbRating}</span>}</p>}{entry.sourceKind && <span className="mt-2 inline-flex rounded-full bg-[#edf1ea] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#66776e]">Imported privately</span>}</div></div>
              <Textarea key={`${entry.id}-${entry.notes ?? ""}`} defaultValue={entry.notes ?? ""} onBlur={event => { const notes = event.currentTarget.value.trim() || null; if (notes !== entry.notes) updateEntry.mutate({ id: entry.id, notes }); }} placeholder="Add a note…" className="mt-3 h-10 min-h-10 resize-none border-0 bg-transparent p-0 text-xs leading-5 text-[#77827d] placeholder:text-[#a0a8a1] focus-visible:ring-0" />
              {entry.moctaleUrl && <a href={entry.moctaleUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#84633d] hover:text-[#5e4427]">Explore on Moctale <ExternalLink className="h-3 w-3" /></a>}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eceae5] pt-4"><Select value={entry.watchStatus} onValueChange={value => inlineUpdate(entry, { watchStatus: value as WatchStatus })}><SelectTrigger className={cn("h-8 w-auto gap-1.5 rounded-full border px-2.5 text-[10px] font-bold shadow-none", statusStyles[entry.watchStatus])}><SelectValue /></SelectTrigger><SelectContent>{watchStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><Select value={entry.mediaType} onValueChange={value => inlineUpdate(entry, { mediaType: value as MediaType })}><SelectTrigger className="h-8 w-8 border-0 p-0 text-[#a0a8a1] shadow-none focus:ring-0"><ChevronRight className="h-4 w-4" /><span className="sr-only">Change type</span></SelectTrigger><SelectContent>{mediaTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            </article>)}</div>
          </div>)}
          {groups.length === 0 && <div className="rounded-3xl border border-dashed border-[#d3d9d1] bg-[#fbfaf7] px-6 py-16 text-center"><Film className="mx-auto h-6 w-6 text-[#a66d37]" /><h3 className="font-display mt-4 text-2xl text-[#2d3c37]">Nothing found here</h3><p className="mt-2 text-sm text-[#7c8780]">Try a different search or clear the current filters.</p><Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full border-[#d2d9d0]">Reset filters</Button></div>}
        </section>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-[#e2e2dc] bg-[#fcfbf8] p-6 sm:max-w-lg sm:p-8"><DialogHeader><p className="eyebrow">A new discovery</p><DialogTitle className="font-display mt-1 text-3xl text-[#26342f]">Add to your list</DialogTitle><DialogDescription>Save the next story you want to make time for.</DialogDescription></DialogHeader><EntryForm isSaving={createEntry.isPending} onSubmit={entry => createEntry.mutate(entry)} /></DialogContent></Dialog>
      <Dialog open={showExtension} onOpenChange={setShowExtension}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-[#e2e2dc] bg-[#fcfbf8] p-6 sm:max-w-lg sm:p-8"><DialogHeader><p className="eyebrow">Private Brave companion</p><DialogTitle className="font-display mt-1 text-3xl text-[#26342f]">Connect your browser</DialogTitle><DialogDescription>The extension reads local Google-search history only after you approve Brave's history permission. It never accesses Gmail, Drive, cookies, saved passwords, or page content.</DialogDescription></DialogHeader><div className="mt-4 rounded-2xl border border-[#dce4d9] bg-[#f3f7f0] p-4 text-xs leading-5 text-[#5c6d65]"><strong className="block text-[#32433d]">What is shared</strong>Only likely entertainment search terms are sent for title matching. A title is saved only when a movie or television match is found.</div>{extensionToken ? <div className="mt-5 space-y-3"><Label>Dashboard address</Label><code className="block overflow-x-auto rounded-xl bg-[#eceee9] p-3 text-xs text-[#35433e]">{window.location.origin}</code><Label>Private connection token</Label><code className="block break-all rounded-xl bg-[#eceee9] p-3 text-xs text-[#35433e]">{extensionToken.token}</code><Button variant="outline" onClick={() => { navigator.clipboard.writeText(extensionToken.token); toast.success("Token copied"); }} className="w-full rounded-full border-[#cfd8ce]"><Copy className="mr-1.5 h-4 w-4" /> Copy token</Button><p className="text-xs leading-5 text-[#819088]">Paste both values into the private Brave extension popup. Keep the token private; you can revoke it by generating a replacement in a later update.</p></div> : <Button onClick={() => createExtensionToken.mutate()} disabled={createExtensionToken.isPending} className="mt-5 h-11 w-full rounded-full bg-[#1e2a28] text-[#fffaf2]">{createExtensionToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate private Brave token"}</Button>}</DialogContent></Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={open => !open && setEditing(null)}>{editing && <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-[#e2e2dc] bg-[#fcfbf8] p-6 sm:max-w-lg sm:p-8"><DialogHeader><p className="eyebrow">Refine your entry</p><DialogTitle className="font-display mt-1 text-3xl text-[#26342f]">Edit title</DialogTitle><DialogDescription>Keep the details meaningful and current.</DialogDescription></DialogHeader><EntryForm initial={editing} isSaving={updateEntry.isPending} onSubmit={entry => updateEntry.mutate({ id: editing.id, ...entry })} /></DialogContent>}</Dialog>
      <AlertDialog open={Boolean(deleting)} onOpenChange={open => !open && setDeleting(null)}><AlertDialogContent className="rounded-3xl border-[#e2e2dc] bg-[#fcfbf8]"><AlertDialogHeader><AlertDialogTitle className="font-display text-3xl text-[#26342f]">Remove this title?</AlertDialogTitle><AlertDialogDescription>{deleting ? `“${deleting.title}” will be removed from your private collection. This cannot be undone.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-full border-[#d8ddd5]">Keep it</AlertDialogCancel><AlertDialogAction onClick={() => deleting && deleteEntry.mutate({ id: deleting.id })} className="rounded-full bg-[#8b4f42] text-white hover:bg-[#754135]">Remove title</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </main>
  );
}

export default function Home() {
  return <DashboardLayout><CollectionDashboard /></DashboardLayout>;
}
