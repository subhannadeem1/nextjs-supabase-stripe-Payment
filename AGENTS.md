<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Business OS — project notes

- Product scope and roadmap: `docs/SCOPE.md`. Setup and deploy: `README.md`.
- Mutations are server actions in `src/actions/*`, always wrapped in `mutate()` /
  `query()` from `src/lib/action.ts` (auth check, DB connect, revalidate, friendly
  errors). Reads for pages live in `src/data/*`.
- Pass only plain data to client components (`serialize()` from `src/lib/serialize.ts`);
  never pass functions from server pages to client components.
- Option lists, labels and colours: `src/lib/constants.ts`. Money is kept per
  currency (`MoneyMap`), never converted.
- UI primitives in `src/components/ui` follow shadcn (new-york) conventions.
- Checks before committing: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
