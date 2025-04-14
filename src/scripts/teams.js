// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Globální proměnná pro uchování všech týmů a role uživatele
let allPlayers = [];
let isAdmin = false;
let isTrainer = false;

document.addEventListener("DOMContentLoaded", async () => {
  // Zjištění role přihlášeného uživatele
  await checkUserRole();
  loadTeams();
  setupSearch();
  setupAddTeamForm(); // Přidáno nastavení formuláře pro přidání týmu
  loadPicture();
});

// Funkce pro zjištění role uživatele
async function checkUserRole() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      alert("Uživatel není přihlášen!");
      window.location.href = "../pages/login.html";
      return;
    }

    const userEmail = session.user.email;
    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select("RoleuzivateluID")
      .eq("Email", userEmail)
      .single();
    //console.log(RoleuzivateluID);

    if (userError) {
      alert("Chyba při načítání role uživatele: " + userError.message);
      return;
    }

    isAdmin = userData.RoleuzivateluID === 1; // Nastavení isAdmin na true, pokud je RoleuzivateluID = 1

    // Skrytí/zobrazení formuláře pro přidání týmu podle role
    const addTeamForm = document.getElementById("addTeamForm");
    if (addTeamForm) {
      addTeamForm.style.display = isAdmin ? "block" : "none";
    }
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

async function loadPicture() {
  const profilePicture = document.querySelectorAll(".profile-picture");

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      alert("Uživatel není přihlášen!");
      window.location.href = "../pages/login.html";
      return;
    }

    const userEmail = session.user.email;

    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select(
        "UzivatelID, Jmeno, Prijmeni, Email, Telefon, TymID, AdresaID, profile_picture_url"
      )
      .eq("Email", userEmail)
      .single();

    if (userError) {
      alert("Chyba při načítání uživatelských dat: " + userError.message);
      return;
    }

    const defaultImage = "../assets/basic-profile.png";
    let profilePictureUrl = userData.profile_picture_url || defaultImage;
    if (userData.profile_picture_url) {
      const timestamp = new Date().getTime();
      profilePictureUrl = `${userData.profile_picture_url}?t=${timestamp}`;
    }
    console.log("Nastavovaná URL pro obrázek:", profilePictureUrl);
    profilePicture.forEach((img) => {
      img.src = profilePictureUrl;
    });
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Načtení týmů z databáze
async function loadTeams() {
  const teamList = document.getElementById("teamList");

  // Kontrola, zda element existuje
  if (!teamList) {
    console.error("Element s ID 'teamList' nebyl nalezen v HTML.");
    return;
  }

  try {
    const { data: teams, error } = await supabaseClient
      .from("Tym")
      .select("TymID, Nazevtymu"); // Načítáme TymID a Nazevtymu

    if (error) {
      alert("Chyba při načítání týmů: " + error.message);
      return;
    }

    allTeams = teams;
    displayTeams(allTeams);
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Funkce pro zobrazení týmů
function displayTeams(teams) {
  const teamList = document.getElementById("teamList");

  if (!teamList) {
    console.error("Element s ID 'teamList' nebyl nalezen v HTML.");
    return;
  }

  teamList.innerHTML = ""; // Vymazání stávajícího obsahu

  teams.forEach((team) => {
    const li = document.createElement("li");
    li.className =
      "dark:text-white p-2 border-b-2 dark:border-secondaryDark flex justify-between";

    // Zobrazení názvu týmu
    const teamNameSpan = document.createElement("span");
    teamNameSpan.textContent = team.Nazevtymu;
    li.appendChild(teamNameSpan);

    // Přidání křížku pro smazání, pouze pokud je uživatel admin
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "✖"; // Křížek
      deleteButton.className = "text-red-500 hover:text-red-700 ml-2";
      deleteButton.onclick = () => deleteTeam(team.TymID);
      li.appendChild(deleteButton);
    }

    teamList.appendChild(li);
  });

  // Pokud nejsou žádné týmy
  if (teams.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "Žádné týmy nebyly nalezeny.";
    teamList.appendChild(li);
  }
}

// Funkce pro smazání týmu
async function deleteTeam(teamId) {
  if (!confirm("Opravdu chcete smazat tento tým?")) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("Tym")
      .delete()
      .eq("TymID", teamId);

    if (error) {
      alert("Chyba při mazání týmu: " + error.message);
      return;
    }

    // Aktualizace seznamu týmů po smazání
    allTeams = allTeams.filter((team) => team.TymID !== teamId);
    displayTeams(allTeams);
    alert("Tým byl úspěšně smazán!");
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Nastavení formuláře pro přidání týmu
function setupAddTeamForm() {
  const addTeamForm = document.getElementById("addTeamForm");

  // Kontrola, zda formulář existuje
  if (!addTeamForm) {
    console.error("Element s ID 'addTeamForm' nebyl nalezen v HTML.");
    return;
  }

  addTeamForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Zabrání odeslání formuláře

    const teamNameInput = document.getElementById("teamNameInput");
    const teamName = teamNameInput.value.trim();

    if (!teamName) {
      alert("Název týmu nesmí být prázdný!");
      return;
    }

    try {
      const { data: newTeam, error } = await supabaseClient
        .from("Tym")
        .insert([{ Nazevtymu: teamName }])
        .select("TymID, Nazevtymu")
        .single();

      if (error) {
        alert("Chyba při přidávání týmu: " + error.message);
        return;
      }

      // Přidání nového týmu do seznamu
      allTeams.push(newTeam);
      displayTeams(allTeams);
      alert("Tým byl úspěšně přidán!");
      teamNameInput.value = ""; // Vyčištění pole po přidání
    } catch (error) {
      alert("Chyba: " + error.message);
    }
  });
}

// Nastavení vyhledávání
function setupSearch() {
  const searchInput = document.getElementById("teamSearch");

  // Kontrola, zda element existuje
  if (!searchInput) {
    console.error("Element s ID 'teamSearch' nebyl nalezen v HTML.");
    return;
  }

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredTeams = allTeams.filter((team) =>
      team.Nazevtymu.toLowerCase().includes(searchTerm)
    );
    displayTeams(filteredTeams);
  });
}
