import './acceso.css';
import template from './acceso.html?raw';
import { $ } from '../../core/dom.js';
import { login } from '../../services/auth.js';
import { showToast } from '../../shared/components/toast.js';
import { bindPasswordToggle } from '../../shared/components/passwordField.js';
import { icon } from '../../shared/icons.js';

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
    const result = await login(email, password);
    submit.textContent = 'Entrar';

    if (result.ok) {
      form.reset();
      showError('');
      submit.disabled = false;
      showToast('¡Bienvenido de nuevo!');
      return;
    }
    form.elements.password.value = '';
    showError(result.error);
    if (result.locked) startCountdown(result.locked);
    else submit.disabled = false;
  });

  $('[data-signup]', section).addEventListener('click', () => sessionStorage.setItem('scvd:open-signup', '1'));

  screen.onShow = () => {
    showError('');
    $('#loginEmail', section).focus();
  };
}

export const screen = {
  id: 'acceso', label: 'Iniciar sesión', icon: icon('user'), nav: false, access: 'public', mount,
};
