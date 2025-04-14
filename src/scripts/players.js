// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Globální proměnná pro uchování všech hráčů
let allPlayers = [];

document.addEventListener("DOMContentLoaded", () => {
  loadPlayers();
  setupSearch();
  loadPicture();
});

// Načtení hráčů z databáze
async function loadPlayers() {
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

    const { data: players, error } = await supabaseClient
      .from("Uzivatel")
      .select("Jmeno, Prijmeni, Email") // Přidáme Email
      .eq("RoleuzivateluID", 3); // Filtrování hráčů s RoleUzivateleID = 3

    if (error) {
      alert("Chyba při načítání hráčů: " + error.message);
      return;
    }

    allPlayers = players;
    displayPlayers(allPlayers);
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

// Funkce pro zobrazení hráčů
function displayPlayers(players) {
  const playersList = document.getElementById("playersList");

  if (!playersList) {
    console.error("Element s ID 'playersList' nebyl nalezen v HTML.");
    return;
  }

  playersList.innerHTML = "";

  players.forEach((player) => {
    const li = document.createElement("li");
    li.className = "dark:text-white p-2 border-b-2 dark:border-secondaryDark";
    // Zobrazení jména, příjmení a e-mailu
    li.textContent = `${player.Jmeno} ${player.Prijmeni} (${
      player.Email || "Není uveden e-mail"
    })`;
    playersList.appendChild(li);
  });

  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "Žádní hráči nebyli nalezeni.";
    playersList.appendChild(li);
  }
}

// Nastavení vyhledávání
function setupSearch() {
  const searchInput = document.getElementById("playersSearch");

  if (!searchInput) {
    console.error("Element s ID 'playersSearch' nebyl nalezen v HTML.");
    return;
  }

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredPlayers = allPlayers.filter((player) => {
      const fullName = `${player.Jmeno} ${player.Prijmeni}`.toLowerCase();
      const email = player.Email?.toLowerCase() || "";
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
    displayPlayers(filteredPlayers);
  });
}
