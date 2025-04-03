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
let stavPrihlaseni = null; //prijde/neprijde na trenink

const nazevTymu = document.getElementById("nazev-tymu");
const trainingDate = document.getElementById("training-date");
const trainingStartTime = document.getElementById("training-start-time");
const trainingEndTime = document.getElementById("training-end-time");

// Načtení dat
document.addEventListener("DOMContentLoaded", async () => {
  await checkUserRole();
  await getAttendacne();
  loadPlayers();

  // fixnout aby se stav dochazky hrace nacetl z db a nebylo tam vsude jen -

  const modal = document.getElementById("modal-potvrzeni-ucasti");

  const btAno = document.getElementById("bt-ucast-ano");
  const btNe = document.getElementById("bt-ucast-ne");

  async function getAttendacne() {
    const { data, error } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .select("Stavprihlaseni")
      .eq("UzivatelID", currentUserId);

    if (error) {
      console.error("Chyba při aktualizaci účasti: ", error);
    } else {
      stavPrihlaseni = data.Stavprihlaseni;
    }
  }

  //prepnuti stavu dochazky hrace na konkretni trenink
  btAno.addEventListener("click", async function () {
    modal.classList.add("hidden");

    const { data, error } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .update({ Stavprihlaseni: true })
      .select("Stavprihlaseni")
      .eq("UzivatelID", currentUserId);

    if (error) {
      console.error("Chyba při aktualizaci účasti: ", error);
    } else {
      stavPrihlaseni = data.Stavprihlaseni;
      loadPlayers();
    }
  });

  btNe.addEventListener("click", async function () {
    modal.classList.add("hidden");

    const { data, error } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .update({ Stavprihlaseni: false })
      .select("Stavprihlaseni")
      .eq("UzivatelID", currentUserId);

    if (error) {
      console.error("Chyba při aktualizaci účasti: ", error);
    } else {
      stavPrihlaseni = data.Stavprihlaseni;
      loadPlayers();
    }
  });
});

function editTraining() {
  const editTraining = document.querySelectorAll(".edit-training");

  editTraining.forEach((edit) => {
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
    console.log(userData.UzivatelID);

    isAdmin = userData.RoleuzivateluID === 1;
    isTrainer = userData.RoleuzivateluID === 2;

    // zobrazení obsahu podle role
    if (isAdmin) {
      editTraining();
      //document.getElementById('modal-potvrzeni-ucasti').classList.remove("hidden");
    } else if (isTrainer) {
      editTraining();
    } else {
      document
        .getElementById("modal-potvrzeni-ucasti")
        .classList.remove("hidden");
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
      .eq("TymID", tymID); //vybere uzivatele jenom z tymu, ve kterem je uzivatel prihlaseny

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
  const playerList = document.getElementById("player-list");

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  playerList.innerHTML = "";

  players.forEach((player) => {
    const li = document.createElement("li");
    li.className =
      "text-gray-700 p-2 border-b border-gray-200 flex justify-between items-center";

    // Zobrazení
    const playerNameSpan = document.createElement("span");
    playerNameSpan.textContent = player.Jmeno + " " + player.Prijmeni;
    li.appendChild(playerNameSpan);

    //znak prijdu/neprijdu pro kazdeho hrace z tymu

    const changeAttedndaceIcon = document.createElement("span");
    if (stavPrihlaseni === true) {
      changeAttedndaceIcon.innerHTML = "✔️";
      changeAttedndaceIcon.className =
        "text-green-500 hover:text-green-700 ml-2";
      li.appendChild(changeAttedndaceIcon);
    } else if (stavPrihlaseni === false) {
      changeAttedndaceIcon.innerHTML = "✖";
      changeAttedndaceIcon.className = "text-red-500 hover:text-red-700 ml-2";
      li.appendChild(changeAttedndaceIcon);
    } else {
      changeAttedndaceIcon.innerHTML = "–";
      changeAttedndaceIcon.className =
        "text-green-500 hover:text-green-700 ml-2";
      li.appendChild(changeAttedndaceIcon);
    }

    li.appendChild(changeAttedndaceIcon);
    playerList.appendChild(li);
  });

  // Pokud nejsou žádní hráči
  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "V týmu nejsou žádní hráči.";
    playerList.appendChild(li);
  }
}
