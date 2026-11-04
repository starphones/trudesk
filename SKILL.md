---
name: trudesk-project
description: Maintain the Trudesk application in this repository, including its React ticket screens and Express backend.
---

# Trudesk project

- The `/tickets` table is rendered by `src/client/containers/Tickets/TicketsContainer.jsx`; `src/views/tickets.hbs` only supplies its mount point.
- Ticket data in React uses Immutable records. The creation timestamp is `ticket.get('date')`; `updated` tracks later changes.
- Use the timezone from `helpers.getTimezone()` when comparing calendar dates, matching the existing Created display. Reuse the bundled Moment timezone support.
- Keep table headers, row cells, loading placeholders, and empty-state column spans aligned when changing columns.
- Frontend source is bundled using Webpack (`yarn webpackdev`); `yarn build` also regenerates vendor and CSS assets. Avoid hand-editing generated bundles.
- Existing controller tests expect a running application on port 3111. Choose checks that can actually run with available dependencies and services, and report validation limits.
