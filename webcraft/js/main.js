/* ══════════════════════════════════════════════
   WebCraft · main.js
   Three.js 3D Hero + all site interactions
══════════════════════════════════════════════ */

/* ─── 1. Three.js Hero Scene ─── */
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const hero = document.querySelector('.hero');
  const W = () => hero.clientWidth;
  const H = () => hero.clientHeight;

  /* Scene */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 200);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);

  /* ── Main wireframe group ── */
  const group = new THREE.Group();
  scene.add(group);

  const matPrimary   = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.65 });
  const matSecondary = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.45 });
  const matAccent    = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.75 });
  const matSoft      = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.5  });

  function wireframe(geo, mat) {
    return new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
  }

  /* Big central icosahedron */
  const icosa = wireframe(new THREE.IcosahedronGeometry(1.6, 1), matPrimary);
  group.add(icosa);

  /* Surrounding torus ring */
  const torus = wireframe(new THREE.TorusGeometry(2.6, 0.035, 16, 120), matSecondary);
  torus.rotation.x = Math.PI * 0.18;
  group.add(torus);

  /* Second torus, perpendicular */
  const torus2 = wireframe(new THREE.TorusGeometry(3.1, 0.025, 12, 120), matSoft);
  torus2.rotation.y = Math.PI * 0.5;
  torus2.rotation.z = Math.PI * 0.1;
  group.add(torus2);

  /* Small floating octahedron – top right */
  const octa = wireframe(new THREE.OctahedronGeometry(0.65, 0), matAccent);
  octa.position.set(3.0, 1.2, -0.5);
  scene.add(octa);

  /* Small icosahedron – bottom left */
  const ico2 = wireframe(new THREE.IcosahedronGeometry(0.45, 0), matSoft);
  ico2.position.set(-3.0, -1.0, -0.5);
  scene.add(ico2);

  /* Tiny tetrahedron – mid left */
  const tetra = wireframe(new THREE.TetrahedronGeometry(0.4, 0), matPrimary);
  tetra.position.set(-2.5, 1.5, -1);
  scene.add(tetra);

  /* Tiny octahedron – bottom right */
  const octa2 = wireframe(new THREE.OctahedronGeometry(0.35, 0), matSecondary);
  octa2.position.set(2.5, -1.8, -1);
  scene.add(octa2);

  /* ── Particle field ── */
  const N = 350;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.35 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ── Glowing core sphere ── */
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.04 });
  const core    = new THREE.Mesh(new THREE.SphereGeometry(1.55, 32, 32), coreMat);
  group.add(core);

  /* ── Mouse & Scroll state ── */
  let mouseX = 0, mouseY = 0;
  let smoothX = 0, smoothY = 0;
  let scrollRatio = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('scroll', () => {
    const heroH = hero.offsetHeight || window.innerHeight;
    scrollRatio = Math.min(window.scrollY / heroH, 1);
  });

  /* ── Animation loop ── */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    /* Smooth mouse lerp */
    smoothX += (mouseX - smoothX) * 0.04;
    smoothY += (mouseY - smoothY) * 0.04;

    /* Group mouse parallax */
    group.rotation.y = smoothX * 0.35;
    group.rotation.x = smoothY * 0.25;

    /* Self-rotation */
    icosa.rotation.y += 0.0025;
    icosa.rotation.z += 0.001;
    torus.rotation.z += 0.004;
    torus2.rotation.x += 0.003;
    octa.rotation.y   += 0.009;
    octa.rotation.x   += 0.006;
    ico2.rotation.y   -= 0.007;
    ico2.rotation.z   += 0.004;
    tetra.rotation.y  += 0.011;
    tetra.rotation.x  += 0.007;
    octa2.rotation.z  -= 0.008;

    /* Float oscillations for detached objects */
    octa.position.y  = 1.2  + Math.sin(t * 0.8)  * 0.2;
    ico2.position.y  = -1.0 + Math.cos(t * 0.6)  * 0.25;
    tetra.position.y = 1.5  + Math.sin(t * 1.1 + 1) * 0.18;
    octa2.position.y = -1.8 + Math.cos(t * 0.9 + 2) * 0.2;

    /* Scroll: push group up & fade */
    group.position.y    = scrollRatio * 3;
    group.scale.setScalar(1 - scrollRatio * 0.35);
    particles.rotation.y = t * 0.015;

    renderer.render(scene, camera);
  }
  animate();

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
})();

/* ─── 2. Navbar scroll behaviour ─── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── 3. Mobile nav toggle ─── */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();

/* ─── 4. Reveal on scroll (IntersectionObserver) ─── */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el, i) => {
    el.style.transitionDelay = (i % 6 * 80) + 'ms';
    observer.observe(el);
  });
})();

/* ─── 5. FAQ accordion ─── */
(function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');

      /* Close all */
      document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-a').style.maxHeight = '0';
      });

      /* Open clicked (if was closed) */
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();

/* ─── 6. Contact form ─── */
(function initForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    /* Simulate async send (replace with your backend / Formspree / EmailJS) */
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = 'Enviar mensaje <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      if (success) {
        success.style.display = 'block';
        setTimeout(() => success.style.display = 'none', 5000);
      }
    }, 1200);
  });
})();

/* ─── 7. Smooth anchor scroll (enhance native) ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id  = a.getAttribute('href').slice(1);
    const el  = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
