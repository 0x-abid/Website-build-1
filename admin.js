
/* THE GRIND - ADMIN LOGIN + CAMPAIGN MANAGEMENT */

const client = window.supabaseClient;

// HTML elements
const loginSection = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("admin-login-message");
const loginButton = document.getElementById("admin-login-button");
const logoutButton = document.getElementById("admin-logout");

// Campaign elements
const campaignForm = document.getElementById("campaign-form");
const campaignList = document.getElementById("campaign-list");
const campaignMessage = document.getElementById("campaign-message");
const campaignId = document.getElementById("campaign-id");
const campaignTitle = document.getElementById("campaign-title");
const campaignDescription = document.getElementById("campaign-description");
const campaignRequirements = document.getElementById("campaign-requirements");
const campaignUrl = document.getElementById("campaign-url");
const campaignStatus = document.getElementById("campaign-status");
const campaignFormTitle = document.getElementById("campaign-form-title");
const campaignSaveButton = document.getElementById("campaign-save-button");
const campaignCancelButton = document.getElementById("campaign-cancel-button");

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

// Verify admin access
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
  await loadCampaigns();

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

// Login
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

// Logout
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

// Escape HTML before displaying database content
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

// Allow only HTTP and HTTPS external links
function safeExternalURL(value) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch (error) {
    return "";
  }

  return "";
}

// Load campaigns from Supabase
async function loadCampaigns() {
  if (!client || !campaignList) return;

  campaignList.textContent = "Loading campaigns...";

  const { data, error } = await client
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Campaign loading error:", error);
    campaignList.textContent =
      "Unable to load campaigns. Check your database permissions.";
    return;
  }

  if (!data || data.length === 0) {
    campaignList.textContent = "No campaigns created yet.";
    return;
  }

  campaignList.innerHTML = data.map((campaign) => {
    const id = escapeHTML(campaign.id);
    const title = escapeHTML(campaign.title);
    const description = escapeHTML(campaign.description);
    const requirements = escapeHTML(campaign.requirements);
    const status = escapeHTML(campaign.status);
    const externalURL = safeExternalURL(campaign.external_url);

    const nextStatus =
      campaign.status === "published" ? "closed" : "published";

    const statusButton =
      campaign.status === "published" ? "Close Campaign" : "Publish Campaign";

    return `
      <div class="card" style="margin-top:15px; padding:18px;">
        <h3>${title}</h3>

        <p style="white-space:pre-wrap;">${description}</p>

        ${requirements
          ? `<p><strong>Requirements:</strong> ${requirements}</p>`
          : ""}

        ${externalURL
          ? `<p><a href="${escapeHTML(externalURL)}"
              target="_blank" rel="noopener noreferrer">
              Open Campaign Link
            </a></p>`
          : ""}

        <p><strong>Status:</strong> ${status.toUpperCase()}</p>

        <button
          type="button"
          class="btn"
          data-action="edit"
          data-id="${id}">
          Edit
        </button>

        <button
          type="button"
          class="btn"
          data-action="status"
          data-id="${id}"
          data-status="${nextStatus}">
          ${statusButton}
        </button>
      </div>
    `;
  }).join("");
}

// Reset campaign form
function resetCampaignForm() {
  campaignForm.reset();
  campaignId.value = "";
  campaignFormTitle.textContent = "Create New Campaign";
  campaignSaveButton.textContent = "Save Campaign";
  campaignCancelButton.hidden = true;
  campaignMessage.textContent = "";
}

// Create or update campaign
campaignForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    campaignMessage.textContent = "Supabase connection failed.";
    return;
  }

  const externalURL = campaignUrl.value.trim();

  if (externalURL && !safeExternalURL(externalURL)) {
    campaignMessage.textContent =
      "Please enter a valid HTTP or HTTPS link.";
    return;
  }

  const campaignData = {
    title: campaignTitle.value.trim(),
    description: campaignDescription.value.trim(),
    requirements: campaignRequirements.value.trim(),
    external_url: externalURL || null,
    status: campaignStatus.value
  };

  if (!campaignData.title || !campaignData.description) {
    campaignMessage.textContent =
      "Please enter a title and description.";
    return;
  }

  campaignSaveButton.disabled = true;
  campaignMessage.textContent = "Saving campaign...";

  let result;

  if (campaignId.value) {
    result = await client
      .from("campaigns")
      .update(campaignData)
      .eq("id", campaignId.value);
  } else {
    result = await client
      .from("campaigns")
      .insert(campaignData);
  }

  campaignSaveButton.disabled = false;

  if (result.error) {
    console.error("Campaign save error:", result.error);
    campaignMessage.textContent =
      "Could not save campaign. Please check database permissions.";
    return;
  }

  resetCampaignForm();
  campaignMessage.textContent = "Campaign saved successfully.";

  await loadCampaigns();
});

// Campaign list actions: Edit and Publish/Close
campaignList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button || !client) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;

  if (action === "edit") {
    const { data, error } = await client
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    button.disabled = false;

    if (error || !data) {
      alert("Unable to load this campaign.");
      return;
    }

    campaignId.value = data.id;
    campaignTitle.value = data.title || "";
    campaignDescription.value = data.description || "";
    campaignRequirements.value = data.requirements || "";
    campaignUrl.value = data.external_url || "";
    campaignStatus.value = data.status || "draft";

    campaignFormTitle.textContent = "Edit Campaign";
    campaignSaveButton.textContent = "Update Campaign";
    campaignCancelButton.hidden = false;

    campaignForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  if (action === "status") {
    const newStatus = button.dataset.status;

    if (!["published", "closed"].includes(newStatus)) {
      button.disabled = false;
      return;
    }

    const { error } = await client
      .from("campaigns")
      .update({ status: newStatus })
      .eq("id", id);

    button.disabled = false;

    if (error) {
      console.error("Campaign status error:", error);
      alert("Could not update campaign status.");
      return;
    }

    await loadCampaigns();
  }
});

// Cancel campaign editing
campaignCancelButton.addEventListener("click", resetCampaignForm);

// Refresh dashboard when authentication changes
if (client) {
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}

// Start admin panel
initializeAdmin();

