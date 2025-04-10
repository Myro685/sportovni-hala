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

    firstName.value = userData.Jmeno || "Není zadáno";
    lastName.value = userData.Prijmeni || "Není zadáno";
    email.value = userData.Email || "Není zadáno";
    number.value = userData.Telefon || "Není zadáno";
    team.value = teamName;
    city.value = addressData.Nazevmesta || "Není zadáno";
    psc.value = addressData.Psc || "Není zadáno";
    street.value = addressData.Ulice || "Není zadáno";
    cp.value = addressData.Cp || "Není zadáno";

    const defaultImage = "../assets/a32b54fa44fb3f94bdb289b5fd8f01dc.jpg";
    let profilePictureUrl = userData.profile_picture_url || defaultImage;
    if (userData.profile_picture_url) {
      const timestamp = new Date().getTime();
      profilePictureUrl = `${userData.profile_picture_url}?t=${timestamp}`;
    }
    console.log("Nastavovaná URL pro obrázek:", profilePictureUrl);
    profilePicture.forEach((img) => {
      img.src = profilePictureUrl;
    });

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
  const editProfilePicture = document.getElementById("editProfilePicture");
  const modalForm = document.getElementById("modalForm");
  const profilePicture = document.querySelectorAll(".profile-picture");

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const userEmail = session.user.email;

    const { data: userData, error: fetchError } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID, AdresaID")
      .eq("Email", userEmail)
      .single();

    if (fetchError) {
      alert("Chyba při načítání dat uživatele: " + fetchError.message);
      return;
    }

    // Nahrávání nového obrázku, pokud byl vybrán
    let profilePictureUrl = null;
    if (editProfilePicture.files && editProfilePicture.files[0]) {
      profilePictureUrl = await uploadProfilePicture(
        editProfilePicture.files[0],
        userData.UzivatelID
      );
      if (profilePictureUrl) {
        const success = await updateUserProfilePicture(
          userData.UzivatelID,
          profilePictureUrl
        );
        if (success) {
          // Aktualizace zobrazení obrázku na stránce
          const timestamp = new Date().getTime();
          const cacheBustedUrl = `${profilePictureUrl}?t=${timestamp}`;
          profilePicture.forEach((img) => {
            img.src = cacheBustedUrl;
          });
        } else {
          alert("Nepodařilo se aktualizovat URL obrázku v databázi.");
          return;
        }
      } else {
        alert("Nepodařilo se nahrát obrázek.");
        return;
      }
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

// Funkce pro nahrávání obrázku
async function uploadProfilePicture(file, userId) {
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    alert("Prosím nahrajte obrázek ve formátu JPEG nebo PNG.");
    return null;
  }

  if (file.size > maxSizeInBytes) {
    alert("Obrázek je příliš velký. Maximální velikost je 5 MB.");
    return null;
  }

  // Přidáme časovou značku do názvu souboru, aby byl jedinečný
  const timestamp = new Date().getTime();
  const fileName = `${userId}-profile-picture-${timestamp}.jpg`;

  // Najdeme a smažeme všechny staré obrázky pro daného uživatele
  const { data: existingFiles, error: listError } = await supabaseClient.storage
    .from("profile-pictures")
    .list("", { search: `${userId}-profile-picture` });

  if (listError) {
    console.error("Chyba při vyhledávání starých obrázků:", listError);
  } else if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map((file) => file.name);
    const { error: removeError } = await supabaseClient.storage
      .from("profile-pictures")
      .remove(filesToRemove);

    if (removeError) {
      console.error("Chyba při odstraňování starých obrázků:", removeError);
    } else {
      console.log("Staré obrázky úspěšně odstraněny:", filesToRemove);
    }
  }

  // Nahrajeme nový obrázek
  const { data, error } = await supabaseClient.storage
    .from("profile-pictures")
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) {
    console.error("Chyba při nahrávání obrázku:", error);
    return null;
  }

  const { publicUrl } = supabaseClient.storage
    .from("profile-pictures")
    .getPublicUrl(fileName).data;

  console.log("Veřejná URL nového obrázku:", publicUrl);
  return publicUrl;
}

// Funkce pro aktualizaci URL obrázku v databázi
async function updateUserProfilePicture(userId, pictureUrl) {
  const { data, error } = await supabaseClient
    .from("Uzivatel")
    .update({ profile_picture_url: pictureUrl })
    .eq("UzivatelID", userId);

  if (error) {
    console.error("Chyba při aktualizaci URL obrázku:", error);
    return false;
  }
  console.log("URL úspěšně aktualizována v databázi:", pictureUrl);
  return true;
}
