import {
  supabaseClient,
  checkUserRole,
  getTeamEventsData,
  insertDataIntoRezervacehaly,
} from "./db.js";

let currentTeam = null;
let currentUserRole = null;

const openBtn = document.getElementById("open-create-training");
const cancelBtn = document.getElementById("cancel-create-training");
const modal = document.getElementById("modal-create-training");
const form = document.getElementById("create-training-form");

document.addEventListener("DOMContentLoaded", async () => {
  const roleData = await checkUserRole();

  currentTeam = roleData.currentUserData.TymID;
  currentUserRole = roleData.currentUserData.RoleuzivateluID;
  const currentTeamEventsData = await getTeamEventsData(currentTeam);

  displayEvents(currentTeamEventsData);
  loadPicture();
});

openBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
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
      uzivatelId: 27, // TODO: nahradit dynamicky
      tymId: currentTeam,
      nazevAkce,
      popisAkce,
      datum,
      zacatek,
      konec,
    });

    await pushUsersIntoTable(newEvent.RezervacehalyID);
    displayEvents([newEvent]);

    alert("Trénink byl úspěšně vytvořen.");
    modal.classList.add("hidden");
    form.reset();
  } catch (err) {
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
  for (const event of events) {
    const card = createTrainingCard(event);
    container.appendChild(card);
  }
}

function createTrainingCard(event) {
  const card = document.createElement("div");
  card.className =
    "bg-white px-7 py-8 rounded-lg border-2 border-gray-200 shadow-lg flex flex-col justify-between w-96 h-72";

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
  header.className = "text-xl font-bold";

  const spanTraining = document.createElement("span");
  spanTraining.setAttribute("data-lang-key", "training");
  spanTraining.textContent = event.Nazevakce;

  header.appendChild(spanTraining);
  header.append(" " + event.Datumrezervace);
  return header;
}

function createCardDescription(event) {
  const description = document.createElement("p");
  description.className = "text-gray-600";
  description.textContent = event.Popisakce;
  return description;
}

function createCardTimeInfo(event) {
  const eventStart = event.Zacatekrezervace?.slice(0, 5);
  const eventEnd = event.Konecrezervace?.slice(0, 5);

  const timeInfo = document.createElement("span");
  timeInfo.className = "text-gray-500";

  const spanTimeLabel = document.createElement("span");
  spanTimeLabel.setAttribute("data-lang-key", "time");
  spanTimeLabel.textContent = "Čas:";

  timeInfo.appendChild(spanTimeLabel);
  timeInfo.append(" " + eventStart + " - " + eventEnd);
  return timeInfo;
}

function createDetailsButton(event) {
  const button = document.createElement("button");
  button.type = "submit";
  button.className =
    "text-white font-bold uppercase w-full h-10 rounded-lg bg-slate-600 hover:bg-slate-800";
  button.setAttribute("data-lang-key", "details");
  button.textContent = "podrobnosti";
  button.onclick = () => {
    window.location.href = `training.html?id=${event.RezervacehalyID}`;
  };
  return button;
}

function createDeleteButton(event, cardElement) {
  const deleteBtn = document.createElement("button");
  deleteBtn.className =
    "font-bold uppercase w-full h-10 rounded-lg bg-red-600 hover:bg-red-800 mt-2";
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
