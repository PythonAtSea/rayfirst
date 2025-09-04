import { Action, ActionPanel, Color, List } from "@raycast/api";
import { useState, useRef, useEffect } from "react";
import fetchOrig from "node-fetch";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });
const fetch = (url: string, options = {}) => fetchOrig(url, { ...options, agent });

export default function Command() {
  const [items, setItems] = useState([
    {
      teamName: "Search for a team",
      teamNumber: "",
      about: true,
      totalOPR: 0,
      autoOPR: 0,
      teleOPR: 0,
      egOPR: 0,
      location: "",
      rookieYear: 0,
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
      fetch(`https://api.ftcscout.j5155.page/rest/v1/teams/search?searchText=${text}&limit=100`, {
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
                location: `${team.city}, ${team.state}, ${team.country}`,
                rookieYear: team.rookieYear,
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
      fetch(`https://api.ftcscout.j5155.page/rest/v1/teams/${id}/quick-stats`, {
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
                    {item.totalOPR !== 0 && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label title="Total OPR" text={item.totalOPR.toFixed(2).toString()} />
                        <List.Item.Detail.Metadata.Label title="Teleop OPR" text={item.teleOPR.toFixed(2).toString()} />
                        <List.Item.Detail.Metadata.Label title="Auto OPR" text={item.autoOPR.toFixed(2).toString()} />
                        <List.Item.Detail.Metadata.Label title="Endgame OPR" text={item.egOPR.toFixed(2).toString()} />
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
        ) : (
          <List.Item
            key={index}
            title={item.teamName}
            subtitle={item.teamNumber}
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Link
                      title="Developed by"
                      target="https://github.com/pythonatsea"
                      text="pythonatsea"
                    />
                    <List.Item.Detail.Metadata.Link
                      title="FTC Data from"
                      target="https://ftcscout.org/api"
                      text="FTCScout"
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
          />
        ),
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
          name: "",
          redScore: 0,
          blueScore: 0,
          red0: 0,
          red1: 0,
          blue0: 0,
          blue1: 0,
          alliance: "",
          win: false,
        },
      ],
    },
  ]);

  useEffect(() => {
    setEvents([]);
    setIsLoading(true);
    fetch(`https://api.ftcscout.j5155.page/rest/v1/teams/${teamNumber}/events/2024`)
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
      fetch(`https://api.ftcscout.org/rest/v1/events/2024/${event.name}/matches`)
        .then((response) => response.json())
        .then((res) => {
          if (res.eventCode !== "FTCCMP1EDIS" && res.eventCode !== "USCHSLAOS") {
            console.log("Fetched matches:", res[0]);
          }
          return res;
        })
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

                  const redScore = match.scores?.red?.totalPoints ?? 0;
                  const blueScore = match.scores?.blue?.totalPoints ?? 0;

                  return {
                    matchId: match.id,
                    name: match.name,
                    redScore,
                    blueScore,
                    red0,
                    red1,
                    blue0,
                    blue1,
                    alliance: red0 === parseInt(teamNumber) || red1 === parseInt(teamNumber) ? "red" : "blue",
                    win:
                      red0 === parseInt(teamNumber) || red1 === parseInt(teamNumber)
                        ? parseInt(redScore) > parseInt(blueScore)
                        : parseInt(blueScore) > parseInt(redScore),
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
  }, [events, teamNumber]);

  return (
    <List isLoading={isLoading} isShowingDetail>
      {events.map((event, index) => (
        <List.Section key={index} title={`Matches for event ${event.name}`}>
          {event.matches.map((match, matchIndex) => (
            <List.Item
              key={matchIndex}
              title={`Match ${match.matchId}`}
              accessories={
                match.win
                  ? [{ text: { value: `Win`, color: Color.Green } }]
                  : [{ text: { value: `Loss`, color: Color.Red } }]
              }
              detail={
                <List.Item.Detail
                  markdown={
                    "#  " +
                    match.name +
                    "\n\n" +
                    "\n\n| Teams                |       Score |\n" +
                    "|----------------------|-------------:|\n" +
                    `| ${match.red0 === parseInt(teamNumber) || match.red1 === parseInt(teamNumber) ? `*${match.red0}*, *${match.red1}*` : `${match.red0}, ${match.red1}`} | ${match.redScore === Math.max(match.redScore, match.blueScore) ? `**${match.redScore}**` : `${match.redScore}`} (Red) |\n` +
                    `| ${match.blue0 === parseInt(teamNumber) || match.blue1 === parseInt(teamNumber) ? `*${match.blue0}*, *${match.blue1}*` : `${match.blue0}, ${match.blue1}`} | ${match.blueScore === Math.max(match.redScore, match.blueScore) ? `**${match.blueScore}**` : `${match.blueScore}`} (Blue) |`
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
