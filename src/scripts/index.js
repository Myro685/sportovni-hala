import {
  supabaseClient,
  getTeamEventsData,
  insertDataIntoRezervacehaly,
  getHallInformation,
  getUserData
} from "./db.js";

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

// načte data o přihlašeném uživateli, ktere jsme uložili do LS
const storedUserData = JSON.parse(localStorage.getItem("userData"));
let currentUserRole = storedUserData.RoleuzivateluID;
const currentUserId = storedUserData.UzivatelID;
let currentTeam = storedUserData.TymID;

if (currentUserRole === ROLE_TRAINER) {

}
else if (currentUserRole === ROLE_ADMIN) {

} 
else if (currentUserRole == ROLE_PLAYER) {
  document.getElementById("open-create-training")?.classList.add("hidden");
  document.getElementById("delete-training")?.classList.add("hidden");
} else {

}

let userID = null; // je tady kvuli loadpicture
let currentTeamEventsData = []; 

const openBtn = document.getElementById("open-create-training");
const cancelBtn = document.getElementById("cancel-create-training");
const modal = document.getElementById("modal-create-training");
const form = document.getElementById("create-training-form");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("training-date").addEventListener("change", (e) => {
    const selectedDate = e.target.value;
    renderTimeline(selectedDate);
  });
  
  const userData = await getUserData(currentUserId);
  if (userData.RoleuzivateluID !== storedUserData.RoleuzivateluID) {
    storedUserData.RoleuzivateluID = userData.RoleuzivateluID;
    localStorage.setItem("userData", JSON.stringify(storedUserData));
    currentUserRole = userData.RoleuzivateluID;
    console.log("Role uživatele byla aktualizována v localStorage.");
  }
  
  currentTeamEventsData = await getTeamEventsData(currentTeam);

  displayEvents(currentTeamEventsData);
  loadPicture();
});

openBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  renderTimeline();
  renderTimeLabels();
});

cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
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

    userID = userData.UzivatelID;
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
    //console.log("Nastavovaná URL pro obrázek:", profilePictureUrl);
    profilePicture.forEach((img) => {
      img.src = profilePictureUrl;
    });
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

//funkce pro vytvoreni noveho treninku
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nazevAkce = document.getElementById("event-title").value;
  const popisAkce = document.getElementById("event-description").value;
  const datum = document.getElementById("training-date").value;
  const zacatek = document.getElementById("start-time").value;
  const konec = document.getElementById("end-time").value;

  try {
    const newEvent = await insertDataIntoRezervacehaly({
      halaId: 1,
      uzivatelId: 27, // TODO: nahradit dynamicky
      tymId: currentTeam,
      nazevAkce,
      popisAkce,
      datum,
      zacatek,
      konec,
    });

    await pushUsersIntoTable(newEvent.RezervacehalyID);
    currentTeamEventsData = await getTeamEventsData(currentTeam);
    
    displayEvents(currentTeamEventsData);

    alert("Trénink byl úspěšně vytvořen.");
    modal.classList.add("hidden");
    form.reset();
  } catch (err) {
    console.error("Chyba při vytváření tréninku:", err); // pro lepší debug
    alert("Chyba při vytváření tréninku: " + err.message);
  }
});

// vytahne vsechny hrace s id tym prihlaseneho uzivatele
async function getPlayersFromTeam() {
  const { data: players, error } = await supabaseClient
    .from("Uzivatel")
    .select("UzivatelID, Jmeno, Prijmeni, TymID")
    .eq("TymID", currentTeam)
    .eq("RoleuzivateluID", 3);

  if (error) {
    alert("Chyba při načítání hráčů: " + error.message);
    return;
  }

  return players;
}

// vlozeni dat do tabulky Seznamrezervaciprihlasenihracu
async function pushUsersIntoTable(eventId) {
  // projedu pole s hracema a pro kazdyho hrace vykonam pridani do db
  const players = await getPlayersFromTeam();
  for (const player of players) {
    const { error } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .insert([
        {
          Stavprihlaseni: null,
          RezervacehalyID: eventId,
          UzivatelID: player.UzivatelID,
        },
      ]);
    if (error) {
      console.error("Chyba: " + error.message);
      return;
    }
  }
}

// nastavit popis akce jako volitelny input

//treninky budou razeny podle datumu
//jakmile bude aktualni cas == konci treninku tak se trenink smaze
//treninky nemohou byt v minulosti
function displayEvents(events) {
  const container = document.getElementById("training-container");
  container.innerHTML = "";
  for (const event of events) {
    const card = createTrainingCard(event);
    container.appendChild(card);
  }
  const savedLang = localStorage.getItem("preferredLanguage") || "cs";
  changeLanguage(savedLang);
}

function createTrainingCard(event) {
  const card = document.createElement("div");
  card.className =
    "dark:bg-thirdDark px-7 py-8 rounded-lg border-2 shadow-lg flex flex-col justify-between w-96 h-72";

  const header = createCardHeader(event);
  const description = createCardDescription(event);
  const timeInfo = createCardTimeInfo(event);
  const detailsButton = createDetailsButton(event);
  const deleteButton = createDeleteButton(event, card);

  card.append(header, description, timeInfo, detailsButton, deleteButton);
  return card;
}

function createCardHeader(event) {
  const header = document.createElement("h2");
  header.className = "text-xl dark:text-white font-bold";

  const trainingLabel = document.createElement("span");
  trainingLabel.setAttribute("data-lang-key", "training"); 

  const eventTitle = document.createElement("span");
  eventTitle.textContent = event.Nazevakce;
  header.append(eventTitle.textContent + " " + event.Datumrezervace);
  return header;
}

function createCardDescription(event) {
  const description = document.createElement("p");
  description.className = "dark:text-white";
  description.textContent = event.Popisakce;
  return description;
}

function createCardTimeInfo(event) {
  const eventStart = event.Zacatekrezervace?.slice(0, 5);
  const eventEnd = event.Konecrezervace?.slice(0, 5);

  const timeInfo = document.createElement("span");
  timeInfo.className = "dark:text-white";

  const spanTimeLabel = document.createElement("span");
  spanTimeLabel.setAttribute("data-lang-key", "time");

  timeInfo.appendChild(spanTimeLabel);
  timeInfo.append(" " + eventStart + " - " + eventEnd);
  return timeInfo;
}

function createDetailsButton(event) {
  const button = document.createElement("button");
  button.type = "submit";
  button.className =
    "text-white font-bold uppercase w-full h-10 rounded-lg dark:bg-secondaryDark dark:hover:bg-hoverDark";
  button.setAttribute("data-lang-key", "details"); 
  button.textContent = "podrobnosti"; 
  button.onclick = () => {
    window.location.href = `training.html?id=${event.RezervacehalyID}`;
  };
  return button;
}

function createDeleteButton(event, cardElement) {
  if (currentUserRole === ROLE_PLAYER)
     return document.createElement("div");

  const deleteBtn = document.createElement("button");
  deleteBtn.className =
    "font-bold uppercase w-full dark:text-white h-10 rounded-lg bg-red-600 hover:bg-red-800 mt-2";
  deleteBtn.setAttribute("data-lang-key", "remove"); 
  deleteBtn.textContent = "🗑 Smazat"; 
  deleteBtn.onclick = async () => {
    const confirmDelete = confirm("Opravdu chceš tento trénink smazat?");
    if (!confirmDelete) return;

    const { error } = await supabaseClient
      .from("Seznamprihlasenychrezervacihracu")
      .delete()
      .eq("RezervacehalyID", event.RezervacehalyID);

    const { errorRezervacehaly } = await supabaseClient
      .from("Rezervacehaly")
      .delete()
      .eq("RezervacehalyID", event.RezervacehalyID);

    if (error || errorRezervacehaly) {
      alert("Chyba při mazání.");
      console.error(error || errorRezervacehaly);
    } else {
      cardElement.remove();
      alert("Trénink byl úspěšně smazán.");
    }
  };

  return deleteBtn;
}

async function deleteExpiredReservations(deletedBy) {
  try {
    const { data, error } = await supabaseClient.rpc(
      "delete_expired_reservations",
      {
        p_deleted_by: deletedBy,
      }
    );

    if (error) {
      console.error("Error deleting expired reservations:", error);
      alert("Chyba při mazání proběhlých rezervací: " + error.message);
      return;
    }

    alert(
      `Proběhlé rezervace byly úspěšně smazány! Počet smazaných rezervací: ${data}`
    );
    location.reload();
    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("Chyba: " + error.message);
    return null;
  }
}

const deleteBtn = document.getElementById("delete-training");
deleteBtn.addEventListener("click", async () => {
  await deleteExpiredReservations(currentUserId);
});



function renderTimeLabels() {
  const container = document.getElementById("timeline-labels");
  container.innerHTML = "";

  const interval = 2; // Značky každé 2 hodiny, můžeš změnit třeba na 1
  const markers = 24 / interval;

  for (let i = 0; i <= markers; i++) {
    const hour = i * interval;
    const label = document.createElement("div");
    label.style.width = (100 / markers) + "%";
    label.textContent = hour.toString().padStart(2, '0'); // formát HH bez :00
    label.classList.add("text-center");
    container.appendChild(label);
  }
}

async function renderTimeline(selectedDate = null) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const dnes = selectedDate || new Date().toISOString().split("T")[0];
  console.log("Zobrazujeme vytíženost pro datum:", dnes);

  const events = await getTeamEventsData(currentTeam);
  const dayEvents = events.filter((e) => e.Datumrezervace === dnes);

  const halaId = 1;
  const hallData = await getHallInformation(halaId);

  const openHour = parseInt(hallData.Pocatekoteviracidoby.split(":")[0], 10);
  const closeHour = parseInt(hallData.Konecoteviracidoby.split(":")[0], 10);

  for (let hour = 0; hour < 24; hour++) {
    const block = document.createElement("div");
    block.classList.add(
      "h-full", "flex", "items-center", "justify-center",
      "text-[10px]", "text-white", "overflow-hidden"
    );

    const inOpeningHours = hour >= openHour && hour < closeHour;

    // Zjisti, jestli v tuto hodinu začíná událost
    const startingEvent = dayEvents.find((e) => {
      const startHour = parseInt(e.Zacatekrezervace?.split(":")[0], 10);
      return startHour === hour;
    });

    if (startingEvent) {
      const startHour = parseInt(startingEvent.Zacatekrezervace.split(":")[0], 10);
      const endHour = parseInt(startingEvent.Konecrezervace.split(":")[0], 10);
      const duration = endHour - startHour;

      block.style.width = (100 / 24) * duration + "%";
      block.classList.add("bg-red-500");
      block.textContent = startingEvent.Nazevakce || "Obsazeno";
      block.title = `${startingEvent.Nazevakce} (${startingEvent.Zacatekrezervace}–${startingEvent.Konecrezervace})`;

      timeline.appendChild(block);
      hour += duration - 1; // přeskoč další hodiny této události
    } else {
      block.style.width = (100 / 24) + "%";
      if (!inOpeningHours) {
        block.classList.add("bg-yellow-400");
      } else {
        block.classList.add("bg-green-500");
      }
      timeline.appendChild(block);
    }
  }
}

