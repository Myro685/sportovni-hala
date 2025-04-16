const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

// Načtení dat uživatele z localStorage
const storedUserData = JSON.parse(localStorage.getItem("userData"));
let currentUserRole = storedUserData?.RoleuzivateluID;
const currentUserId = storedUserData?.UzivatelID;

// Globální proměnná pro uchování všech týmů
let allTeams = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Kontrola a aktualizace role uživatele
  await loadTeams();
  await setupSearch();
  await setupAddTeamForm();
  await loadPicture();
});

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

    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select(
        "UzivatelID, Jmeno, Prijmeni, Email, Telefon, TymID, AdresaID, profile_picture_url"
      )
      .eq("UzivatelID", currentUserId)
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

  if (!teamList) {
    console.error("Element s ID 'teamList' nebyl nalezen v HTML.");
    return;
  }

  try {
    const { data: teams, error } = await supabaseClient
      .from("Tym")
      .select("TymID, Nazevtymu");

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

  teamList.innerHTML = "";

  teams.forEach((team) => {
    const li = document.createElement("li");
    li.className =
      "dark:text-white p-2 border-b-2 border-secondaryLight dark:border-secondaryDark flex justify-between";

    const teamNameSpan = document.createElement("span");
    teamNameSpan.textContent = team.Nazevtymu;
    li.appendChild(teamNameSpan);

    // Přidání křížku pro smazání, pouze pokud je uživatel admin
    if (currentUserRole === ROLE_ADMIN) {
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "✖";
      deleteButton.className = "text-red-500 hover:text-red-700 ml-2";
      deleteButton.onclick = () => deleteTeam(team.TymID);
      li.appendChild(deleteButton);
    }

    teamList.appendChild(li);
  });

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

  if (!addTeamForm) {
    console.error("Element s ID 'addTeamForm' nebyl nalezen v HTML.");
    return;
  }

  addTeamForm.addEventListener("submit", async (event) => {
    event.preventDefault();

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

      allTeams.push(newTeam);
      displayTeams(allTeams);
      alert("Tým byl úspěšně přidán!");
      teamNameInput.value = "";
    } catch (error) {
      alert("Chyba: " + error.message);
    }
  });
}

// Nastavení vyhledávání
function setupSearch() {
  const searchInput = document.getElementById("teamSearch");

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
