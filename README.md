# event-timeline

Branded public timeline for a sevens tournament. Polls the `sevens_System`
public API and serves an order-of-play page plus a live match timeline.

This is a reusable engine — branding lives entirely in environment variables
(see `fly.toml` / `theme.rs`), not in code. To stand up the next event's site:

1. Copy this folder.
2. Replace `static/img/logo.jpg` with the new event's logo.
3. Edit `fly.toml`: `app` name, `SEVENS_API_URL`, `TOURNAMENT_NAME`,
   `HOST_NAME`, `TOURNAMENT_VENUE`, and the four `THEME_*` colors.
4. `fly launch` / `fly deploy`.

No Rust or HTML/CSS changes needed for a new event.

## Local dev

```
SEVENS_API_URL=https://sevens.mugiendii.com cargo run
```

Then open http://localhost:3000.
# Juja7s_timeline
