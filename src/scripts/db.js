const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

//nacte informace o uzivateli
async function getUserData(userId) {
  const { data: userData, error: userError } = await supabaseClient
    .from("Uzivatel")
    .select("RoleuzivateluID, UzivatelID, TymID, Email")
    .eq("UzivatelID", userId)
    .single();

  if (userError) {
    alert("Chyba při načítání role uživatele: " + userError.message);
    return;
  }
  return userData;
}

async function updateAttendance(currentUserId, attendance) {
  const { error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .update({ Stavprihlaseni: attendance })
    .select("Stavprihlaseni")
    .eq("UzivatelID", currentUserId);

  if (error) {
    console.error("problem s updatovanim dochazky v db: " + error.message);
    return;
  }
  return;
}

//nacte data o eventech pro aktualni tym (vsechny treninky)
async function getTeamEventsData(tymID) {
  const { data: RezervacehalyData, error: RezervacehalyError } =
    await supabaseClient
      .from("Rezervacehaly")
      .select(
        "UzivatelID, Datumrezervace, Konecrezervace, Zacatekrezervace, RezervacehalyID, Nazevakce, Popisakce"
      )
      .eq("TymID", tymID);

  if (RezervacehalyError) {
    console.error("Chyba při načítání týmu:", RezervacehalyError);
    return;
  }
  return RezervacehalyData;
}

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

    const currentUserData = userData;

    return { currentUserData };
  } catch (error) {
    alert("Chyba: " + error.message);
    return;
  }
}

export {
  supabaseClient,
  updateAttendance,
  checkUserRole,
  getUserData,
  getTeamEventsData,
};
