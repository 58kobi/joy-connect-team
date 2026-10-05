<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Public marketing pages are prerendered via the `pages` list in vite.config.ts and the router uses `trailingSlash: "preserve"`; why: static HTML for crawlers, and the prerenderer requests slash-suffixed paths that otherwise redirect-loop. Never add staff/auth routes to `pages`.
