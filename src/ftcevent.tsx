import { List } from "@raycast/api";
//import { useState } from "react";

export default function Command() {
  // so for some reason the event search API from FTCScout doesn't work right now so i can't really develop this rn :sob:
  /*const [events, setEvents] = useState([
    {
      name: "",
      humanName: "",
      valid: false,
      matches: [
        {
          matchId: 0,
          name: "",
          longName: "",
          redTotal: 0,
          blueTotal: 0,
          redAuto: 0,
          blueAuto: 0,
          redDC: 0,
          blueDC: 0,
          redEndgame: 0,
          blueEndgame: 0,
          red0: 0,
          red1: 0,
          blue0: 0,
          blue1: 0,
          alliance: "",
          win: false,
          tie: false,
        },
      ],
    },
  ]);*/

  const handleSearch = (text: string) => {
    console.log("Searching for:", text);
    fetch(`https://api.ftcscout.org/rest/v1/events/search?searchText=${text}&limit=100&hasMatches=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  return (
    <List isShowingDetail onSearchTextChange={handleSearch}>
      <List.Item title="Event Name" subtitle="Sample Event" />
    </List>
  );
}
