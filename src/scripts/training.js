
// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

//globalni promenne
let allPlayers = [];
let isAdmin = false;
let isTrainer = false;
let tymID = 0;
let currentUserId = null;
let isEditing = false; 


const nazevTymu = document.getElementById("nazev-tymu");
//const trainingDate = document.getElementById("training-date");
//const trainingStartTime = document.getElementById("training-start-time");
//const trainingEndTime = document.getElementById("training-end-time");
const btEditTraining = document.getElementById('bt-edit-training');
const titleMyAttendance = document.getElementById('title-my-attendace');
const spanCurrentUserAttendace = document.getElementById('span-current-user-attendance');

// Načtení dat
document.addEventListener("DOMContentLoaded", async () =>{
await checkUserRole();
await getAttendance(currentUserId); //currentUserId nastavuju v checkUserRole()
loadPlayers();


const modal = document.getElementById("modal-potvrzeni-ucasti");

const btAno = document.getElementById("bt-ucast-ano");
const btNe = document.getElementById("bt-ucast-ne");


//prepnuti stavu dochazky hrace na konkretni trenink
btAno.addEventListener("click", async function() {
  modal.classList.add('hidden');

  const { data, error } = await supabaseClient
  .from("Seznamprihlasenychrezervacihracu")
  .update({Stavprihlaseni: true})
  .select("Stavprihlaseni")
  .eq("UzivatelID", currentUserId ); 

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    stavPrihlaseni = data[0].Stavprihlaseni;
    loadPlayers();
  }

});

btNe.addEventListener("click", async function() {
  modal.classList.add('hidden');

  const { data, error } = await supabaseClient
  .from("Seznamprihlasenychrezervacihracu")
  .update({Stavprihlaseni: false})
  .select("Stavprihlaseni")
  .eq("UzivatelID", currentUserId ); 

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    stavPrihlaseni = data[0].Stavprihlaseni;
    loadPlayers();
  }
});
});

  // tahá data z DB a vraci stavPrihlasení uživatele na trénink 
async function getAttendance(userId) {
  const { data, error } = await supabaseClient
  .from("Seznamprihlasenychrezervacihracu")
  .select("Stavprihlaseni")
  .eq("UzivatelID", userId ); 

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    const stavPrihlaseni = data[0].Stavprihlaseni;
    return stavPrihlaseni;
  }
}


//ulozi hodnoty z inputu do DB
async function saveChanges() {
  const trainingDateInput = document.getElementById("training-date");
  const trainingStartTimeInput = document.getElementById("training-start-time");
  const trainingEndTimeInput = document.getElementById("training-end-time");
  const rezervaceHalyId = 2; // dodelat aby to bylo dynamicky

  const trainingDate = trainingDateInput.value; 
  const trainingStartTime = trainingStartTimeInput.value;
  const trainingEndTime = trainingEndTimeInput.value;
  
  const { error } = await supabaseClient
    .from("Rezervacehaly")
    .update({
      Datumrezervace: trainingDate,
      Zacatekrezervace: trainingStartTime,
      Konecrezervace: trainingEndTime
    })
    .eq("RezervacehalyID", rezervaceHalyId);

  if (error) {
    console.error("Chyba při aktualizaci rezervace haly:", error);
    return error;
  } else {
    console.log("Trénink byl upraven");
    return null;
  }
}

async function setUserData() {
const { data: userData, error: userError } = await supabaseClient
    .from("Tym")
    .select("Nazevtymu")
    .eq("TymID", tymID)
    .single();
    
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
    .select("RoleuzivateluID, UzivatelID, TymID")
    .eq("Email", userEmail)
    .single();

  if (userError) {
    alert("Chyba při načítání role uživatele: " + userError.message);
    return;
  }

  currentUserId = userData.UzivatelID;
  
  tymID = userData.TymID;

  setUserData();
    

  isAdmin = userData.RoleuzivateluID === 1; 
  isTrainer = userData.RoleuzivateluID === 2;
  
  // zobrazení obsahu podle role
  if (isAdmin) {
    btEditTraining.classList.remove('hidden');
  }
  else if (isTrainer) {
    btEditTraining.classList.remove('hidden');
  } else  {
    //modal se zobrazi pouze pokud uzivatel zadnou reakci nema
    //pridat tlacitko pro zmenu reakce
    if (getAttendance(currentUserId) === null) {
      document.getElementById('modal-potvrzeni-ucasti').classList.remove("hidden");
    } else {
      titleMyAttendance.classList.remove('hidden');
      spanCurrentUserAttendace.classList.remove('hidden');
    }
  }
 
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}


async function loadPlayers() {
  const playerList = document.getElementById("player-list");

  // Kontrola, zda element existuje
  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  try {
   
     const { data: players, error } = await supabaseClient
    .from("Uzivatel")
    .select("UzivatelID, Jmeno, Prijmeni, TymID") //Načtení hráče
    .eq("TymID", tymID) //vybere uzivatele jenom z tymu, ve kterem je uzivatel prihlaseny
    
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


async function displayPlayers(players) {
  const playerList = document.getElementById("player-list");

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  playerList.innerHTML = ""; 

  for (const player of players) {
    const li = document.createElement("li");
    li.className =
      "text-gray-700 p-2 border-b border-gray-200 flex justify-between items-center";

    // Zobrazení
    const playerNameSpan = document.createElement("span");
    playerNameSpan.textContent = player.Jmeno +" "+  player.Prijmeni;
    li.appendChild(playerNameSpan);
    

    let changeAttedndaceIcon = document.createElement("span");

    // u kazdeho hrace zjistime jeho stav prihlaseni pomoci getAttendace
    const stavPrihlaseni = await getAttendance(player.UzivatelID);

    

    if (stavPrihlaseni === true) {
      changeAttedndaceIcon.innerHTML = "ANO";
      changeAttedndaceIcon.className = "font-bold text-green-500 ml-2";
      
    } else if (stavPrihlaseni === false) {
      changeAttedndaceIcon.innerHTML = "NE";
      changeAttedndaceIcon.className = "font-bold text-red-500 ml-2";
    } else {
      changeAttedndaceIcon.innerHTML = "–";
      changeAttedndaceIcon.className = "font-bold text-gray-500 ml-2";
    }
    
    li.appendChild(changeAttedndaceIcon);
    playerList.appendChild(li);
  };

  // Pokud nejsou žádní hráči 
  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "V týmu nejsou žádní hráči.";
    playerList.appendChild(li);
  }
}

btEditTraining.addEventListener('click', async function() {
  if (!isEditing) {
    isEditing = true;

    document.querySelectorAll('.edit-training').forEach(input => input.disabled = false);

    btEditTraining.textContent = "Uložit změny";
    btEditTraining.classList.remove("bg-cyan-500", "hover:bg-cyan-600");
    btEditTraining.classList.add("bg-red-500", "hover:bg-red-600");

  } else {
    const error = await saveChanges();
    if (!error) {
      document.querySelectorAll('.edit-training').forEach(input => input.disabled = true);
      btEditTraining.textContent = "✏️ Upravit trénink";

      btEditTraining.classList.remove("bg-red-500", "hover:bg-red-600");
      btEditTraining.classList.add("bg-cyan-500", "hover:bg-cyan-600");
      isEditing = false;
    } else {
      console.error("Chyba při ukládání změn");
    }
  }
});