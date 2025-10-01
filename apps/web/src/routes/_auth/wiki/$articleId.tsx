import { createFileRoute } from "@tanstack/react-router";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { pt } from "@blocknote/core/locales";

export const Route = createFileRoute("/_auth/wiki/$articleId")({
  component: RouteComponent,
});

function RouteComponent() {
  const editor = useCreateBlockNote({
    dictionary: {
      ...pt,
      placeholders: {
        ...pt.placeholders,
        default: 'Digite um texto ou use "/" para utilizar comandos',
      },
    },
  });

  return <BlockNoteView editor={editor} theme="light" />;
}
