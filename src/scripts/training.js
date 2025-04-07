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
const rezervaceHalyId = 2; // dodelat aby to bylo dynamicky
let currentUserAttendance;

const nazevTymu = document.getElementById("nazev-tymu");
//const trainingDate = document.getElementById("training-date");
//const trainingStartTime = document.getElementById("training-start-time");
//const trainingEndTime = document.getElementById("training-end-time");
const btEditTraining = document.getElementById("bt-edit-training");
const titleMyAttendance = document.getElementById("title-my-attendance");
const spanCurrentUserAttendance = document.getElementById(
  "span-current-user-attendance"
);
const spanTrainigDataTrainer = document.getElementById("training-data-trainer");
const btChangeAttendance = document.getElementById("bt-change-attendance");

const modalPotvrzeniUcasti = document.getElementById("modal-potvrzeni-ucasti");
const btAno = document.getElementById("bt-ucast-ano");
const btNe = document.getElementById("bt-ucast-ne");

// Načtení dat
document.addEventListener("DOMContentLoaded", async () => {
  await checkUserRole();

  currentUserAttendance = await getAttendance(currentUserId); //currentUserId nastavuju v checkUserRole()

  if (currentUserAttendance === null) {
    modalPotvrzeniUcasti.classList.remove("hidden");
    btChangeAttendance.classList.add("hidden");
  } else {
    btChangeAttendance.classList.remove("hidden");
    modalPotvrzeniUcasti.classList.add("hidden");
  }
  await changeMyAttendance(currentUserAttendance);
  await setTrainingData();
  await loadPlayers(); //opravit load players
});

async function changeMyAttendance(attendance) {
  // prepne se mi to v db, ale nezmizi modal

  const { data, error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .update({ Stavprihlaseni: attendance })
    .select("Stavprihlaseni")
    .eq("UzivatelID", currentUserId);

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    if (attendance === true) {
      spanCurrentUserAttendance.innerHTML = "ANO";
      spanCurrentUserAttendance.className = "font-bold text-green-500 ml-2";
      modalPotvrzeniUcasti.classList.add("hidden");
      btChangeAttendance.classList.remove("hidden");
    } else if (attendance === false) {
      spanCurrentUserAttendance.innerHTML = "NE";
      spanCurrentUserAttendance.className = "font-bold text-red-500 ml-2";
      modalPotvrzeniUcasti.classList.add("hidden");
      btChangeAttendance.classList.remove("hidden");
    } else {
      spanCurrentUserAttendance.innerHTML = "-";
      spanCurrentUserAttendance.className = "font-bold text-gray-500 ml-2";
    }
  }
}

async function rejectAttendance() {
  changeMyAttendance(false);

  modalPotvrzeniUcasti.classList.add("hidden");
  modalPotvrzeniUcasti.classList.add("hidden");
  btChangeAttendance.classList.remove("hidden");
}

async function acceptAttendance() {
  changeMyAttendance(true);

  modalPotvrzeniUcasti.classList.add("hidden");
  stavPrihlaseni = data[0].Stavprihlaseni;
  btChangeAttendance.classList.remove("hidden");
  //loadPlayers();
}

// tahá data z DB a vraci stavPrihlasení uživatele na trénink
async function getAttendance(userId) {
  const { data, error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .select("Stavprihlaseni")
    .eq("UzivatelID", userId);

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    const stavPrihlaseni = data[0].Stavprihlaseni;
    return stavPrihlaseni;
  }
}

//nacte data uzivatele podle jeho id
async function getUserData(userId) {
  const { data: userData, error: error } = await supabaseClient
    .from("Uzivatel")
    .select("UzivatelID, Jmeno, Prijmeni, TymID")
    .eq("UzivatelID", userId)
    .single();

  if (error) {
    console.error("Chyba při načítání hráče:", error);
    return;
  }
  return userData;
}

//nacte data o tymu
async function getTeamData(teamId) {
  // Dotaz na tabulku "Tym"
  const { data: teamData, error: teamError } = await supabaseClient
    .from("Tym")
    .select("Nazevtymu")
    .eq("TymID", teamId)
    .single();

  if (teamError) {
    console.error("Chyba při načítání týmu:", teamError);
    return;
  }
  return teamData;
}

//nacte data o rezervai haly (eventu co se v hale kona)
async function getHallReservationData(hallId) {
  // Dotaz na tabulku "Rezervacehaly"
  const { data: RezervacehalyData, error: RezervacehalyError } =
    await supabaseClient
      .from("Rezervacehaly")
      .select("UzivatelID, Datumrezervace, Konecrezervace, Zacatekrezervace")
      .eq("RezervacehalyID", hallId)
      .single();

  if (RezervacehalyError) {
    console.error("Chyba při načítání týmu:", RezervacehalyError);
    return;
  }
  return RezervacehalyData;
}

//ulozi hodnoty z inputu do DB
async function saveTrainingChanges() {
  const trainingDateInput = document.getElementById("training-date");
  const trainingStartTimeInput = document.getElementById("training-start-time");
  const trainingEndTimeInput = document.getElementById("training-end-time");

  const trainingDate = trainingDateInput.value;
  const trainingStartTime = trainingStartTimeInput.value;
  const trainingEndTime = trainingEndTimeInput.value;

  const { error } = await supabaseClient
    .from("Rezervacehaly")
    .update({
      Datumrezervace: trainingDate,
      Zacatekrezervace: trainingStartTime,
      Konecrezervace: trainingEndTime,
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

async function setTrainingData() {
  const teamData = await getTeamData(tymID);
  nazevTymu.innerHTML = teamData.Nazevtymu;

  const hallRezervationData = await getHallReservationData(rezervaceHalyId);
  const trainer = await getUserData(hallRezervationData.UzivatelID);

  spanTrainigDataTrainer.textContent = trainer.Jmeno + " " + trainer.Prijmeni;

  const trainingDateInput = document.getElementById("training-date");
  const trainingStartTimeInput = document.getElementById("training-start-time");
  const trainingEndTimeInput = document.getElementById("training-end-time");

  trainingDateInput.value = hallRezervationData.Datumrezervace;
  trainingStartTimeInput.value = hallRezervationData.Zacatekrezervace;
  trainingEndTimeInput.value = hallRezervationData.Konecrezervace;
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
      window.location.href = "../pages/login.html";
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

    setTrainingData();

    isAdmin = userData.RoleuzivateluID === 1;
    isTrainer = userData.RoleuzivateluID === 2;

    // zobrazení obsahu podle role
    if (isAdmin) {
      btEditTraining.classList.remove("hidden");
    } else if (isTrainer) {
      btEditTraining.classList.remove("hidden");
    } else {
      //modal se zobrazi pouze pokud uzivatel zadnou reakci nema
      //pridat tlacitko pro zmenu reakce
      if (getAttendance(currentUserId) === null) {
        document
          .getElementById("modal-potvrzeni-ucasti")
          .classList.remove("hidden");
      } else {
        titleMyAttendance.classList.remove("hidden");
        spanCurrentUserAttendance.classList.remove("hidden");
      }
    }
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

//nacte z db seznam hracu, jejich tymID je stejny jako id prihlaseneho uzivatele, vypise pouze uzivatele s idRole 3 (hrac)
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
      .select("UzivatelID, Jmeno, Prijmeni, TymID")
      .eq("TymID", tymID)
      .eq("RoleuzivateluID", 3); //seznam ucasti na treninku vypise pouze hrace (role = 3)

    if (error) {
      alert("Chyba při načítání hráčů: " + error.message);
      return;
    }

    allPlayers = players;
    //odstrani currentUserID z allPlayers, protoze ho zobrazuji v Moje ucast

    displayPlayers(allPlayers);
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

async function displayPlayers(players) {
  const playerList = document.getElementById("player-list");
  players = players.filter((player) => player.UzivatelID !== currentUserId);

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  playerList.innerHTML = "";

  const playersWithAttendance = [];

  // Získání stavu přihlášení pro každého hráče
  for (const player of players) {
    const stavPrihlaseni = await getAttendance(player.UzivatelID);
    playersWithAttendance.push({
      ...player,
      stavPrihlaseni: stavPrihlaseni,
    });
  }

  // Seřazení hráčů: true → false → null
  playersWithAttendance.sort((a, b) => {
    const getOrder = (stav) => {
      if (stav === true) return 0;
      if (stav === false) return 1;
      return 2;
    };
    return getOrder(a.stavPrihlaseni) - getOrder(b.stavPrihlaseni);
  });

  // Zobrazení hráčů
  for (const player of playersWithAttendance) {
    const li = document.createElement("li");
    li.className =
      "text-gray-700 p-2 border-b border-gray-200 flex justify-between items-center";

    const playerNameSpan = document.createElement("span");
    playerNameSpan.textContent = player.Jmeno + " " + player.Prijmeni;
    li.appendChild(playerNameSpan);

    const attendanceSpan = document.createElement("span");

    if (player.stavPrihlaseni === true) {
      attendanceSpan.textContent = "ANO";
      attendanceSpan.className = "font-bold text-green-500 ml-2";
    } else if (player.stavPrihlaseni === false) {
      attendanceSpan.textContent = "NE";
      attendanceSpan.className = "font-bold text-red-500 ml-2";
    } else {
      attendanceSpan.textContent = "–";
      attendanceSpan.className = "font-bold text-gray-500 ml-2";
    }

    li.appendChild(attendanceSpan);
    playerList.appendChild(li);
  }

  if (playersWithAttendance.length === 0) {
    const li = document.createElement("li");
    li.className = "text-gray-500 p-2";
    li.textContent = "V týmu nejsou žádní hráči.";
    playerList.appendChild(li);
  }
}

// anonymni funcke pro změnu docházky po kliknutí na tlačítko
btChangeAttendance.addEventListener("click", async () => {
  const novyStav = !currentUserAttendance;

  const potvrzeni = confirm(
    `Opravdu chcete změnit svoji docházku na trénink na: ${
      novyStav ? "ANO" : "NE"
    }?`
  );

  if (potvrzeni) {
    currentUserAttendance = novyStav;
    await changeMyAttendance(currentUserAttendance);
  }
});

btAno.addEventListener("click", () => changeMyAttendance(true));
btNe.addEventListener("click", () => changeMyAttendance(false));

btEditTraining.addEventListener("click", async function () {
  if (!isEditing) {
    isEditing = true;

    document
      .querySelectorAll(".edit-training")
      .forEach((input) => (input.disabled = false));

    btEditTraining.textContent = "Uložit změny";
    btEditTraining.classList.remove("bg-cyan-500", "hover:bg-cyan-600");
    btEditTraining.classList.add("bg-red-500", "hover:bg-red-600");
  } else {
    const error = await saveTrainingChanges();
    if (!error) {
      document
        .querySelectorAll(".edit-training")
        .forEach((input) => (input.disabled = true));
      btEditTraining.textContent = "✏️ Upravit trénink";

      btEditTraining.classList.remove("bg-red-500", "hover:bg-red-600");
      btEditTraining.classList.add("bg-cyan-500", "hover:bg-cyan-600");
      isEditing = false;
    } else {
      console.error("Chyba při ukládání změn");
    }
  }
});
