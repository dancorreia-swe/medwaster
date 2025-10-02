import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/wiki/$articleId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/wiki/$articleId/"!</div>
}
