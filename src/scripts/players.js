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
      .select("Jmeno, Prijmeni") // Načítáme pouze Jmeno a Prijmeni
      .eq("RoleuzivateluID", 3); // Filtrování hráčů s RoleUzivateleID = 3

    if (error) {
      alert("Chyba při načítání hráčů: " + error.message);
      return;
    }

    allPlayers = players; // Uložení hráčů do globální proměnné
    displayPlayers(allPlayers);
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Funkce pro zobrazení hráčů
function displayPlayers(players) {
  const playersList = document.getElementById("playersList");

  // Kontrola, zda element existuje
  if (!playersList) {
    console.error("Element s ID 'playersList' nebyl nalezen v HTML.");
    return;
  }

  playersList.innerHTML = ""; // Vymazání stávajícího obsahu

  players.forEach((player) => {
    const li = document.createElement("li");
    li.className = "text-gray-700 p-2 border-b border-gray-200";
    // Zobrazení jména a příjmení
    li.textContent = `${player.Jmeno} ${player.Prijmeni}`;
    playersList.appendChild(li);
  });

  // Pokud nejsou žádní hráči
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

  // Kontrola, zda element existuje
  if (!searchInput) {
    console.error("Element s ID 'playersSearch' nebyl nalezen v HTML.");
    return;
  }

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredPlayers = allPlayers.filter((player) => {
      const fullName = `${player.Jmeno} ${player.Prijmeni}`.toLowerCase(); // Kombinace Jmeno a Prijmeni
      return fullName.includes(searchTerm);
    });
    displayPlayers(filteredPlayers);
  });
}
