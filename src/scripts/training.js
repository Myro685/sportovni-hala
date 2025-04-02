
// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
    "https://xpxurtdkmufuemamajzl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
  );

  let allPlayers = [];
  let isAdmin = false;
  let isTrainer = false;
  let tymID = 0;
  

  const nazevTymu = document.getElementById("nazev-tymu");
  const trainingDate = document.getElementById("training-date");
  const trainingStartTime = document.getElementById("training-start-time");
  const trainingEndTime = document.getElementById("training-end-time");

// Načtení dat
document.addEventListener("DOMContentLoaded", async () =>{
  await checkUserRole();
  loadPlayers();


  const modal = document.getElementById("modal-potvrzeni-ucasti");
  
  const btAno = document.getElementById("bt-ucast-ano");
  const btNe = document.getElementById("bt-ucast-ne");


  btAno.addEventListener("click", function() {
    console.log("Uživatel potvrdil účast");
    modal.classList.add('hidden');
    //pořešit v DB
  });

  btNe.addEventListener("click", function() {
    console.log("Uživatel potvrdil NEúčast");
    modal.classList.add('hidden');
    //pořešit v DB
  });
});


function editTraining() {
  const editTraining = document.querySelectorAll('.edit-training');

  editTraining.forEach(edit => {
    edit.disabled = false;
  });

  //poslat změněná data do databaze

}

async function setUserData() {
  const { data: userData, error: userError } = await supabaseClient
      .from("Tym")
      .select("Nazevtymu")
      .eq("TymID", tymID)
      .single();
      console.log(userData);
      
      nazevTymu.innerHTML = userData.Nazevtymu;
}

// Funkce pro zjištění role uživatele
async function checkUserRole() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      alert("Uživatel není přihlášen!");
     return;
    } 

    const userEmail = session.user.email;
    const { data: userData, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select("RoleuzivateluID, TymID")
      .eq("Email", userEmail)
      .single();

    if (userError) {
      alert("Chyba při načítání role uživatele: " + userError.message);
      return;
    }

    tymID = userData.TymID;
    console.log(tymID);

    setUserData();


    isAdmin = userData.RoleuzivateluID === 1; // Nastavení isAdmin na true, pokud je RoleuzivateluID = 1
    isTrainer = userData.RoleuzivateluID === 2;
    
    // zobrazení obsahu podle role
    
    if (isAdmin) {
      editTraining();
      //document.getElementById('modal-potvrzeni-ucasti').classList.remove("hidden");

    }
    else if (isTrainer) {
      editTraining();

    } else  {
      document.getElementById('modal-potvrzeni-ucasti').classList.remove("hidden");
    }
    


   
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
    //console.log(playerNameSpan);
    

    

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