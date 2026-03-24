const pool = require('../utils/databaseutil');

const getusers = async (req, res, next) => {
  try {

    const users = await pool.query("SELECT id,username, email, role FROM registerdetails where role = $1",["user"]);

    res.render("admin_dashboard", { users: users.rows });

  } catch (err) {
    console.error(err);
    res.send("Error loading admin dashboard");
  }
};

const user_link_details = async (req, res) => {

    try {
        const id = req.params.id;
        console.log(id);

        const userResult = await pool.query(
            "SELECT * FROM registerdetails WHERE id = $1",
            [id]
        );

        const linksResult = await pool.query(
            "SELECT * FROM links WHERE user_id = $1",
            [id]
        );

        res.render("admin_user_links", {
            user: userResult.rows[0],
            links: linksResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

const link_analytics = async (req, res) => {
    try {
        const link_id = req.params.id;

        const linkResult = await pool.query(
            "SELECT * FROM links WHERE id = $1",
            [link_id]
        );

        const analyticsResult = await pool.query(
            "SELECT * FROM link_details WHERE link_id = $1 ORDER BY accessed_at DESC",
            [link_id]
        );

        res.render("admin_link_analytics", {
            link: linkResult.rows[0],
            analytics: analyticsResult.rows,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading analytics");
    }
};

const logoutuser = async (req, res) => {

  const refresh_token = req.cookies.refresh_token;

  if (refresh_token) {
    await pool.query(
      "UPDATE registerdetails SET refresh_token = NULL WHERE refresh_token = $1",
      [refresh_token]
    );
  }

  res.clearCookie("accesstoken");
  res.clearCookie("refresh_token");

  res.redirect("/login");
};

module.exports = { getusers, logoutuser,user_link_details,link_analytics };
