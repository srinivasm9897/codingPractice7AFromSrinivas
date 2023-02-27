const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// get all player details in table

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const PlayerArray = await database.all(getPlayerQuery);
  response.send(
    PlayerArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

// get one player details in table

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT 
      * 
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const Player = await database.get(getPlayersQuery);
  response.send(convertDbObjectToResponseObject(Player));
});

//Update player details in table

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// get all match details in table

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/", async (request, response) => {
  const getMatchQuery = `
    SELECT
        *
    FROM
      match_details;`;
  const MatchArray = await database.all(getMatchQuery);
  response.send(
    MatchArray.map((each) => convertDbObjectToResponseObject2(each))
  );
});

// get one match details in table

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const Match = await database.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject2(Match));
});

// get one match details for one player in table

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      * 
    FROM player_match_score NATURAL JOIN
      match_details 
    WHERE 
      player_id = ${playerId};`;
  const Player = await database.all(getPlayerMatchQuery);
  response.send(Player.map((each) => convertDbObjectToResponseObject2(each)));
});

// get one player details for one match in table

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      * 
    FROM player_match_score NATURAL JOIN
      player_details 
    WHERE 
      match_id = ${matchId};`;
  const Match = await database.all(getPlayerMatchQuery);
  response.send(Match.map((each) => convertDbObjectToResponseObject(each)));
});

// get total cases,cured,active,deaths from state in  table

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `  
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
  FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
  WHERE 
    player_details.player_id = ${playerId};
    `;
  const PlayerScores = await database.get(getPlayerScoresQuery);
  console.log(PlayerScores);
  response.send(PlayerScores);
});

module.exports = app;
