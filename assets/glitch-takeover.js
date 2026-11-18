(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const glyphs = '#%&*+/?<>01';
  const hover = window.matchMedia('(any-hover: hover)');

  document.querySelectorAll('.glitch-takeover .glitch-card').forEach((card) => {
    function scramble(event) {
      if (!hover.matches || event.pointerType === 'touch' || reducedMotion.matches) return;
      card.removeEventListener('pointerenter', scramble);

      const fields = [...card.querySelectorAll('[data-glitch-scramble]')].map((element) => {
        const original = document.createElement('span');
        const visual = document.createElement('span');
        const characters = Array.from(element.textContent.trim());

        visual.className = 'glitch-scramble__visual';
        visual.setAttribute('aria-hidden', 'true');
        original.className = 'glitch-scramble__original';
        original.append(...element.childNodes);
        element.append(original, visual);
        return { element, original, visual, characters };
      });

      let timer;
      let tick = 0;
      const frames = 6;

      function finish() {
        clearTimeout(timer);
        fields.forEach(({ element, original }) => element.replaceChildren(...original.childNodes));
        card.removeEventListener('focusin', finish);
        reducedMotion.removeEventListener('change', finish);
      }

      function update() {
        if (tick >= frames) {
          finish();
          return;
        }

        fields.forEach(({ visual, characters }) => {
          const revealed = Math.floor((tick / frames) * characters.length);
          visual.textContent = characters.map((char, index) => {
            if (index < revealed || /\s/.test(char)) return char;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          }).join('');
        });

        tick++;
        timer = setTimeout(update, 50);
      }

      card.addEventListener('focusin', finish);
      reducedMotion.addEventListener('change', finish);
      update();
    }

    card.addEventListener('pointerenter', scramble);
  });

  const lines = [...document.querySelectorAll('.glitch-takeover [data-glitch-type]')].map((element) => {
    const text = element.textContent;
    const accessible = document.createElement('span');
    const visual = document.createElement('span');
    const typed = document.createTextNode('');
    const pending = document.createElement('span');

    accessible.className = 'visually-hidden';
    accessible.textContent = text;
    visual.setAttribute('aria-hidden', 'true');
    pending.className = 'glitch-type__pending';
    pending.textContent = text;
    visual.append(typed, pending);
    element.replaceChildren(accessible, visual);
    element.setAttribute('data-glitch-typing', '');

    return { element, text, characters: Array.from(text), typed, pending };
  });
  if (!lines.length) return;

  const total = lines.reduce((length, line) => length + line.characters.length, 0);
  const interval = Math.min(12, 2100 / total);
  const start = performance.now();
  let index = 0;
  let offset = 0;
  let frame;

  function restore({ element, text }) {
    element.textContent = text;
    element.removeAttribute('data-glitch-typing');
  }

  function finish() {
    cancelAnimationFrame(frame);
    lines.slice(index).forEach(restore);
    document.removeEventListener('focusin', finish);
    reducedMotion.removeEventListener('change', finish);
  }

  function type(now) {
    const count = Math.floor((now - start) / interval);

    while (index < lines.length) {
      const line = lines[index];
      const length = line.characters.length;
      if (count < offset + length) {
        const split = Math.max(0, count - offset);
        line.typed.data = line.characters.slice(0, split).join('');
        line.pending.textContent = line.characters.slice(split).join('');
        frame = requestAnimationFrame(type);
        return;
      }

      restore(line);
      offset += length;
      index++;
    }

    finish();
  }

  document.addEventListener('focusin', finish);
  reducedMotion.addEventListener('change', finish);
  frame = requestAnimationFrame(type);
})();
