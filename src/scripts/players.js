// Inicializace běžného Supabase klienta (pro operace s databází)
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Inicializace admin Supabase klienta (pouze pro autentizační operace)
const supabaseAdminClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTk1OTczOSwiZXhwIjoyMDU3NTM1NzM5fQ.BphGC223IbSeKa5_qqFTxVsPkwr0_3Ky5vLmX7usq_k"
);

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

// Načtení dat uživatele z localStorage
const storedUserData = JSON.parse(localStorage.getItem("userData"));
let currentUserRole = storedUserData?.RoleuzivateluID;
const currentUserId = storedUserData?.UzivatelID;
const currentTeam = storedUserData?.TymID;

// Globální proměnná pro uchování všech hráčů
let allPlayers = [];

document.addEventListener("DOMContentLoaded", async () => {
  await checkUserRole();
  loadPlayers();
  setupSearch();
  loadPicture();
});

// Funkce pro zjištění a aktualizaci role uživatele
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

    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, RoleuzivateluID")
      .eq("UzivatelID", currentUserId)
      .single();

    if (userError) {
      alert("Chyba při načítání role uživatele: " + userError.message);
      return;
    }

    if (userData.RoleuzivateluID !== storedUserData.RoleuzivateluID) {
      storedUserData.RoleuzivateluID = userData.RoleuzivateluID;
      localStorage.setItem("userData", JSON.stringify(storedUserData));
      currentUserRole = userData.RoleuzivateluID;
      console.log("Role uživatele byla aktualizována v localStorage.");
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

    let query = supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, Jmeno, Prijmeni, Email, TymID");

    // Admin vidí všechny hráče, trenér a hráč vidí pouze svůj tým
    if (currentUserRole === ROLE_ADMIN) {
      query = query.eq("RoleuzivateluID", ROLE_PLAYER);
    } else if (
      currentUserRole === ROLE_TRAINER ||
      currentUserRole === ROLE_PLAYER
    ) {
      query = query.eq("RoleuzivateluID", ROLE_PLAYER).eq("TymID", currentTeam);
    }

    const { data: players, error } = await query;

    if (error) {
      alert("Chyba při načítání hráčů: " + error.message);
      return;
    }

    allPlayers = players || [];
    displayPlayers(allPlayers);
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
    li.className =
      "dark:text-white p-2 border-b-2 border-secondaryLight dark:border-secondaryDark flex justify-between";

    const playerInfo = document.createElement("span");
    playerInfo.textContent = `${player.Jmeno} ${player.Prijmeni} (${
      player.Email || "Není uveden e-mail"
    })`;
    li.appendChild(playerInfo);

    // Přidání tlačítka pro smazání, pouze pokud je uživatel admin
    if (currentUserRole === ROLE_ADMIN) {
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "✖";
      deleteButton.className = "text-red-500 hover:text-red-700 ml-2";
      deleteButton.onclick = () =>
        deletePlayer(player.UzivatelID, player.Email);
      li.appendChild(deleteButton);
    }

    playersList.appendChild(li);
  });

  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "Žádní hráči nebyli nalezeni.";
    playersList.appendChild(li);
  }
}

// Funkce pro smazání hráče
async function deletePlayer(playerId, playerEmail) {
  if (!confirm("Opravdu chcete smazat tohoto hráče?")) {
    return;
  }

  try {
    // 1. Smazání závislých záznamů v tabulkách
    const { error: seznamError } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .delete()
      .eq("UzivatelID", playerId);

    if (seznamError) {
      alert(
        "Chyba při mazání záznamů v Seznamprihlasenychrezervacihracu: " +
          seznamError.message
      );
      return;
    }

    const { error: komentarError } = await supabaseClient
      .from("Komentare")
      .delete()
      .eq("UzivatelID", playerId);

    if (komentarError) {
      alert("Chyba při mazání záznamů v Komentare: " + komentarError.message);
      return;
    }

    const { error: rezervaceError } = await supabaseClient
      .from("Rezervacehaly")
      .delete()
      .eq("UzivatelID", playerId);

    if (rezervaceError) {
      alert(
        "Chyba při mazání záznamů v Rezervacehaly: " + rezervaceError.message
      );
      return;
    }

    // 2. Načtení AdresaID uživatele
    const { data: adresaData, error: adresaSelectError } = await supabaseClient
      .from("Uzivatel")
      .select("AdresaID")
      .eq("UzivatelID", playerId)
      .single();

    if (adresaSelectError) {
      alert(
        "Chyba při načítání adresy uživatele: " + adresaSelectError.message
      );
      return;
    }

    const adresaId = adresaData.AdresaID;

    // 3. Smazání uživatele z tabulky Uzivatel (tím se zruší vazba na adresu)
    const { error: userDeleteError } = await supabaseClient
      .from("Uzivatel")
      .delete()
      .eq("UzivatelID", playerId);

    if (userDeleteError) {
      alert(
        "Chyba při mazání uživatele z tabulky Uzivatel: " +
          userDeleteError.message
      );
      return;
    }

    // 4. Smazání adresy, pokud existuje a není používána jiným uživatelem
    if (adresaId) {
      const { data: adresaUsage, error: adresaUsageError } =
        await supabaseClient
          .from("Uzivatel")
          .select("UzivatelID")
          .eq("AdresaID", adresaId);

      if (adresaUsageError) {
        alert("Chyba při kontrole použití adresy: " + adresaUsageError.message);
        return;
      }

      if (adresaUsage.length === 0) {
        const { error: adresaDeleteError } = await supabaseClient
          .from("Adresa")
          .delete()
          .eq("AdresaID", adresaId);

        if (adresaDeleteError) {
          alert(
            "Chyba při mazání adresy uživatele: " + adresaDeleteError.message
          );
          return;
        }
      }
    }

    // 5. Získání UID uživatele z autentizace podle e-mailu
    const { data: authUsers, error: authError } =
      await supabaseAdminClient.auth.admin.listUsers();

    if (authError) {
      alert("Chyba při načítání uživatelů z autentizace: " + authError.message);
      return;
    }

    const userToDelete = authUsers.users.find(
      (user) => user.email === playerEmail
    );

    if (!userToDelete) {
      alert("Uživatel nebyl nalezen v autentizaci.");
      return;
    }

    const userUid = userToDelete.id;

    // 6. Smazání uživatele z autentizace Supabase
    const { error: deleteAuthError } =
      await supabaseAdminClient.auth.admin.deleteUser(userUid);

    if (deleteAuthError) {
      alert(
        "Chyba při mazání uživatele z autentizace: " + deleteAuthError.message
      );
      return;
    }

    // Aktualizace seznamu hráčů po smazání
    allPlayers = allPlayers.filter((player) => player.UzivatelID !== playerId);
    displayPlayers(allPlayers);
    alert("Hráč byl úspěšně smazán!");
  } catch (error) {
    alert("Chyba: " + error.message);
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
