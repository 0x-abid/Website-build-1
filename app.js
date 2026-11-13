
document.addEventListener("DOMContentLoaded", () => {
  // Automatically update copyright year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Smooth navigation
  const navigationLinks = document.querySelectorAll(
    '.nav-links a[href^="#"]'
  );

  navigationLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  // Load website data
  loadCampaigns();
  loadGiveaways();
  setupUGCSubmission();
  loadUGC();

  console.log("The Grind app.js loaded successfully.");
});


// Escape HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[char];
  });
}


// Allow only HTTP and HTTPS links
function safeExternalURL(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch (error) {
    return null;
  }

  return null;
}


// Validate X post URL
function isValidXPostURL(value) {
  try {
    const url = new URL(value);

    const validHost = [
      "x.com",
      "www.x.com",
      "twitter.com",
      "www.twitter.com"
    ].includes(url.hostname.toLowerCase());

    const validPath = /^\/[^/]+\/status\/[0-9]+\/?$/.test(
      url.pathname
    );

    return (
      ["https:", "http:"].includes(url.protocol) &&
      validHost &&
      validPath
    );

  } catch (error) {
    return false;
  }
}


// Load published campaigns
async function loadCampaigns() {
  const campaignList = document.getElementById("campaign-list");

  if (!campaignList) return;

  const client = window.supabaseClient;

  if (!client) {
    campaignList.innerHTML =
      "<p>Unable to connect to the database. Please try again later.</p>";
    return;
  }

  campaignList.innerHTML = "<p>Loading campaigns...</p>";

  try {
    const { data, error } = await client
      .from("campaigns")
      .select("id, title, description, requirements, external_url, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      campaignList.innerHTML =
        "<p>No published campaigns available right now. Check back soon!</p>";
      return;
    }

    campaignList.innerHTML = data.map((campaign) => {
      const title = escapeHTML(campaign.title);
      const description = escapeHTML(campaign.description);
      const requirements = escapeHTML(campaign.requirements);
      const externalURL = safeExternalURL(campaign.external_url);

      return `
        <article class="card">
          <span class="badge">Published</span>
          <h3>${title}</h3>
          <p>${description}</p>

          ${
            requirements
              ? `<p><strong>Requirements:</strong><br>${requirements.replace(/\n/g, "<br>")}</p>`
              : ""
          }

          ${
            externalURL
              ? `<a
                  href="${escapeHTML(externalURL)}"
                  class="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >View Campaign</a>`
              : ""
          }
        </article>
      `;
    }).join("");

    console.log("Published campaigns loaded:", data.length);

  } catch (error) {
    console.error("Campaign loading error:", error);

    campaignList.innerHTML =
      "<p>Unable to load campaigns right now. Please refresh the page.</p>";
  }
}


// Load active and closed giveaways
async function loadGiveaways() {
  const activeList = document.getElementById("active-giveaway-list");
  const closedList = document.getElementById("closed-giveaway-list");

  if (!activeList || !closedList) return;

  const client = window.supabaseClient;

  if (!client) {
    activeList.innerHTML = "<p>Unable to connect to the database.</p>";
    closedList.innerHTML = "<p>Unable to connect to the database.</p>";
    return;
  }

  activeList.innerHTML = "<p>Loading active giveaways...</p>";
  closedList.innerHTML = "<p>Loading closed giveaways...</p>";

  try {
    const { data, error } = await client
      .from("giveaways")
      .select("id, title, description, reward, status, created_at")
      .in("status", ["active", "closed"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const activeGiveaways = (data || []).filter(
      (giveaway) => giveaway.status === "active"
    );

    const closedGiveaways = (data || []).filter(
      (giveaway) => giveaway.status === "closed"
    );

    function renderGiveaways(giveaways, status) {
      if (giveaways.length === 0) {
        return `<p>No ${status} giveaways available right now.</p>`;
      }

      return giveaways.map((giveaway) => {
        const title = escapeHTML(giveaway.title);
        const description = escapeHTML(giveaway.description);
        const reward = escapeHTML(giveaway.reward);

        return `
          <article class="card">
            <span class="badge">
              ${status === "active" ? "Active" : "Closed"}
            </span>

            <h3>${title}</h3>
            <p>${description}</p>
            <p><strong>Reward:</strong> ${reward}</p>
          </article>
        `;
      }).join("");
    }

    activeList.innerHTML = renderGiveaways(
      activeGiveaways,
      "active"
    );

    closedList.innerHTML = renderGiveaways(
      closedGiveaways,
      "closed"
    );

    console.log("Giveaways loaded:", data?.length || 0);

  } catch (error) {
    console.error("Giveaway loading error:", error);

    activeList.innerHTML =
      "<p>Unable to load active giveaways. Please refresh the page.</p>";

    closedList.innerHTML =
      "<p>Unable to load closed giveaways. Please refresh the page.</p>";
  }
}


// Load published UGC projects
async function loadUGC() {
  const ugcList = document.getElementById("ugc-project-list");

  if (!ugcList) return;

  const client = window.supabaseClient;

  if (!client) {
    ugcList.innerHTML =
      "<p>Unable to connect to the database. Please try again later.</p>";
    return;
  }

  ugcList.innerHTML = "<p>Loading UGC projects...</p>";

  try {
    const { data, error } = await client
      .from("ugc_posts")
      .select("id, title, description, project_url, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      ugcList.innerHTML =
        "<p>No UGC projects available right now. Check back soon!</p>";
      return;
    }

    ugcList.innerHTML = data.map((project) => {
      const id = escapeHTML(project.id);
      const title = escapeHTML(project.title);
      const description = escapeHTML(project.description);
      const projectURL = safeExternalURL(project.project_url);

      return `
        <article class="card">

          <span class="badge">UGC Opportunity</span>

          <h3>${title}</h3>

          <p>${description}</p>

          ${
            projectURL
              ? `<a
                  href="${escapeHTML(projectURL)}"
                  class="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >View Project</a>`
              : ""
          }

          <form
            class="ugc-submission-form"
            data-project-id="${id}"
          >

            <label for="ugc-link-${id}">
              Submit Your X Post
            </label>

            <input
              type="url"
              id="ugc-link-${id}"
              name="proof_url"
              placeholder="https://x.com/username/status/123456789"
              required
            >

            <button type="submit" class="btn">
              Submit Your Post
            </button>

            <p
              class="ugc-submission-message"
              role="status"
              aria-live="polite"
            ></p>

          </form>

        </article>
      `;
    }).join("");

    console.log("Published UGC projects loaded:", data.length);

  } catch (error) {
    console.error("UGC loading error:", error);

    ugcList.innerHTML =
      "<p>Unable to load UGC projects right now. Please refresh the page.</p>";
  }
}


// Set up UGC submission handler
function setupUGCSubmission() {
  const ugcList = document.getElementById("ugc-project-list");

  if (!ugcList) return;

  if (ugcList.dataset.submissionHandlerReady === "true") {
    return;
  }

  ugcList.dataset.submissionHandlerReady = "true";

  ugcList.addEventListener("submit", async (event) => {
    const form = event.target.closest(".ugc-submission-form");

    if (!form) return;

    event.preventDefault();

    // Use the separate public/anonymous Supabase client
    const client = window.supabaseAnonClient;

    const message = form.querySelector(
      ".ugc-submission-message"
    );

    const button = form.querySelector(
      'button[type="submit"]'
    );

    const input = form.querySelector(
      'input[name="proof_url"]'
    );

    if (!client) {
      message.textContent =
        "Public database connection unavailable. Please refresh the page.";
      console.error("supabaseAnonClient is missing.");
      return;
    }

    const projectId = form.dataset.projectId;
    const postURL = input.value.trim();

    if (!isValidXPostURL(postURL)) {
      message.textContent =
        "Please enter a valid X post URL.";
      return;
    }

    button.disabled = true;
    button.textContent = "Submitting...";
    message.textContent = "";

    try {
      const { error } = await client
        .from("submissions")
        .insert({
          submission_type: "ugc",
          ugc_post_id: projectId,
          proof_url: new URL(postURL).href,
          status: "pending"
        });

      if (error) throw error;

      message.textContent =
        "Your X post was submitted successfully! Status: Pending.";

      form.reset();

      console.log("UGC submission successful.");

    } catch (error) {
      console.error("UGC submission error:", error);

      message.textContent =
        "Error: " + (error.message || "Unknown database error");

    } finally {
      button.disabled = false;
      button.textContent = "Submit Your Post";
    }
  });
}
