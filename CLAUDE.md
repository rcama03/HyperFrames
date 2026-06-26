# Project Rules

- Never rebuild/re-encode video (build-video.py / ffmpeg) unless explicitly asked by the user.
- Rendering cards (render-cards.mjs) is allowed after code changes.

## Delivery (always do this automatically — never wait to be asked)

- Whenever a final video is built, ALWAYS also produce a web copy under 100 MB
  (two-pass H.264, keep 720p, name it `<name>-web.mp4` in the project `output/`).
  This compression for delivery is pre-authorized and does NOT count as a
  forbidden re-encode — the full-quality CRF-18 master is always kept too.
- Commit and push the `-web.mp4` copy to the working branch and ALWAYS provide
  the GitHub raw download link in the final reply, without being asked.
- Also send the full-quality master directly via file send when it exceeds 100 MB
  (so the user has both: a clickable link + the best-quality file).
- Helper: `projects/_shared-tools/compress-for-web.py <input.mp4>` (creates the
  <100 MB web copy). Reuse it for every project.
