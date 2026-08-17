import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { Film, LayoutDashboard, LogOut, Sparkles } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#f7f4ef]" />;
  }

  if (!user) {
    return (
      <main className="auth-shell min-h-screen px-6 py-10">
        <section className="auth-card mx-auto flex w-full max-w-lg flex-col items-center text-center">
          <div className="brand-mark mb-8"><Film className="h-5 w-5" /></div>
          <p className="eyebrow">A private viewing archive</p>
          <h1 className="font-display mt-4 text-5xl leading-none text-[#1e2a28] sm:text-6xl">Your cinema,<br />kept close.</h1>
          <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#66716c]">Sign in to open the personal watchlist that belongs only to you.</p>
          <Button onClick={() => startLogin()} className="mt-9 h-12 rounded-full bg-[#1e2a28] px-7 text-sm font-semibold text-[#f8f4ed] hover:bg-[#31413d]">
            Continue with Manus
          </Button>
          <p className="mt-7 text-xs tracking-wide text-[#94a099]">PRIVATE BY DESIGN</p>
        </section>
      </main>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <aside className="hidden min-h-screen border-r border-[#dfe2d9] bg-[#edf0e9] lg:block">
        <Sidebar className="border-r-0 bg-transparent">
          <SidebarHeader className="p-7 pb-6">
            <div className="flex items-center gap-3">
              <div className="brand-mark"><Film className="h-4 w-4" /></div>
              <div>
                <p className="font-display text-[24px] leading-none text-[#1e2a28]">Entertain_Mate</p>
                <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[#849089]">PERSONAL WATCHLIST</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive className="h-11 rounded-xl bg-[#dce4d9] text-[#1e2a28] hover:bg-[#dce4d9]">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-medium">Collection</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="mx-3 mt-8 rounded-2xl border border-[#d6ddd3] bg-[#f5f7f2] p-4">
              <Sparkles className="h-4 w-4 text-[#a66d37]" />
              <p className="mt-3 text-xs font-semibold text-[#35423e]">A small ritual</p>
              <p className="mt-1 text-xs leading-5 text-[#77827d]">Keep the next story worth watching within reach.</p>
            </div>
          </SidebarContent>
          <SidebarFooter className="p-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#e2e8df] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9c6a3b]">
                  <Avatar className="h-8 w-8 border border-[#d0d8ce]">
                    <AvatarFallback className="bg-[#dce4d9] text-xs font-bold text-[#42524c]">{user.name?.charAt(0).toUpperCase() || "M"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#35423e]">{user.name || "My watchlist"}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#7c8882]">Private collection</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
      </aside>
      <SidebarInset className="min-w-0 bg-[#f7f4ef]">
        <header className="flex h-[73px] items-center justify-between border-b border-[#e4e1db] bg-[#f7f4ef]/90 px-5 backdrop-blur md:px-8 lg:hidden">
          <div className="flex items-center gap-3"><div className="brand-mark"><Film className="h-4 w-4" /></div><span className="font-display text-xl text-[#1e2a28]">Entertain_Mate</span></div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-[#5f6a64]">Sign out</Button>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
