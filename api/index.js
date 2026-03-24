const app = require("../index");

export default function handler(req, res) {
  return app(req, res);
}