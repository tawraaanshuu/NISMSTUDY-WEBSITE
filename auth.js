(function () {
  const { createClient } = window.supabase;
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  window.nismSupabase = supabase;

  async function redirectIfLoggedIn() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = '/';
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('authError');
    const button = document.getElementById('submitBtn');

    errorBox.textContent = '';
    button.disabled = true;
    button.textContent = 'Signing in...';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      errorBox.textContent = error.message;
      button.disabled = false;
      button.textContent = 'Sign In';
      return;
    }

    window.location.href = '/';
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorBox = document.getElementById('authError');
    const successBox = document.getElementById('authSuccess');
    const button = document.getElementById('submitBtn');

    errorBox.textContent = '';
    successBox.textContent = '';

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      return;
    }

    button.disabled = true;
    button.textContent = 'Creating account...';

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone
        }
      }
    });

    if (error) {
      errorBox.textContent = error.message;
      button.disabled = false;
      button.textContent = 'Create Account';
      return;
    }

    successBox.textContent = 'Account created. Please check your email to confirm your account.';
    button.disabled = false;
    button.textContent = 'Create Account';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
      redirectIfLoggedIn();
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
  });
})();
