
/* THE GRIND - SECURE ADMIN LOGIN */

const client = window.supabaseClient;

// HTML elements
const loginSection = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("admin-login-message");
const loginButton = document.getElementById("admin-login-button");
const logoutButton = document.getElementById("admin-logout");

// Show login screen
function showLogin(message = "") {
  loginSection.hidden = false;
  dashboard.hidden = true;
  loginMessage.textContent = message;
}

// Show admin dashboard
function showDashboard() {
  loginSection.hidden = true;
  dashboard.hidden = false;
}

// Verify that the logged-in user is an admin
async function verifyAdmin(user) {
  if (!user) {
    showLogin();
    return false;
  }

  const { data, error } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    await client.auth.signOut();

    showLogin(
      error
        ? "Unable to verify admin access. Please try again."
        : "This account is not authorized as an admin."
    );

    return false;
  }

  showDashboard();
  return true;
}

// Check existing login session
async function initializeAdmin() {
  if (!client) {
    showLogin("Supabase connection failed. Please check supabase.js.");
    return;
  }

  showLogin("Checking your login...");

  const { data, error } = await client.auth.getSession();

  if (error) {
    showLogin("Unable to verify your session. Please sign in again.");
    return;
  }

  if (data.session) {
    await verifyAdmin(data.session.user);
  } else {
    showLogin();
  }
}

// Handle login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    showLogin("Supabase connection failed. Please reload the page.");
    return;
  }

  loginButton.disabled = true;
  loginMessage.textContent = "Signing in...";

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMessage.textContent =
      "Login failed. Check your email and password.";
    loginButton.disabled = false;
    return;
  }

  const authorized = await verifyAdmin(data.user);

  if (authorized) {
    loginForm.reset();
  }

  loginButton.disabled = false;
});

// Handle logout
logoutButton.addEventListener("click", async () => {
  if (!client) return;

  logoutButton.disabled = true;

  const { error } = await client.auth.signOut();

  if (error) {
    alert("Logout failed. Please try again.");
    logoutButton.disabled = false;
    return;
  }

  loginForm.reset();
  showLogin("You have been logged out.");
  logoutButton.disabled = false;
});

// Keep dashboard hidden after sign-out
if (client) {
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}

// Start admin panel
initializeAdmin();
