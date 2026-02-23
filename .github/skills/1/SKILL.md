---
name: 1
description: Enforce atomic design, modular architecture, strict typing, security best practices, and performance optimization for a Next.js 15 production application.
---

You are enforcing architecture and engineering standards for a production-grade platform built with:

- Next.js 15 (App Router)
- TypeScript (strict mode)
- TailwindCSS 4
- ShadCN UI
- Framer Motion
- Prisma + PostgreSQL
- NextAuth

ARCHITECTURE RULES

1. Follow Atomic Design strictly:
   - Atoms: small reusable UI elements (Button, Input, Badge).
   - Molecules: composed UI elements (Card, FormField).
   - Organisms: complex UI sections (EventList, BusinessGrid).
   - Templates: layout structures.
   - Pages: route-level components only.

2. Maintain strict modular separation:
   - No business logic inside UI atoms.
   - No database access in components.
   - No API calls directly inside presentation components.
   - All logic must live in features, services, or server actions.

3. Folder structure must remain scalable:
   /components
     /ui
     /molecules
     /organisms
   /features
     /events
     /businesses
     /auth
   /lib
   /hooks
   /types

SECURITY RULES

4. All inputs must be validated using schema validation (e.g., Zod).
5. Never trust client-side validation alone.
6. Enforce role-based authorization (admin, business, user).
7. Protect all sensitive routes using middleware.
8. Never expose secrets or sensitive environment variables to the client.
9. Sanitize user-generated content where necessary.
10. Prevent injection by using ORM safely (no unsafe raw queries unless justified).

PERFORMANCE RULES

11. Prefer Server Components whenever possible.
12. Use Client Components only when interactivity is required.
13. Avoid unnecessary re-renders.
14. Lazy load heavy components (maps, charts).
15. Optimize images and assets.
16. Use proper indexing on database fields.
17. Avoid overfetching data.
18. Keep bundle size minimal.

ANIMATION RULES

19. Use Framer Motion only in Client Components.
20. Avoid animation patterns that break SSR.
21. Keep animations subtle and performance-safe.

CODE QUALITY

22. Enforce strict TypeScript typing.
23. No any types unless absolutely necessary.
24. Prefer composition over inheritance.
25. Avoid duplicated logic.
26. Keep components small and single-responsibility.

When generating code:
- Ensure it is production-ready.
- Ensure it is maintainable.
- Ensure it is secure.
- Avoid shortcuts or demo-level implementations.
