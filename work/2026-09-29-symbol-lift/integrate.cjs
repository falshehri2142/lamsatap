const fs = require('node:fs');
const root = require('node:path').resolve(__dirname, '../..');
const file = name => require('node:path').join(root, name);
let js = fs.readFileSync(file('website/assets/motion.js'), 'utf8');
const start = js.indexOf('    // Product lift:');
const end = js.indexOf('    // ===== 6)', start);
if (start < 0 || end < 0) throw Error('Expected draft lift block not found');
js = js.slice(0, start) + `    // The square mark leaves the photograph and docks in the header, following
    // opening()'s curved flight. Acrylic and lettering stay in the static plate.
    function symbolFlight(c) {
      var sec = $('[data-symbol-flight]'); if (!sec || !c.tall) return;
      var stage = $('[data-lift-stage]', sec), symbol = $('[data-lift-object]', sec), plate = $('[data-lift-plate]', sec), dest = $('.s-logo-h');
      if (!stage || !symbol || !plate || !dest) return;
      var cancelled = false, assetsReady = false, draw = null, flightMedia = g.matchMedia(), listeners = [];
      function ready(img) {
        function decode() { return img.decode ? img.decode() : Promise.resolve(); }
        if (img.complete) return img.naturalWidth ? decode() : Promise.reject();
        return new Promise(function (resolve, reject) {
          function clean() { img.removeEventListener('load', loaded); img.removeEventListener('error', failed); }
          function loaded() { clean(); decode().then(resolve, reject); }
          function failed() { clean(); reject(); }
          img.addEventListener('load', loaded); img.addEventListener('error', failed); listeners.push(clean);
        });
      }
      offs.push(function () {
        cancelled = true; listeners.forEach(function (clean) { clean(); });
        flightMedia.revert(); sec.classList.remove('is-lift-ready'); dest.classList.remove('is-symbol-away');
        symbol.removeAttribute('style');
      });
      // Create the pin synchronously, before the ordinary initial-hash refresh.
      // Image decoding only switches layers; it never changes document geometry.
      flightMedia.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023.98px)' }, function (ctx) {
        if (cancelled || dead) return;
        var desktop = ctx.conditions.desktop, host = desktop ? sec : stage;
        var layer = mk('div', 'm-fly r-symbol-flight', d.body), fly = symbol.cloneNode(true);
        fly.removeAttribute('data-lift-object'); fly.removeAttribute('style'); fly.className = 'r-symbol-fly'; layer.appendChild(fly);
        var R = {}, fp = { q: 0 }, last = '', ease = g.parseEase('power3.out');
        var setX = g.quickSetter(fly, 'x', 'px'), setY = g.quickSetter(fly, 'y', 'px');
        var setScaleX = g.quickSetter(fly, 'scaleX'), setScaleY = g.quickSetter(fly, 'scaleY');
        function measure() {
          var sw = stage.clientWidth, sh = stage.clientHeight;
          var scale = Math.max(sw / 1600, sh / 900), ox = (sw - 1600 * scale) * .46, oy = (sh - 900 * scale) * .5;
          // Registration of the printed mark in the 1600×900 cafe photograph.
          var left = ox + 700 * scale, top = oy + 390 * scale, size = 112 * scale;
          symbol.style.left = left + 'px'; symbol.style.top = top + 'px';
          symbol.style.width = size + 'px'; symbol.style.height = size + 'px';
          var pinTop = headerH() + (desktop ? 0 : 24), di = dest.getBoundingClientRect();
          R = { x: docLeft(stage) - w.scrollX + left, y: docTop(stage) - docTop(host) + pinTop + top,
            size: size, dx: di.left, dy: di.top, ds: di.width * 200 / 1068.75 };
          // Rise first, then cross above the headline, just like the old opening.
          var heading = $('h1', sec), textTop = desktop ? docTop(heading) - docTop(host) + pinTop : pinTop;
          R.lane = desktop ? headerH() + Math.max(0, textTop - headerH()) * .28 : headerH() + 12;
          g.set(fly, { left: R.x, top: R.y, width: size, height: size, transformOrigin: '0 0' });
          last = '';
        }
        function bez(a, b, c1, z, t) { var u = 1 - t; return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c1 + t*t*t*z; }
        var paint = safe(function () {
          var q = clamp(fp.q), moving = q > .0001 && q < .9999, docked = q >= .9999;
          var k = 1 + ease(q) * (R.ds / R.size - 1);
          setX(bez(R.x, R.x, R.dx, R.dx, q) - R.x);
          setY(bez(R.y, R.lane, R.lane, R.dy, q) - R.y);
          setScaleX(k); setScaleY(k);
          var state = assetsReady + ':' + moving + ':' + docked;
          if (state === last) return; last = state;
          sec.classList.toggle('is-lift-ready', assetsReady);
          dest.classList.toggle('is-symbol-away', assetsReady && !docked);
          symbol.style.opacity = moving || docked ? '0' : '1';
          fly.style.visibility = assetsReady && moving ? 'visible' : 'hidden';
          fly.style.willChange = assetsReady && moving ? 'transform' : 'auto';
        });
        measure();
        var tl = g.timeline({ onUpdate: paint, scrollTrigger: {
          id: 'restaurant-symbol-flight', trigger: host, pin: true,
          start: function () { return 'top top+=' + (headerH() + (desktop ? 0 : 24)); },
          end: function () { return '+=' + Math.round(vh() * (desktop ? .72 : .5)); },
          scrub: .3, invalidateOnRefresh: true, refreshPriority: 3, anticipatePin: 1,
          onRefresh: paint
        } });
        // Refresh measures while GSAP has reverted pin positioning.
        tl.fromTo(fp, { q: 0 }, { q: function () { measure(); return 1; }, duration: 1, ease: 'none', immediateRender: false });
        draw = paint; paint();
        return function () {
          if (draw === paint) draw = null;
          layer.remove(); sec.classList.remove('is-lift-ready'); dest.classList.remove('is-symbol-away'); symbol.removeAttribute('style');
        };
      });
      Promise.all([ready(plate), ready(symbol)]).then(safe(function () {
        if (cancelled || dead) return;
        assetsReady = true; if (draw) draw();
      })).catch(function () {
        // A missing optional asset keeps the complete, ordinary hero photograph.
        if (cancelled || dead) return;
        flightMedia.revert(); ST.refresh();
      });
    }

` + js.slice(end);
js = js.replace('        standLift(c);', '        symbolFlight(c);');
fs.writeFileSync(file('website/assets/motion.js'), js);
let html = fs.readFileSync(file('website/restaurants/index.html'), 'utf8');
html = html.replace('data-stand-lift', 'data-symbol-flight')
  .replace('مرّر، وشوف الستاند يرتفع.', 'مرّر… وتابع اللمسة.')
  .replaceAll('restaurant-lift-plate-', 'restaurant-symbol-plate-')
  .replace(/<span class="r-lift-shadow"[^>]*><\/span>\r?\n/, '')
  .replace('src="../assets/images/restaurant-lift-stand.webp" width="752" height="1004"', 'src="../assets/brand/symbol-ink.svg" width="200" height="200"')
  .replace('restaurants.css?v=20260929', 'restaurants.css?v=symbol-flight-1')
  .replace('motion.js?v=20260929', 'motion.js?v=symbol-flight-1');
fs.writeFileSync(file('website/restaurants/index.html'), html);
let css = fs.readFileSync(file('website/assets/restaurants.css'), 'utf8');
css = css.replace('/* The acrylic product is a separate image above a clean photographic plate.\n   Both stay hidden until decoded. The ordinary photograph is the fallback. */', '/* Only the square symbol is separate; the acrylic stand and lettering stay in the plate. */')
  .replaceAll('data-stand-lift', 'data-symbol-flight')
  .replace(/^\.r-lift-shadow[^\r\n]*\r?\n/m, '')
  .replaceAll(', .r-lift-shadow', '').replaceAll('.r-lift-shadow, ', '')
  .replace('.r-lift-cue { display: none;', '.r-lift-cue { display: flex; visibility: hidden;')
  .replace('.is-lift-ready .r-lift-cue { display: flex; }', '.is-lift-ready .r-lift-cue { visibility: visible; }');
css = css.replace('/* 2026-09-29 — readable', '.s-logo-h.is-symbol-away { clip-path: inset(0 0 0 18.714%); }\n.r-symbol-fly { display: block; max-width: none; pointer-events: none; }\n@media print { .r-symbol-flight { display: none !important; } .s-logo-h.is-symbol-away { clip-path: none; } }\n/* 2026-09-29 — readable');
css = css.replace('/* The acrylic product is a separate image above a clean photographic plate.\r\n   Both stay hidden until decoded. The ordinary photograph is the fallback. */', '/* Only the square symbol is separate; the acrylic stand and lettering stay in the plate. */');
fs.writeFileSync(file('website/assets/restaurants.css'), css);
console.log('Integrated symbol-only flight.');
