

document.addEventListener("DOMContentLoaded", () => {
  // Automatically update the copyright year
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Smooth navigation for section links
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

  // Load data from Supabase
  loadCampaigns();
  loadGiveaways();

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

// Load published campaigns from Supabase
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

// Load active and closed giveaways from Supabase
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
            <span class="badge">${status === "active" ? "Active" : "Closed"}</span>
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

