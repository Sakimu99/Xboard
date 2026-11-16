import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  BookOpenIcon,
  ChartColumnIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  ReceiptTextIcon,
  ServerIcon,
  ShoppingBagIcon,
  UserRoundIcon,
} from 'lucide-react'
import { Backdrop } from '@/components/backdrop'
import { Brand } from '@/components/brand'
import { Sticker } from '@/components/sticker'
import { LanguageMenu } from '@/components/layout/preferences'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useUserInfo } from '@/api/queries'
import { useT, type MessageKey } from '@/i18n'
import { auth, useAuthToken } from '@/lib/auth'
import { settings } from '@/lib/settings'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: MessageKey; icon: typeof LayoutDashboardIcon }
const NAV: { title?: MessageKey; items: NavItem[] }[] = [
  {
    items: [
      { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboardIcon },
      { to: '/knowledge', label: 'nav.knowledge', icon: BookOpenIcon },
    ],
  },
  {
    title: 'nav.groupSubscribe',
    items: [
      { to: '/plans', label: 'nav.plans', icon: ShoppingBagIcon },
      { to: '/nodes', label: 'nav.nodes', icon: ServerIcon },
    ],
  },
  {
    title: 'nav.groupFinance',
    items: [
      { to: '/orders', label: 'nav.orders', icon: ReceiptTextIcon },
      { to: '/invite', label: 'nav.invite', icon: GiftIcon },
    ],
  },
  {
    title: 'nav.groupUser',
    items: [
      { to: '/profile', label: 'nav.profile', icon: UserRoundIcon },
      { to: '/tickets', label: 'nav.tickets', icon: LifeBuoyIcon },
      { to: '/traffic', label: 'nav.traffic', icon: ChartColumnIcon },
    ],
  },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  return (
    <nav className="flex flex-col gap-5 px-3">
      {NAV.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.title && <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">{t(group.title)}</p>}
          {group.items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground',
                  isActive && 'bg-gradient-brand text-primary-foreground shadow-[0_6px_18px_-6px_var(--primary)] hover:bg-transparent hover:text-primary-foreground',
                )
              }
            >
              <Icon className="size-4 transition-transform group-hover:scale-110" />
              {t(label)}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center px-6">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <NavList onNavigate={onNavigate} />
      </div>
      <Sticker slot="sidebar" className="mx-auto -mb-2 h-24 w-32 animate-float" />
      <div className="px-6 py-4 text-xs text-muted-foreground">
        {settings.title} {settings.version && `· v${settings.version}`}
      </div>
    </>
  )
}

function UserMenu() {
  const t = useT()
  const { data } = useUserInfo()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const logout = () => {
    auth.set(null)
    qc.clear()
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 rounded-full pr-3 pl-1">
          {data?.avatar_url ? (
            <img src={data.avatar_url} alt="" className="size-7 rounded-full bg-muted ring-2 ring-primary/50" />
          ) : (
            <div className="size-7 rounded-full bg-muted" />
          )}
          <span className="hidden max-w-40 truncate text-sm font-normal md:inline">{data?.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{data?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <UserRoundIcon />
          {t('nav.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOutIcon />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppLayout() {
  const token = useAuthToken()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="relative min-h-svh lg:pl-[17.5rem]">
      <Backdrop />
      <aside className="fixed inset-y-3 left-3 z-20 hidden w-64 flex-col rounded-3xl border bg-sidebar shadow-xl backdrop-blur-2xl lg:flex">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">{settings.title}</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <header className="sticky top-3 z-30 mx-3 mt-3 flex h-14 items-center gap-2 rounded-full border bg-card/70 px-2 shadow-lg backdrop-blur-2xl sm:mx-6 lg:mr-6 lg:ml-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
          <MenuIcon />
        </Button>
        <Brand className="lg:hidden" />
        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          <UserMenu />
        </div>
      </header>
      <main key={location.pathname} className="relative z-10 mx-auto w-full max-w-6xl animate-fade-up px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
