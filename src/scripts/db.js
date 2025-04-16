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

//nacte data o hale
async function getHallInformation(hallId) {
  const { data: hallData, error: hallEror } = await supabaseClient
    .from("Hala")
    .select("HalaID, Nazev, Pocatekoteviracidoby, Konecoteviracidoby")
    .eq("HalaID", hallId);

  if (hallEror) {
    console.error("Chyba při načítání týmu:", hallEror);
    return;
  }

  return hallData[0];
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

async function getAllEvents() {
  const { data: RezervacehalyData, error: RezervacehalyError } =
    await supabaseClient
      .from("Rezervacehaly")
      .select(
        "UzivatelID, Datumrezervace, Konecrezervace, Zacatekrezervace, RezervacehalyID, Nazevakce, Popisakce"
      );

  console.log(RezervacehalyData);
  if (RezervacehalyError) {
    console.error("Chyba při načítání týmu:", RezervacehalyError);
    return;
  }
  return RezervacehalyData;
}

async function checkUserRole() {}

async function insertDataIntoRezervacehaly({
  halaId = 1,
  uzivatelId,
  tymId,
  nazevAkce,
  popisAkce,
  datum,
  zacatek,
  konec,
}) {
  const { data, error } = await supabaseClient
    .from("Rezervacehaly")
    .insert([
      {
        HalaID: halaId,
        UzivatelID: uzivatelId,
        TymID: tymId,
        Nazevakce: nazevAkce,
        Popisakce: popisAkce,
        Datumrezervace: datum,
        Zacatekrezervace: zacatek,
        Konecrezervace: konec,
      },
    ])
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Žádná data nebyla vrácena po vložení rezervace");
  }
  return data[0];
}

export {
  supabaseClient,
  updateAttendance,
  checkUserRole,
  getUserData,
  getTeamEventsData,
  insertDataIntoRezervacehaly,
  getHallInformation,
  getAllEvents,
};
