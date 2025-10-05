import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/admin/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/admin/settings/"!</div>
}
