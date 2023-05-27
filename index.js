const express = require("express");
const bodyParser = require("body-parser");
const MetaApi = require("metaapi.cloud-sdk").default;

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "https://toptradersfunding.com");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("index");
});

app.post("/", async (req, res) => {
  let type = req.body.type;
  if (type === "forex") {
    let token = req.body.token;
    let accountId = req.body.accountId;
    const accountData = await getMetaApiAccountData(token, accountId);
    res.json({ _result: "1", accountData });
  } else if (type === "crypto") {
    res.json({ _result: "1" });
  } else {
    res.json({});
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function getMetaApiAccountData(token, accountId) {
  try {
    const api = new MetaApi(token);
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const initialState = account.state;
    const deployedStates = ["DEPLOYING", "DEPLOYED"];
    if (!deployedStates.includes(initialState)) {
      await account.deploy();
    }
    await account.waitConnected();
    let connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const result = {
      accountInformation: await connection.getAccountInformation(),
      positions: await connection.getPositions(),
      deals: await connection.getDealsByTimeRange(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    };
    if (!deployedStates.includes(initialState)) {
      await connection.close();
      await account.undeploy();
    }
    return result;
  } catch (err) {
    console.error(err);
  }
  return null;
}
