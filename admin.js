
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

// Giveaway elements
const giveawayForm = document.getElementById("giveaway-form");
const giveawayList = document.getElementById("giveaway-list");
const giveawayMessage = document.getElementById("giveaway-message");
const giveawayId = document.getElementById("giveaway-id");
const giveawayTitle = document.getElementById("giveaway-title");
const giveawayDescription = document.getElementById("giveaway-description");
const giveawayReward = document.getElementById("giveaway-reward");
const giveawayStatus = document.getElementById("giveaway-status");
const giveawayFormTitle = document.getElementById("giveaway-form-title");
const giveawaySaveButton = document.getElementById("giveaway-save-button");
const giveawayCancelButton = document.getElementById("giveaway-cancel-button");

// UGC elements
const ugcForm = document.getElementById("ugc-form");
const ugcList = document.getElementById("ugc-list");
const ugcMessage = document.getElementById("ugc-message");
const ugcId = document.getElementById("ugc-id");
const ugcTitle = document.getElementById("ugc-title");
const ugcDescription = document.getElementById("ugc-description");
const ugcProjectUrl = document.getElementById("ugc-project-url");
const ugcStatus = document.getElementById("ugc-status");
const ugcFormTitle = document.getElementById("ugc-form-title");
const ugcSaveButton = document.getElementById("ugc-save-button");
const ugcCancelButton = document.getElementById("ugc-cancel-button");

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
await loadGiveaways();
await loadUGC();

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

/* GIVEAWAY MANAGEMENT */

// Load giveaways
async function loadGiveaways() {
  if (!client || !giveawayList) return;

  giveawayList.textContent = "Loading giveaways...";

  const { data, error } = await client
    .from("giveaways")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Giveaway loading error:", error);
    giveawayList.textContent = "Unable to load giveaways.";
    return;
  }

  if (!data || data.length === 0) {
    giveawayList.textContent = "No giveaways created yet.";
    return;
  }

  giveawayList.innerHTML = data.map((giveaway) => {
    const id = escapeHTML(giveaway.id);
    const title = escapeHTML(giveaway.title);
    const description = escapeHTML(giveaway.description);
    const reward = escapeHTML(giveaway.reward);
    const status = escapeHTML(giveaway.status);

    const nextStatus =
      giveaway.status === "active" ? "closed" : "active";

    const statusButton =
      giveaway.status === "active"
        ? "Close Giveaway"
        : "Activate Giveaway";

    return `
      <div class="card" style="margin-top:15px; padding:18px;">
        <h3>${title}</h3>
        <p style="white-space:pre-wrap;">${description}</p>
        <p><strong>Reward:</strong> ${reward}</p>
        <p><strong>Status:</strong> ${status.toUpperCase()}</p>

        <button type="button" class="btn"
          data-giveaway-action="edit" data-id="${id}">
          Edit
        </button>

        <button type="button" class="btn"
          data-giveaway-action="status" data-id="${id}"
          data-status="${nextStatus}">
          ${statusButton}
        </button>
      </div>
    `;
  }).join("");
}

// Reset giveaway form
function resetGiveawayForm() {
  giveawayForm.reset();
  giveawayId.value = "";
  giveawayFormTitle.textContent = "Create New Giveaway";
  giveawaySaveButton.textContent = "Save Giveaway";
  giveawayCancelButton.hidden = true;
  giveawayMessage.textContent = "";
}

// Create or update giveaway
giveawayForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    giveawayMessage.textContent = "Supabase connection failed.";
    return;
  }

  const giveawayData = {
    title: giveawayTitle.value.trim(),
    description: giveawayDescription.value.trim(),
    reward: giveawayReward.value.trim(),
    status: giveawayStatus.value
  };

  if (
    !giveawayData.title ||
    !giveawayData.description ||
    !giveawayData.reward
  ) {
    giveawayMessage.textContent = "Please fill in all fields.";
    return;
  }

  giveawaySaveButton.disabled = true;
  giveawayMessage.textContent = "Saving giveaway...";

  let result;

  if (giveawayId.value) {
    result = await client
      .from("giveaways")
      .update(giveawayData)
      .eq("id", giveawayId.value);
  } else {
    result = await client
      .from("giveaways")
      .insert(giveawayData);
  }

  giveawaySaveButton.disabled = false;

  if (result.error) {
    console.error("Giveaway save error:", result.error);
    giveawayMessage.textContent =
      "Could not save giveaway. Check database permissions.";
    return;
  }

  resetGiveawayForm();
  giveawayMessage.textContent = "Giveaway saved successfully.";

  await loadGiveaways();
});

// Giveaway edit and status actions
giveawayList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-giveaway-action]");

  if (!button || !client) return;

  const id = button.dataset.id;
  const action = button.dataset.giveawayAction;

  button.disabled = true;

  if (action === "edit") {
    const { data, error } = await client
      .from("giveaways")
      .select("*")
      .eq("id", id)
      .single();

    button.disabled = false;

    if (error || !data) {
      alert("Unable to load this giveaway.");
      return;
    }

    giveawayId.value = data.id;
    giveawayTitle.value = data.title || "";
    giveawayDescription.value = data.description || "";
    giveawayReward.value = data.reward || "";
    giveawayStatus.value = data.status || "active";

    giveawayFormTitle.textContent = "Edit Giveaway";
    giveawaySaveButton.textContent = "Update Giveaway";
    giveawayCancelButton.hidden = false;

    giveawayForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  if (action === "status") {
    const newStatus = button.dataset.status;

    if (!["active", "closed"].includes(newStatus)) {
      button.disabled = false;
      return;
    }

    const { error } = await client
      .from("giveaways")
      .update({ status: newStatus })
      .eq("id", id);

    button.disabled = false;

    if (error) {
      console.error("Giveaway status error:", error);
      alert("Could not update giveaway status.");
      return;
    }

    await loadGiveaways();
  }
});

// Cancel giveaway editing
giveawayCancelButton.addEventListener(
  "click",
  resetGiveawayForm
);
/* UGC MANAGEMENT */

// Load UGC projects
async function loadUGC() {
  if (!client || !ugcList) return;

  ugcList.textContent = "Loading UGC projects...";

  const { data, error } = await client
    .from("ugc_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("UGC loading error:", error);
    ugcList.textContent = "Unable to load UGC projects.";
    return;
  }

  if (!data || data.length === 0) {
    ugcList.textContent = "No UGC projects created yet.";
    return;
  }

  ugcList.innerHTML = data.map((post) => {
    const id = escapeHTML(post.id);
    const title = escapeHTML(post.title);
    const description = escapeHTML(post.description);
    const status = escapeHTML(post.status);

    const projectURL = safeExternalURL(post.project_url);

    const nextStatus =
      post.status === "published" ? "closed" : "published";

    const statusButton =
      post.status === "published"
        ? "Close UGC Project"
        : "Publish UGC Project";

    return `
      <div class="card" style="margin-top:15px; padding:18px;">
        <h3>${title}</h3>

        <p style="white-space:pre-wrap;">${description}</p>

        ${projectURL
          ? `<p>
              <a href="${escapeHTML(projectURL)}"
                target="_blank"
                rel="noopener noreferrer">
                Open Project Link
              </a>
            </p>`
          : ""}

        <p><strong>Status:</strong> ${status.toUpperCase()}</p>

        <button
          type="button"
          class="btn"
          data-ugc-action="edit"
          data-id="${id}">
          Edit
        </button>

        <button
          type="button"
          class="btn"
          data-ugc-action="status"
          data-id="${id}"
          data-status="${nextStatus}">
          ${statusButton}
        </button>
      </div>
    `;
  }).join("");
}


// Reset UGC form
function resetUGCForm() {
  ugcForm.reset();

  ugcId.value = "";
  ugcFormTitle.textContent = "Create UGC Project Notification";
  ugcSaveButton.textContent = "Publish Notification";
  ugcCancelButton.hidden = true;
  ugcMessage.textContent = "";
}


// Create or update UGC project
ugcForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    ugcMessage.textContent = "Supabase connection failed.";
    return;
  }

  const projectURL = ugcProjectUrl.value.trim();

  if (projectURL && !safeExternalURL(projectURL)) {
    ugcMessage.textContent =
      "Please enter a valid HTTP or HTTPS link.";
    return;
  }

  const ugcData = {
    title: ugcTitle.value.trim(),
    description: ugcDescription.value.trim(),
    project_url: projectURL || null,
    status: ugcStatus.value
  };

  if (!ugcData.title || !ugcData.description) {
    ugcMessage.textContent =
      "Please enter a project title and description.";
    return;
  }

  ugcSaveButton.disabled = true;
  ugcMessage.textContent = "Saving UGC project...";

  let result;

  if (ugcId.value) {
    result = await client
      .from("ugc_posts")
      .update(ugcData)
      .eq("id", ugcId.value);
  } else {
    result = await client
      .from("ugc_posts")
      .insert(ugcData);
  }

  ugcSaveButton.disabled = false;

  if (result.error) {
    console.error("UGC save error:", result.error);

    ugcMessage.textContent =
      "Could not save UGC project. Check database permissions.";

    return;
  }

  resetUGCForm();

  ugcMessage.textContent =
    "UGC project saved successfully.";

  await loadUGC();
});


// UGC Edit and Publish/Close actions
ugcList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-ugc-action]");

  if (!button || !client) return;

  const id = button.dataset.id;
  const action = button.dataset.ugcAction;

  button.disabled = true;

  if (action === "edit") {
    const { data, error } = await client
      .from("ugc_posts")
      .select("*")
      .eq("id", id)
      .single();

    button.disabled = false;

    if (error || !data) {
      alert("Unable to load this UGC project.");
      return;
    }

    ugcId.value = data.id;
    ugcTitle.value = data.title || "";
    ugcDescription.value = data.description || "";
    ugcProjectUrl.value = data.project_url || "";
    ugcStatus.value = data.status || "published";

    ugcFormTitle.textContent = "Edit UGC Project";
    ugcSaveButton.textContent = "Update UGC Project";
    ugcCancelButton.hidden = false;

    ugcForm.scrollIntoView({
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
      .from("ugc_posts")
      .update({ status: newStatus })
      .eq("id", id);

    button.disabled = false;

    if (error) {
      console.error("UGC status error:", error);
      alert("Could not update UGC project status.");
      return;
    }

    await loadUGC();
  }
});


// Cancel UGC editing
ugcCancelButton.addEventListener(
  "click",
  resetUGCForm
);


