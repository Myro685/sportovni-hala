// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Načtení dat
document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("email");
  const number = document.getElementById("number");
  const team = document.getElementById("team");
  const city = document.getElementById("city");
  const psc = document.getElementById("psc");
  const street = document.getElementById("street");
  const cp = document.getElementById("cp");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editNumber = document.getElementById("editNumber");
  const editCity = document.getElementById("editCity");
  const editPsc = document.getElementById("editPsc");
  const editStreet = document.getElementById("editStreet");
  const editCp = document.getElementById("editCp");

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
      .select("Jmeno, Prijmeni, Email, Telefon, TymID, AdresaID")
      .eq("Email", userEmail)
      .single();

    if (userError) {
      alert("Chyba při načítání uživatelských dat: " + userError.message);
      return;
    }

    let teamName = "Není zadáno";
    if (userData.TymID) {
      const { data: teamData, error: teamError } = await supabaseClient
        .from("Tym")
        .select("Nazevtymu")
        .eq("TymID", userData.TymID)
        .single();

      if (teamError) {
        alert("Chyba při načítání týmu: " + teamError.message);
        return;
      }
      teamName = teamData.Nazevtymu;
    }

    let addressData = {};
    if (userData.AdresaID) {
      const { data, error: addressError } = await supabaseClient
        .from("Adresa")
        .select("Cp, Nazevmesta, Psc, Ulice")
        .eq("AdresaID", userData.AdresaID)
        .single();

      if (addressError) {
        alert("Chyba při načítání adresy: " + addressError.message);
        return;
      }
      addressData = data;
    }

    // Naplnění HTML elementů daty
    firstName.value = userData.Jmeno || "Není zadáno";
    lastName.value = userData.Prijmeni || "Není zadáno";
    email.value = userData.Email || "Není zadáno";
    number.value = userData.Telefon || "Není zadáno";
    team.value = teamName;
    city.value = addressData.Nazevmesta || "Není zadáno";
    psc.value = addressData.Psc || "Není zadáno";
    street.value = addressData.Ulice || "Není zadáno";
    cp.value = addressData.Cp || "Není zadáno";

    // Naplnění polí v modálu
    editFirstName.value = userData.Jmeno || "";
    editLastName.value = userData.Prijmeni || "";
    editNumber.value = userData.Telefon || "";
    editCity.value = addressData.Nazevmesta || "";
    editPsc.value = addressData.Psc || "";
    editStreet.value = addressData.Ulice || "";
    editCp.value = addressData.Cp || "";
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Modal
const openButton = document.getElementById("openModal");
const closeButton = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const editForm = document.querySelector("#modal form");

openButton.addEventListener("click", () => {
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
});

closeButton.addEventListener("click", () => {
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
});

// Úprava dat
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const number = document.getElementById("number");
  const city = document.getElementById("city");
  const psc = document.getElementById("psc");
  const street = document.getElementById("street");
  const cp = document.getElementById("cp");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editNumber = document.getElementById("editNumber");
  const editCity = document.getElementById("editCity");
  const editPsc = document.getElementById("editPsc");
  const editStreet = document.getElementById("editStreet");
  const editCp = document.getElementById("editCp");
  const modalForm = document.getElementById("modalForm");

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const userEmail = session.user.email;

    // Načtení AdresaID pro aktualizaci adresy
    const { data: userData, error: fetchError } = await supabaseClient
      .from("Uzivatel")
      .select("AdresaID")
      .eq("Email", userEmail)
      .single();

    if (fetchError) {
      alert("Chyba při načítání dat uživatele: " + fetchError.message);
      return;
    }

    // Aktualizace tabulky Uzivatel
    const { error: userError } = await supabaseClient
      .from("Uzivatel")
      .update({
        Jmeno: editFirstName.value,
        Prijmeni: editLastName.value,
        Telefon: editNumber.value,
      })
      .eq("Email", userEmail);

    if (userError) {
      alert("Chyba při aktualizaci uživatele: " + userError.message);
      return;
    }

    // Aktualizace tabulky Adresa, pokud AdresaID existuje
    if (userData.AdresaID) {
      const { error: addressError } = await supabaseClient
        .from("Adresa")
        .update({
          Nazevmesta: editCity.value,
          Psc: editPsc.value,
          Ulice: editStreet.value,
          Cp: editCp.value,
        })
        .eq("AdresaID", userData.AdresaID);

      if (addressError) {
        alert("Chyba při aktualizaci adresy: " + addressError.message);
        return;
      }
    }

    // Aktualizace zobrazených hodnot
    firstName.value = editFirstName.value || "Není zadáno";
    lastName.value = editLastName.value || "Není zadáno";
    number.value = editNumber.value || "Není zadáno";
    city.value = editCity.value || "Není zadáno";
    psc.value = editPsc.value || "Není zadáno";
    street.value = editStreet.value || "Není zadáno";
    cp.value = editCp.value || "Není zadáno";

    modal.classList.add("hidden");
    modalForm.reset();
    alert("Profil byl úspěšně aktualizován!");
  } catch (error) {
    alert("Chyba: " + error.message);
  }
});
