//@ts-check
const fs = require("fs");
const path = require("path");

module.exports = function(options = { encoding: "utf8", filename: "./workflow.json" }) {
    let {filename, encoding} = options;

    return function(req, res, next) {
        req.getStates = function(flowName) {
            const data = fs.readFileSync(filename);
            let json = JSON.parse(data.toString(encoding));
            if ("flow" in json && flowName in json.flow) {
                return json.flow[flowName].states;
            }
        };
        next();
    };
};
