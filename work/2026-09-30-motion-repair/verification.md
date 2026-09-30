# Home animation repair

- Restored home square-only flight using the actual QR symbol bounds; card and wordmark stay static.
- Verified desktop start, midpoint, dock, reverse at 1280 x 720; the full card fits after photo-height adjustment.
- Verified mobile midpoint and dock at 390 x 844, with static wordmark and no horizontal overflow. Removed legacy 380px card minimum; actual card height is 231.4px.
- Walkthrough step progress and photo transform change with scrolling.
- Shared photo-scene branch remains active for hosts and restaurants.
- JavaScript syntax, scoped diff checks and home mini-builder pass. Existing production size-budget failure from the previous task is unrelated and remains recorded in the September 29 report.
