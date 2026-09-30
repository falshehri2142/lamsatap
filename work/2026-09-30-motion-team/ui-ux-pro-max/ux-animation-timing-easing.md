## UI Pro Max Search Results
**Domain:** ux | **Query:** animation timing easing
**Source:** ux-guidelines.csv | **Found:** 4 results

### Result 1
- **Category:** Animation
- **Issue:** Easing Functions
- **Platform:** All
- **Description:** Easing should match how an element changes speed and purpose
- **Do:** Use deceleration when arriving acceleration when leaving and linear for constant-rate progress
- **Don't:** Reject linear easing even for steady rotation or progress
- **Code Example Good:** ease-out for entry; linear for spinner
- **Code Example Bad:** ease-in-out for every motion
- **Severity:** Low

### Result 2
- **Category:** Animation
- **Issue:** Duration Timing
- **Platform:** All
- **Description:** Motion duration depends on distance complexity platform and user context
- **Do:** Use shared motion tokens and test that feedback stays responsive
- **Don't:** Present 150-300ms or any cutoff as a universal requirement
- **Code Example Good:** transition-colors duration-200
- **Code Example Bad:** One duration copied to every transition
- **Severity:** Medium

### Result 3
- **Category:** Animation
- **Issue:** Continuous Animation
- **Platform:** All
- **Description:** Infinite animations are distracting
- **Do:** Use for loading indicators only
- **Don't:** Use for decorative elements
- **Code Example Good:** animate-spin on loader
- **Code Example Bad:** animate-bounce on icons
- **Severity:** Medium

### Result 4
- **Category:** Animation
- **Issue:** Reduced Motion
- **Platform:** All
- **Description:** Respect user's motion preferences
- **Do:** Check prefers-reduced-motion media query
- **Don't:** Ignore accessibility motion settings
- **Code Example Good:** @media (prefers-reduced-motion: reduce)
- **Code Example Bad:** No motion query check
- **Severity:** High

