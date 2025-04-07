
//import { supabaseClient } from './db.js';

const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

function addEvent() {
  //po kliknuti na tlacitko
  //zobrazi se modal - form (cas atd)
  //musi byt prihlaseny jako trener
}




displayEvents();


//jako argument posleme data o treninku, na zaklade kterych dynamicky
//zobrazime data o konkretnim treninku

//treninky budou razeny podle datumu
//jakmile bude aktualni cas == konci treninku tak se trenink smaze
//treninky nemohou byt v minulosti
function displayEvents() {
  // Vytvoření kontejneru náhledu (kartu)
  const card = document.createElement("div");
  card.className =
    "bg-white px-7 py-8 rounded-lg border-2 border-gray-200 shadow-lg flex flex-col justify-between w-96 h-72";

  // Vytvoření nadpisu
  const header = document.createElement("h2");
  header.className = "text-xl font-bold";
  const spanTraining = document.createElement("span");
  spanTraining.setAttribute("data-lang-key", "training");
  spanTraining.textContent = "Trénink";
  header.appendChild(spanTraining);
  //sem bych dal datum treninku
  header.append(" 1"); 

  // Vytvoření odstavce s popisem
  const description = document.createElement("p");
  description.className = "text-gray-600";
  description.textContent =
    "Toto je ukázkový popis tréninku. Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

  // Vytvoření elementu se zobrazením času
  const timeInfo = document.createElement("span");
  timeInfo.className = "text-gray-500";
  const spanTimeLabel = document.createElement("span");
  spanTimeLabel.setAttribute("data-lang-key", "time");
  spanTimeLabel.textContent = "Čas:";
  timeInfo.appendChild(spanTimeLabel);
  timeInfo.append(" 10:00 - 11:00"); // Statický časový údaj

  // Vytvoření tlačítka s odkazem na detail tréninku
  const detailsButton = document.createElement("button");
  detailsButton.type = "submit";
  detailsButton.className =
    "text-white font-bold uppercase w-full h-10 rounded-lg bg-slate-600 hover:bg-slate-800";
  detailsButton.setAttribute("data-lang-key", "details");
  detailsButton.textContent = "podrobnosti";
  detailsButton.onclick = function () {
    window.location.href = "training.html";
  };

  // Sestavení karty
  card.appendChild(header);
  card.appendChild(description);
  card.appendChild(timeInfo);
  card.appendChild(detailsButton);

  // Přidání karty do kontejneru v DOMu
  const container = document.getElementById("training-container");
  if (container) {
    container.appendChild(card);
  } else {
    console.error("Element s id 'trainingContainer' nebyl nalezen.");
  }
}


