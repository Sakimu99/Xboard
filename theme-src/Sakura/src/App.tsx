import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { ForgetPage } from '@/pages/auth/forget'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { CheckoutPage } from '@/pages/checkout'
import { InvitePage } from '@/pages/invite'
import { KnowledgePage } from '@/pages/knowledge'
import { NodesPage } from '@/pages/nodes'
import { TicketDetailPage, TicketsPage } from '@/pages/tickets'
import { TrafficPage } from '@/pages/traffic'
import { DashboardPage } from '@/pages/dashboard'
import { OrderDetailPage } from '@/pages/order-detail'
import { OrdersPage } from '@/pages/orders'
import { PlansPage } from '@/pages/plans'
import { ProfilePage } from '@/pages/profile'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
})

// Xboard 只把 "/" 交給主題，因此使用 Hash 路由（也與郵件登入連結 /#/login 相容）
const router = createHashRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forget', element: <ForgetPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/plans', element: <PlansPage /> },
      { path: '/plans/:id', element: <CheckoutPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/orders/:tradeNo', element: <OrderDetailPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/knowledge', element: <KnowledgePage /> },
      { path: '/nodes', element: <NodesPage /> },
      { path: '/invite', element: <InvitePage /> },
      { path: '/tickets', element: <TicketsPage /> },
      { path: '/tickets/:id', element: <TicketDetailPage /> },
      { path: '/traffic', element: <TrafficPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors theme="light" />
    </QueryClientProvider>
  )
}
