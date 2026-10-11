import './acceso.css';
import template from './acceso.html?raw';
import { $ } from '../../core/dom.js';
import { login } from '../../services/auth.js';
import { showToast } from '../../shared/components/toast.js';
import { bindPasswordToggle } from '../../shared/components/passwordField.js';
import { icon } from '../../shared/icons.js';

// `onShow`/`onHide` se exportan en el literal `screen`: `mount` solo registra
// aquí sus manejadores, sin mutar el objeto exportado.
let handleShow = () => {};
let handleHide = () => {};

function onShow() { handleShow(); }
function onHide() { handleHide(); }

function mount(section) {
  section.innerHTML = template;

  const form = $('#loginForm', section);
  const error = $('#loginError', section);
  const submit = $('#loginSubmit', section);
  let countdown = null;

  bindPasswordToggle($('#loginPassword', section), $('#loginToggle', section));

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function startCountdown(seconds) {
    clearInterval(countdown);
    let remaining = seconds;
    submit.disabled = true;
    countdown = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdown);
        countdown = null;
        submit.disabled = false;
        showError('');
        return;
      }
      showError(`Demasiados intentos. Intenta de nuevo en ${remaining} s.`);
    }, 1000);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.elements.email.value;
    const password = form.elements.password.value;
    if (!email.trim() || !password) {
      showError('Escribe tu correo y tu contraseña.');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Verificando…';
    let locked = false;
    try {
      const result = await login(email, password);
      if (result.ok) {
        form.reset();
        showError('');
        showToast('¡Bienvenido de nuevo!');
        return;
      }
      form.elements.password.value = '';
      showError(result.error);
      if (result.locked) {
        locked = true;
        startCountdown(result.locked);
      }
    } catch {
      showError('No pudimos verificar tus datos. Intenta de nuevo.');
    } finally {
      submit.textContent = 'Entrar';
      if (!locked) submit.disabled = false;
    }
  });

  $('[data-signup]', section)?.addEventListener('click', () => {
    try {
      sessionStorage.setItem('scvd:open-signup', '1');
    } catch {
      // Almacenamiento bloqueado: se continúa a bienvenida sin apertura automática.
    }
  });

  handleShow = () => {
    clearInterval(countdown);
    countdown = null;
    submit.disabled = false;
    submit.textContent = 'Entrar';
    showError('');
    $('#loginEmail', section)?.focus();
  };

  handleHide = () => {
    clearInterval(countdown);
    countdown = null;
  };
}

export const screen = {
  id: 'acceso', label: 'Iniciar sesión', icon: icon('user'), nav: false, access: 'public', mount, onShow, onHide,
};
