// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

// načte data o přihlašeném uživateli, ktere jsme uložili do LS
const userData = JSON.parse(localStorage.getItem("userData"));
const currentUserRole = userData.RoleuzivateluID;
const currentUserId = userData.UzivatelID;
const currentTeam = userData.TymID;

// Globální proměnné
let allPlayers = [];
let isEditing = false;
let currentUserAttendance;
let reservationId = null;

const nazevTymu = document.getElementById("nazev-tymu");
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
  const params = new URLSearchParams(window.location.search);
  const trainingId = params.get("id");
  reservationId = trainingId;

  if (currentUserRole === ROLE_ADMIN) {
    btEditTraining.classList.remove("hidden");
  } else if (currentUserRole === ROLE_TRAINER) {
    btEditTraining.classList.remove("hidden");
  } else if (currentUserRole == ROLE_PLAYER) {
    titleMyAttendance.classList.remove("hidden");
    spanCurrentUserAttendance.classList.remove("hidden");
    currentUserAttendance = await getAttendance(currentUserId, reservationId);
  } else {
  }

  if (currentUserAttendance === null) {
    modalPotvrzeniUcasti.classList.remove("hidden");
    btChangeAttendance.classList.add("hidden");
  } else {
    btChangeAttendance.classList.remove("hidden");
    modalPotvrzeniUcasti.classList.add("hidden");
  }

  await changeMyAttendance(currentUserAttendance);
  await setTrainingData(reservationId);
  await loadPlayers();
  loadPicture();
  await loadComments(reservationId); // Přidáváme načítání komentářů
});

// Funkce pro načtení komentářů k dané rezervaci
async function loadComments(rezervaceId) {
  // Načteme komentáře bez relace
  const { data: comments, error: commentError } = await supabaseClient
    .from("Komentare")
    .select("Text, UzivatelID")
    .eq("RezervacehalyID", rezervaceId);

  if (commentError) {
    console.error("Chyba při načítání komentářů:", commentError);
    alert("Nepodařilo se načíst komentáře: " + commentError.message);
    return;
  }

  const commentList = document.getElementById("comment-list");
  commentList.innerHTML = ""; // Vyčistíme seznam

  if (comments.length === 0) {
    const li = document.createElement("li");
    li.className = "dark:text-white p-2";
    li.textContent = "Zatím žádné komentáře.";
    commentList.appendChild(li);
  } else {
    // Načteme jména uživatelů
    const userIds = comments.map((comment) => comment.UzivatelID);
    const { data: users, error: userError } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, Jmeno")
      .in("UzivatelID", userIds);

    if (userError) {
      console.error("Chyba při načítání uživatelů:", userError);
      alert("Nepodařilo se načíst jména uživatelů: " + userError.message);
      return;
    }

    // Vytvoříme mapu UživatelID -> Jmeno
    const userMap = {};
    users.forEach((user) => {
      userMap[user.UzivatelID] = user.Jmeno;
    });

    // Zobrazíme komentáře
    comments.forEach((comment) => {
      const jmeno = userMap[comment.UzivatelID] || "Není známo";
      const li = document.createElement("li");
      li.className = "p-2 border-b border-gray-200";
      li.innerHTML = `<strong>${jmeno}:</strong> ${comment.Text}`;
      commentList.appendChild(li);
    });
  }
}

// Funkce pro přidání nového komentáře
async function addComment(rezervaceId, uzivatelId, text) {
  const { data, error } = await supabaseClient.from("Komentare").insert({
    RezervacehalyID: rezervaceId,
    UzivatelID: uzivatelId,
    Text: text,
  });

  if (error) {
    console.error("Chyba při přidávání komentáře:", error);
    alert("Nepodařilo se přidat komentář: " + error.message);
    return false; // Vracíme false, pokud došlo k chybě
  }

  // Po přidání komentáře znovu načteme seznam
  await loadComments(rezervaceId);
  return true; // Vracíme true, pokud bylo přidání úspěšné
}

// Přidání event listeneru na tlačítko pro přidání komentáře
document
  .getElementById("bt-add-comment")
  .addEventListener("click", async () => {
    const commentText = document
      .getElementById("new-comment-text")
      .value.trim();

    if (!commentText) {
      alert("Prosím, napište komentář.");
      return;
    }

    const success = await addComment(reservationId, currentUserId, commentText);
    if (success) {
      document.getElementById("new-comment-text").value = ""; // Vyčistíme textové pole pouze při úspěchu
    }
  });

async function changeMyAttendance(attendance) {
  const { error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .update({ Stavprihlaseni: attendance })
    .select("Stavprihlaseni")
    .eq("UzivatelID", currentUserId);

  if (error) {
    console.error("Chyba při aktualizaci účasti: ", error);
  } else {
    currentUserAttendance = attendance;
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
  btChangeAttendance.classList.remove("hidden");
}

async function acceptAttendance() {
  changeMyAttendance(true);

  modalPotvrzeniUcasti.classList.add("hidden");
  btChangeAttendance.classList.remove("hidden");
}

// Tahá data z DB a vrací stavPrihlasení uživatele na trénink
async function getAttendance(userId, reservationId) {
  const { data, error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .select("Stavprihlaseni")
    .eq("RezervacehalyID", reservationId)
    .eq("UzivatelID", userId);

  if (error || !data || data.length === 0) {
    console.error("Chyba při aktualizaci účasti: ", error);
    return null;
  }
  return data[0].Stavprihlaseni;
}

// Načte data uživatele podle jeho id
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

// Načte data o týmu
async function getTeamData(teamId) {
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

// Načte data o rezervaci haly (eventu, co se v hale koná)
async function getHallReservationData(reservationId) {
  const { data: RezervacehalyData, error: RezervacehalyError } =
    await supabaseClient
      .from("Rezervacehaly")
      .select(
        "UzivatelID, RezervacehalyID, Datumrezervace, Konecrezervace, Zacatekrezervace"
      )
      .eq("RezervacehalyID", reservationId)
      .single();

  if (RezervacehalyError) {
    console.error("Chyba při načítání týmu:", RezervacehalyError);
    return;
  }

  return RezervacehalyData;
}

// Uloží hodnoty z inputu do DB
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
    .eq("RezervacehalyID", reservationId);

  if (error) {
    console.error("Chyba při aktualizaci rezervace haly:", error);
    return error;
  } else {
    console.log("Trénink byl upraven");
    return null;
  }
}

async function setTrainingData(reservationId) {
  const teamData = await getTeamData(currentTeam);
  nazevTymu.innerHTML = teamData.Nazevtymu;

  const hallRezervationData = await getHallReservationData(reservationId);
  const trainer = await getUserData(hallRezervationData.UzivatelID);

  spanTrainigDataTrainer.textContent = trainer.Jmeno + " " + trainer.Prijmeni;

  const trainingDateInput = document.getElementById("training-date");
  const trainingStartTimeInput = document.getElementById("training-start-time");
  const trainingEndTimeInput = document.getElementById("training-end-time");

  trainingDateInput.value = hallRezervationData.Datumrezervace;
  trainingStartTimeInput.value = hallRezervationData.Zacatekrezervace;
  trainingEndTimeInput.value = hallRezervationData.Konecrezervace;
}

// Načte z DB seznam hráčů, jejich TymID je stejný jako ID přihlášeného uživatele, vypíše pouze uživatele s idRole 3 (hráč)
async function loadPlayers() {
  const playerList = document.getElementById("player-list");

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  try {
    const { data: players, error } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, Jmeno, Prijmeni, TymID")
      .eq("TymID", currentTeam)
      .eq("RoleuzivateluID", ROLE_PLAYER);

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
  players = players.filter((player) => player.UzivatelID !== currentUserId);

  if (!playerList) {
    console.error("Element s ID 'player-list' nebyl nalezen v HTML.");
    return;
  }

  playerList.innerHTML = "";

  const playersWithAttendance = [];

  for (const player of players) {
    const stavPrihlaseni = await getAttendance(
      player.UzivatelID,
      reservationId
    );

    playersWithAttendance.push({
      ...player,
      stavPrihlaseni: stavPrihlaseni,
    });
  }

  playersWithAttendance.sort((a, b) => {
    const getOrder = (stav) => {
      if (stav === true) return 0;
      if (stav === false) return 1;
      return 2;
    };
    return getOrder(a.stavPrihlaseni) - getOrder(b.stavPrihlaseni);
  });

  for (const player of playersWithAttendance) {
    const li = document.createElement("li");
    li.className =
      "dark:text-white p-2 border-b border-secondaryLight dark:border-secondaryDark flex justify-between items-center";

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

btChangeAttendance.addEventListener("click", async () => {
  const novyStav = !currentUserAttendance;
  console.log(currentUserAttendance);

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
