document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Navbar active link
  const links = $$('.navbar-nav .nav-link');
  // determine current filename robustly (handle root paths and trailing slashes)
  let path = window.location.pathname || '';
  let current = (path === '/' || path === '' || path.endsWith('/')) ? 'index.html' : path.split('/').pop();
  current = (current || 'index.html').toLowerCase();
  links.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    const isActive = href === current || href.replace('./', '') === current;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  // Smooth scrolling
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      const navCollapse = $('#navbarNav');
      if (navCollapse?.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
    });
  });

  // Fullstack form
  const form = $('#fullstack-form');
  const result = $('#fullstack-result');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const username = $('#username')?.value.trim();
      const email = $('#email')?.value.trim();
      const message = $('#message')?.value.trim();
      if (!username || !email || !emailRe.test(email)) {
        result.innerHTML = `<div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-circle"></i> Please provide a name and a valid email.
        </div>`;
        result.focus();
        return;
      }
      result.innerHTML = `<div class="alert alert-success" role="status" aria-live="polite">
        <i class="fas fa-check-circle"></i> Form submitted successfully!<br>
        <strong>Username:</strong> ${escapeHtml(username)}<br>
        <strong>Email:</strong> ${escapeHtml(email)}<br>
        <strong>Message:</strong> ${escapeHtml(message) || 'No message provided'}
        <div class="mt-2"><small>This simulates sending data to a backend server.</small></div>
      </div>`;
      result.focus();
      form.reset();
    });
  }

  // Back-to-top button
  const btn = $('.back-to-top');
  if (btn) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          btn.classList.toggle('show', window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // Initialize Bootstrap tooltips
  $$('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));

  // ====== To-Do List ======
  const addBtn = $('#add-btn');
  const todoInput = $('#todo-input');
  const todoList = $('#todo-list');
  if (addBtn && todoInput && todoList) {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

    function addTodo() {
      const task = todoInput.value.trim();
      if (!task) return;

      const li = document.createElement('li');
      li.className = "d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-white";

      const span = document.createElement('span');
      span.textContent = task;
      span.style.cursor = "pointer";
      span.addEventListener('click', () => li.classList.toggle('text-decoration-line-through'));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Delete";
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.addEventListener('click', () => li.remove());

      li.append(span, deleteBtn);
      todoList.appendChild(li);
      todoInput.value = '';
    }
  }

  // ====== Weather App ======
  const weatherBtn = $('#getweatherButton');
  const locationInputEl = $('#locationInput');
  const weatherResultEl = $('#weatherResult');
  if (weatherBtn && locationInputEl && weatherResultEl) {
    const showWeatherMessage = (html, type = 'info') => {
      const cls = type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'info');
      const role = type === 'error' ? 'alert' : 'status';
      weatherResultEl.innerHTML = `<div class="alert alert-${cls}" role="${role}" aria-live="polite">${html}</div>`;
    };

    const isValidLocation = (value) => {
      const s = (value || '').trim();
      if (s.length < 2 || s.length > 100) return false;
      // Allow letters, numbers, spaces, comma, dot, hyphen, apostrophe, parentheses
      const allowed = /^[A-Za-z0-9\s,'\.\-\(\)]+$/;
      // Require at least one alphanumeric character
      const hasAlnum = /[A-Za-z0-9]/.test(s);
      return allowed.test(s) && hasAlnum;
    };

    weatherBtn.addEventListener('click', async () => {
      const location = locationInputEl.value.trim();
      if (!location) {
        showWeatherMessage('Please enter a location.', 'error');
        locationInputEl.focus();
        return;
      }
      if (!isValidLocation(location)) {
        showWeatherMessage('Enter a valid city name (letters, numbers, spaces, comma, hyphen, apostrophe, dot).', 'error');
        locationInputEl.focus();
        return;
      }

      // Disable button and show loading state
      weatherBtn.disabled = true;
      weatherBtn.setAttribute('aria-busy', 'true');
      const originalBtnHtml = weatherBtn.innerHTML;
      weatherBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

      try {
        // Replace with your valid WeatherAPI key (do NOT commit real secrets to public repos)
        const apiKey = "e8eaaa023f6848f2a4b21640251806";
        if (!apiKey || apiKey.length < 10) console.warn('Weather API key is missing or looks invalid. Replace it with a valid key.');
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`;

        const res = await fetch(url);
        // Try to parse body as JSON for both ok and non-ok responses
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = data?.error?.message || `Unexpected response: ${res.status} ${res.statusText}`;
          showWeatherMessage(escapeHtml(errMsg), 'error');
          return;
        }
        if (data?.error) {
          showWeatherMessage(escapeHtml(data.error.message || 'Unable to fetch weather data.'), 'error');
          return;
        }

        const weather = data.current;
        weatherResultEl.innerHTML = `
          <div class="alert alert-success" role="status" aria-live="polite">
            <p><strong>Temperature:</strong> ${escapeHtml(String(weather.temp_c))}°C</p>
            <p><strong>Condition:</strong> ${escapeHtml(weather.condition.text)}</p>
          </div>
        `;
      } catch (error) {
        console.error('Error fetching weather data:', error);
        showWeatherMessage('Network error occurred. Please try again.', 'error');
      } finally {
        weatherBtn.disabled = false;
        weatherBtn.setAttribute('aria-busy', 'false');
        weatherBtn.innerHTML = originalBtnHtml;
      }
    });
  }
});

// ===== Modal Fixes =====
document.addEventListener('hidden.bs.modal', () => {
  document.body.classList.remove('modal-open');
  document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
  document.querySelectorAll('.modal.show').forEach(modal => {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.style.zIndex = '';
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) dialog.style.zIndex = '';
  });
});

document.addEventListener('shown.bs.modal', (event) => {
  const modal = event.target;
  if (!(modal instanceof HTMLElement)) return;
  if (modal.parentElement !== document.body) document.body.appendChild(modal);

  let highestBackdropZ = 1049;
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    const z = parseInt(window.getComputedStyle(bd).zIndex, 10);
    if (!isNaN(z)) highestBackdropZ = Math.max(highestBackdropZ, z);
  });

  modal.style.zIndex = (highestBackdropZ + 10).toString();
  const dialog = modal.querySelector('.modal-dialog');
  if (dialog) dialog.style.zIndex = (highestBackdropZ + 11).toString();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    });
  }
});
