# UI_GUARDRAILS.md

## Purpose
This file protects the existing frontend template from unnecessary visual drift during AI-assisted implementation.

The current UI is a contract.
Functionality may evolve.
Visual identity must remain intact.

## Hard rules
- Do not change the color palette.
- Do not change typography choices.
- Do not change global spacing rhythm.
- Do not change border radius conventions.
- Do not replace the layout system.
- Do not introduce a new visual language.
- Do not convert the app into a generic AI SaaS dashboard aesthetic.
- Do not redesign screens unless explicitly instructed by the human.

## Allowed changes
- text and copy
- navigation labels
- page content
- card content
- data binding
- empty states
- loading states
- detail panels
- new module pages that use current patterns
- additional components that visually match the existing system exactly

## Existing UI is the source of truth
Before creating anything new:
1. inspect current layout patterns
2. inspect current cards
3. inspect current form elements
4. inspect current tabs/dialogs/drawers
5. reuse existing patterns first

Do not introduce a new component if an existing pattern can be adapted.

## Rules for external components
External components are allowed only if all of the following are true:
- they solve a real implementation need
- they can be made visually identical to the current system
- they do not force a theme change
- they do not introduce clashing motion, spacing, or typography

If an external component feels imported, do not use it.

## Visual consistency checklist
Any new screen must match:
- existing sidebar/header patterns
- existing card density
- existing text hierarchy
- existing button behavior
- existing hover/focus treatment
- existing dark/light mode behavior
- existing empty/loading/error design style

## Safe implementation approach
- build new pages from existing layout shells
- reuse current cards where possible
- keep global styles untouched unless necessary
- create new variants only when current variants are insufficient
- prefer local composition over global restyling

## Forbidden implementation behavior
- replacing all cards with a new card system
- changing theme config
- changing Tailwind tokens or CSS variables without explicit approval
- importing a flashy dashboard template
- adding bright gradients or new accent colors
- changing icon style across the app
- changing spacing scale

## Review rule
At the end of every phase, review changed files for:
- theme files
- global CSS
- layout wrappers
- shared components

If visual-system files were changed, justify why.
If not necessary, revert them.

## UI acceptance criteria
A phase is not visually accepted unless:
- the app still feels like the original template
- the theme is preserved
- new screens feel native
- no obvious design drift appears

## Priority order
When making implementation decisions, follow this order:
1. preserve existing UI
2. preserve existing component patterns
3. preserve responsive behavior
4. add business logic
5. improve content and product clarity

Never reverse this order.