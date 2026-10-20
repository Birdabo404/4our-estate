# Original brief (verbatim)

Every agent working on this repo reads this file as the source of truth. Later additions from the operator are appended at the bottom under "Operator additions".

---

You are a world-class fullstack engineer and product designer who has shipped luxury real estate and high-end consumer experiences (level of Sotheby's International Realty, Compass, and the best boutique agency sites). You refuse generic AI aesthetics.

Project: Build a complete, working fullstack real estate platform called 4OUR Estate in this empty repository.

Base reference (inspiration only — do not copy the UI 1:1 search for more inspiration and motivation on the internet. ): https://github.com/AHMAD-JX/Hozn-RealEstate-Fullstack
Your own repo: https://github.com/Birdabo404/4our-estate.git

Core goal: Create a polished, production-feeling real estate platform that makes users say "wow" the first time they see it. It must satisfy the ITE 18 midterm requirements (frontend + backend tracks) while looking and feeling like a premium product, not a student project or template.

STRICT DESIGN DIRECTION (non-negotiable)
- Invoke and follow the high-end-visual-design skill (soft, calm, polished, generous whitespace, soft contrast, spring-based motion).
- Also use any animation and interface skills you have available whenever they improve the result.
- Aesthetic: Editorial luxury real estate. Photography-first. Quiet confidence. Think Sotheby's restraint mixed with modern PropTech polish.
- Forbidden: Inter as default font, purple/blue gradients, generic rounded cards, cookie-cutter hero sections, stock "AI slop" layouts, overcrowded dashboards, cheap shadows, or anything that looks like a typical template.
- Typography: Distinctive pairing (elegant serif for headings + refined geometric or humanist sans for body). Clear hierarchy. Excellent spacing and type scale.
- Color: Restrained, sophisticated palette. Photography and negative space do the heavy lifting. One refined accent at most.
- Motion: Subtle, spring-based, purposeful (Framer Motion). No bouncy gimmicks. Micro-interactions that feel expensive.
- Layout: Generous whitespace, editorial grids, split panels on listing details, cinematic treatment of images, sticky but quiet navigation.
- Every screen must feel intentional. Desktop and mobile are both treated as first-class experiences.

TECHNICAL STACK (make it work)
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion
- Backend / Data: Supabase (Auth + Postgres + Storage + Row Level Security). This replaces custom Express for speed and reliability.
- State: Appropriate client state where needed (or server-first where possible)
- Forms: Strong validation + clear error handling on at least one main form
- Responsive + basic accessibility (semantic HTML, labels, contrast, keyboard nav)
- Roles: Guest, Buyer, Agent, Admin (enforced via Supabase Auth + RLS)

REQUIRED FEATURES FOR MIDTERM
Frontend (working):
- Complete main screens: Home, Listings (search + filters), Property Detail, Auth (login/signup), Role-based dashboards
- Reusable components + clear routing
- State management used in at least one core feature
- Responsive on desktop + mobile
- At least one form with validation and error handling
- Data displayed from Supabase (listings)

Backend design (document in code/comments or a clean README section):
- Clear roles and permissions
- Authentication strategy (Supabase Auth / JWT)
- Database schema (Users, Properties, Images, Inquiries/Favorites, etc.)
- API/data access approach + sample request/response patterns
- Security practices (RLS, input validation, protected routes)

EXECUTION PLAN — SPAWN SPECIALIZED AGENTS
1. Design System Agent: Define the full design system (colors, typography, spacing, motion principles, component language). Output a DESIGN.md and implement the foundation (layout, nav, typography, buttons, cards).
2. Frontend Agent: Build all main screens and components using the design system. Make listings and property detail pages exceptional. Implement routing, responsive behavior, and state.
3. Backend / Auth Agent: Set up Supabase schema, RLS policies for roles, Auth flows, Storage for images, and connect the frontend. Seed realistic sample data.
4. Polish Agent: Review every screen. Improve motion, spacing, empty states, loading states, error states, and micro-interactions. Fix any generic moments. Ensure it feels premium on both desktop and mobile.

QUALITY BAR
- It must look expensive and considered, not generated.
- Users should be able to browse properties, sign up, and see role-appropriate interfaces.
- Code should be clean, modular, and TypeScript-strict where practical.
- After the first working version, do a dedicated polish pass focusing purely on visual and interaction quality.
- Document key decisions briefly in the README (design philosophy, roles, tech choices) so it supports the academic documentation.

Start by setting up the project structure, installing dependencies, and invoking the high-end-visual-design skill. Then spawn the agents and build. Prioritize a beautiful, working core over incomplete features.

When you finish a major section, briefly explain the design decisions and what you will improve next.

use Philippine data if possible and we have other clean UI/UX skills to help. just invoke them if needed.

---

## Operator additions

- "go insane": raise the ambition on visual and motion quality.
- Add **GSAP** and **Anime.js** alongside Framer Motion. Use the installed GSAP skills.
