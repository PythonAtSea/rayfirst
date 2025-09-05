import { Action, ActionPanel, Color, List } from "@raycast/api";
import { useState, useRef, useEffect } from "react";
import fetchOrig from "node-fetch";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });
const fetch = (url: string, options = {}) => fetchOrig(url, { ...options, agent });

export default function Command() {
  const [items, setItems] = useState([
    {
      teamName: "",
      teamNumber: "",
      about: false,
      totalOPR: 0,
      totalOPRrank: 0,
      autoOPR: 0,
      autoOPRrank: 0,
      teleOPR: 0,
      teleOPRrank: 0,
      egOPR: 0,
      egOPRrank: 0,
      location: "",
      rookieYear: 0,
      school: "",
      sponsors: [],
    },
  ]);
  useEffect(() => {
    setItems([]);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const latestSearch = useRef("");

  const handleSearch = (text: string) => {
    if (text.trim() !== "") {
      setIsLoading(true);
      latestSearch.current = text;
      fetch(`https://api.ftcscout.org/rest/v1/teams/search?searchText=${text}&limit=100`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (latestSearch.current !== text) return;
          setItems([]);
          for (const team of data) {
            setItems((prevItems) => [
              ...prevItems,
              {
                teamName: team.name,
                teamNumber: team.number,
                about: false,
                totalOPR: 0,
                autoOPR: 0,
                teleOPR: 0,
                egOPR: 0,
                totalOPRrank: 0,
                autoOPRrank: 0,
                teleOPRrank: 0,
                egOPRrank: 0,
                location: `${team.city}, ${team.state}, ${team.country}`,
                rookieYear: team.rookieYear,
                school: team.schoolName,
                sponsors: team.sponsors || [],
              },
            ]);
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setItems([]);
    }
  };

  const handleSelectionChange = (id: string | null) => {
    if (id === null) return;
    if (!isNaN(parseInt(id))) {
      fetch(`https://api.ftcscout.org/rest/v1/teams/${id}/quick-stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.teamNumber === id
                ? {
                    ...item,
                    totalOPR: parseFloat(data.tot.value),
                    autoOPR: parseFloat(data.auto.value),
                    teleOPR: parseFloat(data.dc.value),
                    egOPR: parseFloat(data.eg.value),
                    totalOPRrank: data.tot.rank,
                    autoOPRrank: data.auto.rank,
                    teleOPRrank: data.dc.rank,
                    egOPRrank: data.eg.rank,
                  }
                : item,
            ),
          );
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  };

  return (
    <List
      isShowingDetail
      searchBarPlaceholder="You can search using the team name or number"
      onSearchTextChange={handleSearch}
      isLoading={isLoading}
      onSelectionChange={handleSelectionChange}
    >
      {items.map((item, index) =>
        !item.about ? (
          <List.Item
            key={index}
            title={item.teamName}
            subtitle={item.teamNumber}
            id={item.teamNumber}
            detail={
              <List.Item.Detail
                markdown={""}
                metadata={
                    <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Name" text={item.teamName} />
                    <List.Item.Detail.Metadata.Label title="Number" text={item.teamNumber} />
                    <List.Item.Detail.Metadata.Label title="Location" text={item.location} />
                    <List.Item.Detail.Metadata.Label title="Rookie Year" text={item.rookieYear.toString()} />
                    <List.Item.Detail.Metadata.Label title="Host" text={item.school || "N/A"} />
                    {item.sponsors.length > 0 ? (
                      item.sponsors.map((sponsor, index) => (
                      <List.Item.Detail.Metadata.Label key={index} title={index === 0 ? "Sponsored by:" : ""} text={sponsor} />
                      ))
                    ) : (null)}
                    {item.totalOPR !== 0 && (
                      <>
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Total OPR" text={item.totalOPR.toFixed(2).toString() + " (Rank: #" + item.totalOPRrank + ")"} />
                      <List.Item.Detail.Metadata.Label title="Teleop OPR" text={item.teleOPR.toFixed(2).toString() + " (Rank: #" + item.teleOPRrank + ")"} />
                      <List.Item.Detail.Metadata.Label title="Auto OPR" text={item.autoOPR.toFixed(2).toString() + " (Rank: #" + item.autoOPRrank + ")"} />
                      <List.Item.Detail.Metadata.Label title="Endgame OPR" text={item.egOPR.toFixed(2).toString() + " (Rank: #" + item.egOPRrank + ")"} />
                      </>
                    )}
                    </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action.Push title="View Matches" target={<TeamDetail teamNumber={item.teamNumber} />} />
                <Action.OpenInBrowser url={`https://ftcscout.org/teams/${item.teamNumber}`} />
              </ActionPanel>
            }
          />
        ) : null
      )}
    </List>
  );
}

function TeamDetail({ teamNumber }: { teamNumber: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([
    {
      name: "",
      humanName: "",
      valid: false,
      matches: [
        {
          matchId: 0,
          event: "",
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
  ]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setEvents([]);
    setIsLoading(true);
    fetch(`https://api.ftcscout.org/rest/v1/teams/${teamNumber}/events/2024`)
      .then((response) => response.json())
      .then((data) => {
        interface Event {
          eventCode: string;
          stats: object | null;
        }
        const newEvents = data.map((event: Event) => ({
          name: event.eventCode,
          valid: event.stats !== null,
          matches: [],
        }));
        setEvents(newEvents);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, [teamNumber]);

  useEffect(() => {
    if (events.length === 0) return;

    const validEvents = events.filter((event) => event.valid && event.matches.length === 0);
    if (validEvents.length === 0) return;

    validEvents.forEach((event) => {
      console.log("Processing event:", event.name);
      fetch(`https://api.ftcscout.org/rest/v1/events/2024/${event.name}`)
        .then((response) => response.json())
        .then((res) => {
          event.humanName = res.name;
        })
        .catch((error) => {
          console.error("Error fetching event details:", error);
        });
      fetch(`https://api.ftcscout.org/rest/v1/events/2024/${event.name}/matches`)
        .then((response) => response.json())
        .then((data) => {
          const matches = Array.isArray(data)
            ? data
                .filter(
                  (match) =>
                    match.teams && match.teams.some((team: { teamNumber: string }) => team.teamNumber === teamNumber),
                )
                .map((match) => {
                  const red0 =
                    match.teams.find(
                      (team: { alliance: string; station: string }) =>
                        team.alliance === "Red" && team.station === "One",
                    )?.teamNumber || 0;
                  const red1 =
                    match.teams.find(
                      (team: { alliance: string; station: string }) =>
                        team.alliance === "Red" && team.station === "Two",
                    )?.teamNumber || 0;
                  const blue0 =
                    match.teams.find(
                      (team: { alliance: string; station: string }) =>
                        team.alliance === "Blue" && team.station === "One",
                    )?.teamNumber || 0;
                  const blue1 =
                    match.teams.find(
                      (team: { alliance: string; station: string }) =>
                        team.alliance === "Blue" && team.station === "Two",
                    )?.teamNumber || 0;

                  const redTotal = match.scores?.red?.totalPoints ?? 0;
                  const blueTotal = match.scores?.blue?.totalPoints ?? 0;
                  const redAuto = match.scores?.red?.autoPoints ?? 0;
                  const blueAuto = match.scores?.blue?.autoPoints ?? 0;
                  const redDC = match.scores?.red?.dcPoints ?? 0;
                  const blueDC = match.scores?.blue?.dcPoints ?? 0;
                  const redEndgame = match.scores?.red?.dcParkPoints ?? 0;
                  const blueEndgame = match.scores?.blue?.dcParkPoints ?? 0;
                  const name = match.tournamentLevel === "Quals" ? `Qual ${match.id}` : `Playoff ${match.series}`;
                  const longName =
                    match.tournamentLevel === "Quals" ? `Qualification ${match.id}` : `Playoff ${match.series}`;
                  return {
                    event: event.name,
                    matchId: match.id,
                    name,
                    longName,
                    redTotal,
                    blueTotal,
                    redAuto,
                    blueAuto,
                    redDC,
                    blueDC,
                    redEndgame,
                    blueEndgame,
                    red0,
                    red1,
                    blue0,
                    blue1,
                    alliance: red0 === parseInt(teamNumber) || red1 === parseInt(teamNumber) ? "red" : "blue",
                    win:
                      red0 === parseInt(teamNumber) || red1 === parseInt(teamNumber)
                        ? parseInt(redTotal) > parseInt(blueTotal)
                        : parseInt(blueTotal) > parseInt(redTotal),
                    tie: parseInt(redTotal) === parseInt(blueTotal),
                  };
                })
                .sort((a, b) => a.matchId - b.matchId)
            : [];
          setEvents((prevEvents) => {
            const updatedEvents = [...prevEvents];
            const eventIndex = updatedEvents.findIndex((e) => e.name === event.name);
            if (eventIndex !== -1) {
              updatedEvents[eventIndex].matches = matches;
            }
            return updatedEvents;
          });
        })
        .catch((error) => {
          console.error("Error fetching matches:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
      console.log(`Matches for event ${event.name}:`, event.matches.length);
    });
    setSelectedId(events[0].matches[0]?.matchId.toString() + events[0].matches[0]?.event);
  }, [events, teamNumber]);

  return (
    <List isLoading={isLoading} isShowingDetail selectedItemId={selectedId}>
      {events.map((event, index) => (
        <List.Section key={index} title={event.humanName}>
          {event.matches.map((match, matchIndex) => (
            <List.Item
              key={matchIndex}
              title={match.name}
              id={match.matchId.toString() + match.event}
              accessories={
                match.tie
                  ? [{ text: { value: `Tie`, color: Color.Yellow } }]
                  : match.win
                  ? [{ text: { value: `Win`, color: Color.Green } }]
                  : [{ text: { value: `Loss`, color: Color.Red } }]
              }
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.TagList title="Teams">
                        <List.Item.Detail.Metadata.TagList.Item text={match.red0.toString()} color={Color.Red} />
                        <List.Item.Detail.Metadata.TagList.Item text={match.red1.toString()} color={Color.Red} />
                        <List.Item.Detail.Metadata.TagList.Item text={match.blue0.toString()} color={Color.Blue} />
                        <List.Item.Detail.Metadata.TagList.Item text={match.blue1.toString()} color={Color.Blue} />
                      </List.Item.Detail.Metadata.TagList>
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.TagList title="Auto">
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.redAuto.toString()}
                          color={match.redAuto === match.blueAuto ? Color.Purple : match.redAuto > match.blueAuto ? Color.Red : Color.SecondaryText}
                        />
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.blueAuto.toString()}
                          color={match.blueAuto === match.redAuto ? Color.Purple : match.blueAuto > match.redAuto ? Color.Blue : Color.SecondaryText}
                        />
                      </List.Item.Detail.Metadata.TagList>
                      <List.Item.Detail.Metadata.TagList title="TeleOp">
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.redDC.toString()}
                          color={match.redDC === match.blueDC ? Color.Purple : match.redDC > match.blueDC ? Color.Red : Color.SecondaryText}
                        />
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.blueDC.toString()}
                          color={match.blueDC === match.redDC ? Color.Purple : match.blueDC > match.redDC ? Color.Blue : Color.SecondaryText}
                        />
                      </List.Item.Detail.Metadata.TagList>
                      <List.Item.Detail.Metadata.TagList title="Endgame">
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.redEndgame.toString()}
                          color={match.redEndgame === match.blueEndgame ? Color.Purple : match.redEndgame > match.blueEndgame ? Color.Red : Color.SecondaryText}
                        />
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.blueEndgame.toString()}
                          color={match.blueEndgame === match.redEndgame ? Color.Purple : match.blueEndgame > match.redEndgame ? Color.Blue : Color.SecondaryText}
                        />
                      </List.Item.Detail.Metadata.TagList>
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.TagList title="Total">
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.redTotal.toString()}
                          color={match.redTotal === match.blueTotal ? Color.Purple : match.redTotal > match.blueTotal ? Color.Red : Color.SecondaryText}
                        />
                        <List.Item.Detail.Metadata.TagList.Item
                          text={match.blueTotal.toString()}
                          color={match.blueTotal === match.redTotal ? Color.Purple : match.blueTotal > match.redTotal ? Color.Blue : Color.SecondaryText}
                        />
                      </List.Item.Detail.Metadata.TagList>
                    </List.Item.Detail.Metadata>
                  }
                />
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
