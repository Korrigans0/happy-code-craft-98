# Agents
- Glyphes portraits use character.avatar_url and the existing character-avatars storage/cropper; share PDF-space portrait coordinates between preview and export to keep placement consistent.
- Resolve direct token-sheet navigation in the pure tokenSheetTarget helper and reuse the existing full-sheet dialog; this keeps system routing testable without duplicating permissions, saving or realtime logic.
- Use the canvas native double-click event for token-sheet opening independently of movement locks; selection permissions still apply, so locking movement cannot disable authorized sheet access.
- The immersive adventure scene is the default « Tout pour vos aventures » section, lazy-loaded with the classic card grid kept reachable through the « Version classique » button or ?experience=classique; this keeps the new presentation reversible without adding routes.
- Render adventure energy in an isolated SVG overlay measured from artifact positions; restart interrupted transfers from their current head to keep rapid direction changes continuous without dependencies.
- Plan effectif = public.effective_tier(user) (clé partenaire active → premium_mixed, sinon profiles.tier issu de Paddle) ; quotas l'utilisent, le webhook ne touche que profiles.tier — pour ne jamais écraser l'un par l'autre.
