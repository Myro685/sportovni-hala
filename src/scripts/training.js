
// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
    "https://xpxurtdkmufuemamajzl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
  );

let allPlayers = [];
  let isAdmin = false;
  let isTrainer = false;

// Načtení dat
document.addEventListener("DOMContentLoaded", async () =>{
  await checkUserRole(),
  loadPlayers()
});

// Funkce pro zjištění role uživatele
async function checkUserRole() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      //alert("Uživatel není přihlášen!");
      return;
    } 

    const userEmail = session.user.email;
    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select("RoleuzivateluID")
      .eq("Email", userEmail)
      .single();

    if (userError) {
      alert("Chyba při načítání role uživatele: " + userError.message);
      return;
    }

    isAdmin = userData.RoleuzivateluID === 1; // Nastavení isAdmin na true, pokud je RoleuzivateluID = 1
    isTrainer = userData.RoleuzivateluID === 2;
    
    // zobrazení obsahu podle role
    

   
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

 async function loadPlayers(players) {
  const playerList = document.getElementById("player-list");

  // Kontrola, zda element existuje
  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  try {
    const { data: players, error } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, Jmeno, Prijmeni"); //Načtení hráče
      console.log(players);
      
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


function displayPlayers(players) {
  //console.log(players);
  const playerList = document.getElementById("player-list");

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  playerList.innerHTML = ""; // Vymazání stávajícího obsahu

  players.forEach((player) => {
    const li = document.createElement("li");
    li.className =
      "text-gray-700 p-2 border-b border-gray-200 flex justify-between items-center";

    // Zobrazení
    const playerNameSpan = document.createElement("span");
    playerNameSpan.textContent = player.Jmeno +" "+  player.Prijmeni;
    li.appendChild(playerNameSpan);
    console.log(playerNameSpan);
    

    

    // Přidání tlačítka pro změnu docházky, pouze pokud je uživatel admin
    if (isAdmin) {
      const changeAttedndaceButton = document.createElement("button");
      changeAttedndaceButton.innerHTML = "✖"; // Křížek
      changeAttedndaceButton.className = "text-red-500 hover:text-red-700 ml-2";
      changeAttedndaceButton.onclick = () => changeAttedndace();
      li.appendChild(changeAttedndaceButton);
    }

    playerList.appendChild(li);
  });

  // Pokud nejsou žádní hráči 
  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "Dosud žádný hráč účast nepotvrdil.";
    playerList.appendChild(li);
  }
}