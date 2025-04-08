
import { supabaseClient, checkUserRole, updateAttendance, getTeamEventsData } from './db.js';

let currentTeam = null;
let currentUserRole = null;



const openBtn = document.getElementById("open-create-training");
const cancelBtn = document.getElementById("cancel-create-training");
const modal = document.getElementById("modal-create-training");
const form = document.getElementById("create-training-form");




document.addEventListener('DOMContentLoaded', async () => {
  const roleData = await checkUserRole();

  currentTeam = roleData.currentUserData.TymID;
  currentUserRole = roleData.currentUserData.RoleuzivateluID;
  const currentTeamEventsData = await getTeamEventsData(currentTeam);
  await displayEvents(currentTeamEventsData);
});



openBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});


//funkce pro vytvoreni noveho treninku
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("training-date").value;
  const startTime = document.getElementById("start-time").value;
  const endTime = document.getElementById("end-time").value;
  const eventDescription = document.getElementById("event-description").value
  const eventTitle = document.getElementById("event-title").value

  const { data, error } = await supabaseClient
    .from("Rezervacehaly")
    .insert([
      {
        HalaID: 1,
        UzivatelID: 27, //zmenit na aktualniho uzivatele, podminka jestli je admin nebo trener
        Nazevakce: eventTitle,
        Popisakce: eventDescription,
        TymID: currentTeam,
        Datumrezervace: date,
        Zacatekrezervace: startTime,
        Konecrezervace: endTime,
      }
    ])
    .select();

  if (error) {
    alert("Chyba při vytváření tréninku: " + error.message);
  } 
  else {
    await pushUsersIntoTable(data[0]?.RezervacehalyID);
    //await getTeamEventsData(currentTeam);
    await displayEvents( await getTeamEventsData(currentTeam));
    alert("Trénink byl úspěšně vytvořen.");
    modal.classList.add("hidden");
    form.reset();
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

async function pushUsersIntoTable(eventId) {
// projedu pole s hracema a pro kazdyho hrace vykonam pridani do db
const players = await getPlayersFromTeam();
  for(const player of players) {
    const { error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .insert([
      {
        Stavprihlaseni: null,
        RezervacehalyID: eventId,
        UzivatelID: player.UzivatelID,
      }
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
async function displayEvents(events) {
  for (const event of events) {
    const eventStart = event.Zacatekrezervace?.slice(0, 5);
    const eventEnd = event.Konecrezervace?.slice(0, 5);
    
      // Vytvoření kontejneru náhledu (kartu)
    const card = document.createElement("div");
    card.className =
      "bg-white px-7 py-8 rounded-lg border-2 border-gray-200 shadow-lg flex flex-col justify-between w-96 h-72";

    // Vytvoření nadpisu
    const header = document.createElement("h2");
    header.className = "text-xl font-bold";
    const spanTraining = document.createElement("span");
    spanTraining.setAttribute("data-lang-key", "training");
    spanTraining.textContent = event.Nazevakce;
    
    header.appendChild(spanTraining);
    //sem bych dal datum treninku
    header.append(event.Datumrezervace); 

    // Vytvoření odstavce s popisem
    const description = document.createElement("p");
    description.className = "text-gray-600";
    description.textContent = event.Popisakce;

    // Vytvoření elementu se zobrazením času
    const timeInfo = document.createElement("span");
    timeInfo.className = "text-gray-500";
    const spanTimeLabel = document.createElement("span");
    spanTimeLabel.setAttribute("data-lang-key", "time");
    spanTimeLabel.textContent = "Čas:";
    timeInfo.appendChild(spanTimeLabel);
    timeInfo.append( eventStart + " - " + eventEnd); 

    // Vytvoření tlačítka s odkazem na detail tréninku
    const detailsButton = document.createElement("button");
    detailsButton.type = "submit";
    detailsButton.className =
      "text-white font-bold uppercase w-full h-10 rounded-lg bg-slate-600 hover:bg-slate-800";
    detailsButton.setAttribute("data-lang-key", "details");
    detailsButton.textContent = "podrobnosti";
    detailsButton.onclick = function () {
      //localStorage.setItem("selectedTrainingId", event.RezervacehalyID);
      window.location.href = `training.html?id=${event.RezervacehalyID}`;
    };
    

    const deleteButton = document.createElement("button");
    deleteButton.className =
      "font-bold uppercase w-full h-10 rounded-lg bg-red-600 hover:bg-red-800 mt-2";
    deleteButton.textContent = "🗑 Smazat";
    deleteButton.onclick = async function () {
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


      if (error) {
        alert("Chyba při mazání: " + error.message);
      } else if (errorRezervacehaly) {
        alert("Chyba při mazání: " + errorRezervacehaly.message);
      } 
      else {
        card.remove();
        alert("Trénink byl úspěšně smazán.");
      }
    };


    // Sestavení karty
    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(timeInfo);
    card.appendChild(detailsButton);
    card.appendChild(deleteButton); 


    // Přidání karty do kontejneru v DOMu
    const container = document.getElementById("training-container");
    if (container) {
      container.appendChild(card);
    } else {
      console.error("Element s id 'trainingContainer' nebyl nalezen.");
    }
  }

}


