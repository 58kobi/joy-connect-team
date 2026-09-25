# Staff availability in live chat

## Build
- Record a short-lived online heartbeat while an authorized administrator has the Live Chats page open.
- Show customers a green “Staff online” indicator only while that heartbeat is current; otherwise show the existing waiting state.
- Keep the administrator reply area as a standard multiline text box: Enter creates a new line, and the send button or Ctrl/Cmd+Enter sends.
- Leave claims, customer details, internal notes, handover, and all other staff tools unchanged.

## Technical details
- Add a protected presence table with administrator-only access and explicit grants.
- Update presence through an authenticated, server-authorized function and expose only a boolean availability result to customer chats.
- Verify the current preview, customer indicator, reply typing behavior, and build status.
