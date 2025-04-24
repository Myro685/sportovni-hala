import {
  supabaseClient,
  getTeamEventsData,
  insertDataIntoRezervacehaly,
  getHallInformation,
  getUserData,
  getAllEvents,
} from "./db.js";

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

// Načte data o přihlášeným uživateli z localStorage
const storedUserData = JSON.parse(localStorage.getItem("userData"));
let currentUserRole = storedUserData.RoleuzivateluID;
const currentUserId = storedUserData.UzivatelID;
let currentTeam = storedUserData.TymID;

let userID = null; // Je tady kvůli loadPicture
let currentTeamEventsData = [];
let getAllEventsData = [];

// Proměnná pro aktuální den v denním rozvrhu
let currentScheduleDate = new Date();

const openBtn = document.getElementById("open-create-training");
const cancelBtn = document.getElementById("cancel-create-training");
const modal = document.getElementById("modal-create-training");
const form = document.getElementById("create-training-form");
const deleteBtn = document.getElementById("delete-training");

// Funkce pro nastavení viditelnosti prvků podle role
function setupRoleBasedVisibility(role) {
  const roleConfig = {
    [ROLE_ADMIN]: () => {
      openBtn?.classList.add("hidden"); // Admin nemůže vytvářet tréninky
      deleteBtn?.classList.remove("hidden"); // Admin může mazat
    },
    [ROLE_TRAINER]: () => {
      openBtn?.classList.remove("hidden"); // Trenér může vytvářet tréninky
      deleteBtn?.classList.add("hidden"); // Trenér nemůže mazat
    },
    [ROLE_PLAYER]: () => {
      openBtn?.classList.add("hidden"); // Hráč nemůže vytvářet tréninky
      deleteBtn?.classList.add("hidden"); // Hráč nemůže mazat
    },
  };

  const setup =
    roleConfig[role] ||
    (() => {
      openBtn?.classList.add("hidden");
      deleteBtn?.classList.add("hidden");
    });
  setup();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Přidání event listeneru pro změnu data v modálu
  document.getElementById("training-date").addEventListener("change", (e) => {
    const selectedDate = e.target.value;
    renderTimeline(selectedDate);
  });

  // Aktualizace role uživatele z databáze
  const userData = await getUserData(currentUserId);
  if (userData.RoleuzivateluID !== storedUserData.RoleuzivateluID) {
    storedUserData.RoleuzivateluID = userData.RoleuzivateluID;
    localStorage.setItem("userData", JSON.stringify(storedUserData));
    currentUserRole = userData.RoleuzivateluID;
    console.log("Role uživatele byla aktualizována v localStorage.");
  }

  // Načtení dat událostí
  currentTeamEventsData = await getTeamEventsData(currentTeam);
  getAllEventsData = await getAllEvents();

  // Nastavení viditelnosti podle role
  setupRoleBasedVisibility(currentUserRole);

  // Zobrazení událostí podle role
  if (currentUserRole === ROLE_ADMIN) {
    displayEvents(getAllEventsData);
  } else {
    displayEvents(currentTeamEventsData);
  }

  // Načtení profilové fotky
  loadPicture();

  // Vykreslení denního rozvrhu
  renderDailySchedule();
  renderScheduleLabels();

  // Event listenery pro navigaci mezi dny
  document.getElementById("prev-day").addEventListener("click", () => {
    currentScheduleDate.setDate(currentScheduleDate.getDate() - 1);
    renderDailySchedule();
    renderScheduleLabels();
  });

  document.getElementById("next-day").addEventListener("click", () => {
    currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
    renderDailySchedule();
    renderScheduleLabels();
  });
});

// Event listenery pro tlačítka modálu
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
    profilePicture.forEach((img) => {
      img.src = profilePictureUrl;
    });
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Funkce pro vytvoření nového tréninku
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nazevAkce = document.getElementById("event-title").value;
  const popisAkce = document.getElementById("event-description").value;
  const datum = document.getElementById("training-date").value;
  const zacatek = document.getElementById("start-time").value;
  const konec = document.getElementById("end-time").value;

  try {
    const halaId = 1;
    const hallData = await getHallInformation(halaId);
    const openTime = hallData.Pocatekoteviracidoby;
    const closeTime = hallData.Konecoteviracidoby;

    const parseTimeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const zacatekMinutes = parseTimeToMinutes(zacatek);
    const konecMinutes = parseTimeToMinutes(konec);
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);

    if (zacatekMinutes < openMinutes || konecMinutes > closeMinutes) {
      alert(
        `Trénink lze vytvořit pouze v otevírací době haly (${openTime.slice(
          0,
          5
        )} - ${closeTime.slice(0, 5)}).`
      );
      return;
    }

    const allEvents = await getAllEvents();
    const dayEvents = allEvents.filter(
      (e) => e.Datumrezervace === datum && e.HalaID === halaId
    );

    const isCollision = dayEvents.some((event) => {
      const eventStartMinutes = parseTimeToMinutes(event.Zacatekrezervace);
      const eventEndMinutes = parseTimeToMinutes(event.Konecrezervace);
      return (
        zacatekMinutes < eventEndMinutes && konecMinutes > eventStartMinutes
      );
    });

    if (isCollision) {
      alert(
        "Nelze vytvořit trénink, protože se překrývá s jiným tréninkem v hale."
      );
      return;
    }

    const newEvent = await insertDataIntoRezervacehaly({
      halaId: 1,
      uzivatelId: currentUserId,
      tymId: currentTeam,
      nazevAkce,
      popisAkce,
      datum,
      zacatek,
      konec,
    });

    await pushUsersIntoTable(newEvent.RezervacehalyID);
    currentTeamEventsData = await getTeamEventsData(currentTeam);
    getAllEventsData = await getAllEvents(); // Aktualizace událostí pro rozvrh

    displayEvents(
      currentUserRole === ROLE_ADMIN ? getAllEventsData : currentTeamEventsData
    );
    renderDailySchedule(); // Aktualizace denního rozvrhu po vytvoření nového tréninku

    alert("Trénink byl úspěšně vytvořen.");
    modal.classList.add("hidden");
    form.reset();
  } catch (err) {
    console.error("Chyba při vytváření tréninku:", err);
    alert("Chyba při vytváření tréninku: " + err.message);
  }
});

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

async function pushUsersIntoTable(eventId) {
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

function displayEvents(events) {
  const container = document.getElementById("training-container");
  container.innerHTML = "";
  for (const event of events) {
    const card = createTrainingCard(event);
    container.appendChild(card);
  }
}

function createTrainingCard(event) {
  const card = document.createElement("div");
  card.className =
    "bg-thirdLight dark:bg-thirdDark px-7 py-8 rounded-lg border-2 shadow-lg flex flex-col justify-between w-96 h-72 flex-shrink-0";

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
    "text-white bg-secondaryLight hover:bg-hoverLight font-bold uppercase w-full h-10 rounded-lg dark:bg-secondaryDark dark:hover:bg-hoverDark";
  button.setAttribute("data-lang-key", "details");
  button.textContent = "podrobnosti";
  button.onclick = () => {
    window.location.href = `training.html?id=${event.RezervacehalyID}`;
  };
  return button;
}

function createDeleteButton(event, cardElement) {
  if (currentUserRole === ROLE_PLAYER) return document.createElement("div");

  const deleteBtn = document.createElement("button");
  deleteBtn.className =
    "font-bold uppercase w-full text-white h-10 rounded-lg bg-red-600 hover:bg-red-800 mt-2";
  deleteBtn.setAttribute("data-lang-key", "remove");
  deleteBtn.textContent = "🗑 Smazat";
  deleteBtn.onclick = async () => {
    const confirmDelete = confirm("Opravdu chceš tento trénink smazat?");
    if (!confirmDelete) return;

    try {
      const { error: commentError } = await supabaseClient
        .from("Komentare")
        .delete()
        .eq("RezervacehalyID", event.RezervacehalyID);

      if (commentError) {
        throw new Error("Chyba při mazání komentářů: " + commentError.message);
      }

      const { error: playersError } = await supabaseClient
        .from("Seznamprihlasenychrezervacihracu")
        .delete()
        .eq("RezervacehalyID", event.RezervacehalyID);

      if (playersError) {
        throw new Error(
          "Chyba při mazání přihlášení hráčů: " + playersError.message
        );
      }

      const { error: trainingError } = await supabaseClient
        .from("Rezervacehaly")
        .delete()
        .eq("RezervacehalyID", event.RezervacehalyID);

      if (trainingError) {
        throw new Error("Chyba při mazání tréninku: " + trainingError.message);
      }

      cardElement.remove();
      getAllEventsData = await getAllEvents(); // Aktualizace událostí
      renderDailySchedule(); // Aktualizace denního rozvrhu po smazání
      alert("Trénink byl úspěšně smazán.");
    } catch (error) {
      alert("Chyba při mazání: " + error.message);
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

    getAllEventsData = await getAllEvents(); // Aktualizace událostí
    renderDailySchedule(); // Aktualizace denního rozvrhu
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

deleteBtn.addEventListener("click", async () => {
  await deleteExpiredReservations(currentUserId);
});

function renderTimeLabels() {
  const container = document.getElementById("timeline-labels");
  container.innerHTML = "";

  const interval = 2;
  const markers = 24 / interval;

  for (let i = 0; i <= markers; i++) {
    const hour = i * interval;
    const label = document.createElement("div");
    label.style.width = 100 / markers + "%";
    label.textContent = hour.toString().padStart(2, "0") + ":00";
    label.classList.add(
      "text-center",
      "text-gray-600",
      "dark:text-gray-300",
      "font-medium",
      "text-[10px]",
      "sm:text-xs"
    );
    container.appendChild(label);
  }
}

async function renderTimeline(selectedDate = null) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  // Načtení aktuálního jazyka
  const lang = localStorage.getItem("preferredLanguage") || "cs";

  const dnes = selectedDate || new Date().toISOString().split("T")[0];
  console.log("Zobrazujeme vytíženost pro datum:", dnes);

  const allEvents = await getAllEvents();
  const dayEvents = allEvents.filter(
    (e) => e.Datumrezervace === dnes && e.HalaID === 1
  );

  const halaId = 1;
  const hallData = await getHallInformation(halaId);

  const openHour = parseInt(hallData.Pocatekoteviracidoby.split(":")[0], 10);
  const closeHour = parseInt(hallData.Konecoteviracidoby.split(":")[0], 10);

  for (let hour = 0; hour < 24; hour++) {
    const block = document.createElement("div");
    block.classList.add(
      "h-full",
      "flex",
      "items-center",
      "justify-center",
      "text-[10px]",
      "sm:text-xs",
      "text-white",
      "overflow-hidden",
      "transition-all",
      "duration-200"
    );

    const inOpeningHours = hour >= openHour && hour < closeHour;

    const startingEvent = dayEvents.find((e) => {
      const startHour = parseInt(e.Zacatekrezervace?.split(":")[0], 10);
      return startHour === hour;
    });

    if (startingEvent) {
      const startHour = parseInt(
        startingEvent.Zacatekrezervace.split(":")[0],
        10
      );
      const endHour = parseInt(startingEvent.Konecrezervace.split(":")[0], 10);
      const duration = endHour - startHour;

      block.style.width = (100 / 24) * duration + "%";
      block.classList.add(
        "bg-red-500",
        "hover:bg-red-600",
        "rounded-md",
        "shadow-sm"
      );
      block.textContent =
        startingEvent.Nazevakce || translations[lang].occupied;
      block.title = `${startingEvent.Nazevakce} (${startingEvent.Zacatekrezervace}–${startingEvent.Konecrezervace})`;

      timeline.appendChild(block);
      hour += duration - 1;
    } else {
      block.style.width = 100 / 24 + "%";
      if (!inOpeningHours) {
        block.classList.add("bg-gray-300", "dark:bg-gray-600", "rounded-md");
        block.textContent = translations[lang].closed;
      } else {
        block.classList.add(
          "bg-green-500",
          "hover:bg-green-600",
          "rounded-md",
          "shadow-sm"
        );
        block.textContent = translations[lang].free;
      }
      timeline.appendChild(block);
    }
  }
}

// Funkce pro vykreslení štítků (hodin) na časové ose denního rozvrhu
function renderScheduleLabels() {
  const container = document.getElementById("schedule-labels");
  container.innerHTML = "";

  const interval = window.innerWidth < 640 ? 4 : 2; // Na mobilu méně štítků (každé 4 hodiny), na větších zařízeních každé 2 hodiny
  const markers = 24 / interval;

  for (let i = 0; i <= markers; i++) {
    const hour = i * interval;
    const label = document.createElement("div");
    label.style.width = 100 / markers + "%";
    label.textContent = hour.toString().padStart(2, "0") + ":00";
    label.classList.add(
      "text-center",
      "text-gray-600",
      "dark:text-gray-300",
      "font-medium",
      "text-[10px]",
      "sm:text-xs"
    );
    container.appendChild(label);
  }
}

// Funkce pro vykreslení denního rozvrhu
async function renderDailySchedule() {
  const timeline = document.getElementById("schedule-timeline");
  timeline.innerHTML = "";

  // Načtení aktuálního jazyka
  const lang = localStorage.getItem("preferredLanguage") || "cs";

  // Aktualizace zobrazení data
  const scheduleDate = document.getElementById("schedule-date");
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  scheduleDate.textContent = currentScheduleDate.toLocaleDateString(
    lang === "en" ? "en-US" : lang === "de" ? "de-DE" : "cs-CZ",
    options
  );

  // Formát data pro porovnání s událostmi
  const selectedDate = currentScheduleDate.toISOString().split("T")[0];
  console.log("Zobrazujeme denní rozvrh pro datum:", selectedDate);

  // Načtení událostí pro daný den
  const allEvents = await getAllEvents();
  const dayEvents = allEvents.filter(
    (e) => e.Datumrezervace === selectedDate && e.HalaID === 1
  );

  // Načtení otevírací doby haly
  const halaId = 1;
  const hallData = await getHallInformation(halaId);
  const openHour = parseInt(hallData.Pocatekoteviracidoby.split(":")[0], 10);
  const closeHour = parseInt(hallData.Konecoteviracidoby.split(":")[0], 10);

  let hour = 0;

  // Vykreslení časové osy po blocích
  while (hour < 24) {
    const block = document.createElement("div");
    block.classList.add(
      "h-full",
      "flex",
      "items-center",
      "justify-center",
      "text-[10px]",
      "sm:text-xs",
      "text-white",
      "overflow-hidden",
      "transition-all",
      "duration-200"
    );

    const inOpeningHours = hour >= openHour && hour < closeHour;

    // Najdeme událost, která začíná v tuto hodinu
    const startingEvent = dayEvents.find((e) => {
      const startHour = parseInt(e.Zacatekrezervace?.split(":")[0], 10);
      return startHour === hour;
    });

    if (startingEvent) {
      const startHour = parseInt(
        startingEvent.Zacatekrezervace.split(":")[0],
        10
      );
      const endHour = parseInt(startingEvent.Konecrezervace.split(":")[0], 10);
      const duration = endHour - startHour;

      block.style.width = (100 / 24) * duration + "%";
      block.classList.add(
        "bg-red-500",
        "hover:bg-red-600",
        "rounded-md",
        "shadow-sm"
      );
      block.textContent =
        startingEvent.Nazevakce || translations[lang].occupied;
      block.title = `${startingEvent.Nazevakce} (${startingEvent.Zacatekrezervace}–${startingEvent.Konecrezervace})`;

      timeline.appendChild(block);
      hour += duration; // Přeskočíme hodiny, které událost pokrývá
    } else if (!inOpeningHours) {
      // Najdeme, jak dlouho hala zůstává zavřená
      let closedDuration = 1;
      let nextHour = hour + 1;
      while (nextHour < 24 && !(nextHour >= openHour && nextHour < closeHour)) {
        closedDuration++;
        nextHour++;
      }

      block.style.width = (100 / 24) * closedDuration + "%";
      block.classList.add("bg-gray-300", "dark:bg-gray-600", "rounded-md");
      block.textContent = `${translations[lang].closed} (${hour
        .toString()
        .padStart(2, "0")}:00–${(hour + closedDuration)
        .toString()
        .padStart(2, "0")}:00)`;

      timeline.appendChild(block);
      hour += closedDuration; // Přeskočíme hodiny, kdy je zavřeno
    } else {
      // Volný čas (v otevírací době, ale bez události)
      let freeDuration = 1;
      let nextHour = hour + 1;
      while (
        nextHour < 24 &&
        nextHour >= openHour &&
        nextHour < closeHour &&
        !dayEvents.some(
          (e) => parseInt(e.Zacatekrezervace?.split(":")[0], 10) === nextHour
        )
      ) {
        freeDuration++;
        nextHour++;
      }

      block.style.width = (100 / 24) * freeDuration + "%";
      block.classList.add(
        "bg-green-500",
        "hover:bg-green-600",
        "rounded-md",
        "shadow-sm"
      );
      block.textContent = `${translations[lang].free} (${hour
        .toString()
        .padStart(2, "0")}:00–${(hour + freeDuration)
        .toString()
        .padStart(2, "0")}:00)`;

      timeline.appendChild(block);
      hour += freeDuration; // Přeskočíme hodiny, kdy je volno
    }
  }
}
