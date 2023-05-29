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

app.get("/", (_, res) => {
  res.send("index");
});

app.post("/", async (req, res) => {
  try {
    let type = req.body.type;
    if (type === "forex") {
      let token = req.body.token;
      let accountId = req.body.accountId;
      const accountData = await getMetaApiAccountData(token, accountId);
      res.json({ _result: "1", accountData });
      return;
    } else if (type === "crypto") {
      res.json({ _result: "1" });
      return;
    }
  } catch {}
  res.json({ _result: "0" });
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
    let connection = account.getStreamingConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const historyStorage = connection.historyStorage;
    const result = {
      accountInformation: connection.accountInformation,
      positions: connection.positions,
      deals: historyStorage.deals,
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
