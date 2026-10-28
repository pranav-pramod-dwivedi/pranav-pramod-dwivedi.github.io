/* ==========================================================================
   PRANAV DWIVEDI — INTERACTIVE ENGINE & 60FPS AMBIENT CANVAS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initMobileDrawer();
  initDisciplineTabs();
  initHeroEngineTabs();
});

// 1. Subtle 60fps Ambient Cyan Particles (Optimized, No Canvas Lag)
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const particleCount = Math.min(32, Math.floor(width / 35));
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.08
    });
  }

  let animationId;
  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

  render();
}

// 2. Mobile Drawer Navigation Toggle
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const drawer = document.getElementById('mobile-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });
}

// 3. Discipline Switcher Tabs (Main Page)
function initDisciplineTabs() {
  const tabs = document.querySelectorAll('.tab-btn[data-tab]');
  const engBlock = document.getElementById('block-engineering');
  const cricketBlock = document.getElementById('block-cricket');

  if (!tabs.length || !engBlock || !cricketBlock) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      if (target === 'engineering') {
        engBlock.style.display = 'block';
        cricketBlock.style.display = 'none';
      } else if (target === 'cricket') {
        engBlock.style.display = 'none';
        cricketBlock.style.display = 'block';
      } else {
        engBlock.style.display = 'block';
        cricketBlock.style.display = 'block';
      }
    });
  });
}

// 4. Hero Engine Dual-Panel Switcher
function initHeroEngineTabs() {
  const tabs = document.querySelectorAll('.engine-nav-tab[data-engine]');
  const panelSys = document.getElementById('engine-panel-systems');
  const panelAthletic = document.getElementById('engine-panel-athletics');

  if (!tabs.length || !panelSys || !panelAthletic) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-engine');
      if (target === 'athletics') {
        panelSys.style.display = 'none';
        panelAthletic.style.display = 'block';
      } else {
        panelSys.style.display = 'block';
        panelAthletic.style.display = 'none';
      }
    });
  });
}
