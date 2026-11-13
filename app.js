
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

  // Load published campaigns from Supabase
  loadCampaigns();

  console.log("The Grind app.js loaded successfully.");
});

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
