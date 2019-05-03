//@ts-check
const fs = require("fs");
const path = require("path");

var session = {
    empty: true,
    ids: {},
};

module.exports = function(options = {
        emptyFields: {},
        encoding: "utf8",
        filename: "workflow.json",
        flowName: "",
    }) {
    let {filename, encoding, emptyFields, flowName} = options;

    function getStates() {
        const data = fs.readFileSync(path.resolve(__dirname, filename));
        let json = JSON.parse(data.toString(encoding));
        if ("flow" in json && flowName in json.flow) {
            return json.flow[flowName].states;
        }
    }

    return function(req, res, next) {

        const {id} = req.query;
        if (req.method === "POST") {
            const {event, patch} = req.body;

            if (!(id in session.ids)) {
                session.ids[id] = { fields: {} };
            }

            switch (event) {
                case "UPDATE":
                    console.log(`updating session ${id}`);
                    session.ids[id] = {...session.ids[id], ...patch};
                    if (session.ids[id].page === getStates().length) {
                        console.log(`session with id ${id} is finished; clearing everything`);
                        session.ids[id] = {};
                        res.status(200).send({status: "FINISHED"});
                        return;
                    }
                break;

                case "CLEAR":
                    console.log(`clearing session ${id}`);
                    session.ids[id] = { fields: {} };
                break;
            }
            res.status(200).send({ status: "CONTINUE" });

        } else if (req.method === "GET") {

            let status = "ACTIVE";
            if (!(id in session.ids)) {
                session.ids[id] = { };
                status = "INACTIVE";
            }

            let states = getStates();

            res.send({
                fields: session.ids[id].fields || emptyFields,
                page: session.ids[id].page || 0,
                states,
                status,
            });
        } else {
            res.status(200).send();
        }
    };
};
