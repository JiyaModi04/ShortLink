const path = require('path');
const rootdir = require('../utils/pathutil');
const pool = require('../utils/databaseutil');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {nanoid} = require('nanoid');
const qrcode = require('qrcode');


const getregisteruser = (req, res, next) => {
    try {
        console.log(req.url, req.method);
        res.sendFile(path.join(rootdir, 'views', 'register.html'));
    } catch (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Server Error');
    }
};

const getloginuser = (req, res, next) => {
    try {
        console.log(req.url, req.method);
        res.sendFile(path.join(rootdir, 'views', 'login.html'));
    } catch (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Server Error');
    }
};

const postregisteruser = async (req,res) =>{
    try {

    console.log(req.body);

    const { username, email, role, password, confirmpassword } = req.body;

    if (!username || !email || !role || !password || !confirmpassword) {
      return res.send('All fields are required');
    }

    if(password !== confirmpassword){
      return res.send('Incorrect password match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO registerdetails (username, email, role, password, confirmpassword) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [username, email, role, hashedPassword, hashedPassword]
    );

    const id = result.rows[0].id;

    const accesstoken = jwt.sign(
        { id: id, email: email, role: role },
        "access_key",
        { expiresIn: "15m" }
      );
    
    const refresh_token = jwt.sign(
        { id: id },
        "refresh_key",
        { expiresIn: "5d" }
      );

    await pool.query(
      "UPDATE registerdetails SET refresh_token = $1 WHERE id = $2",
      [refresh_token, id]
    );

    res.cookie("accesstoken", accesstoken, { httpOnly: true });
    res.cookie("refresh_token", refresh_token, { httpOnly: true });

    console.log('Data Inserted',result);

    if(role == "admin"){
      return res.redirect("/admin/dashboard");
    }
    else{
      return res.redirect("/user/dashboard/shortlink");
    }

  } catch (err) {
    console.error('Error inserting data:', err);
    res.send('Database error');
  }
}

const postloginuser = async (req,res) =>{
    try {

    console.log(req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.send('fields are required');
    }

    const result = await pool.query(
      "Select * from registerdetails where email = $1",
      [email]
    );

    if(result.rows.length === 0){
        return res.send("Account not found");
    }

    const account = result.rows[0];

    const isMatch = await bcrypt.compare(password, account.password);

    if (!isMatch) {
      return res.send("Invalid password");
    }

    const id = result.rows[0].id;

      const accesstoken = jwt.sign(
        { id: id, email: email, role: account.role },
        "access_key",
        { expiresIn: "15m" }
      );
    
    const refresh_token = jwt.sign(
        { id: id },
        "refresh_key",
        { expiresIn: "5d" }
      );

    await pool.query(
      "UPDATE registerdetails SET refresh_token = $1 WHERE id = $2",
      [refresh_token, id]
    );

    res.cookie("accesstoken", accesstoken, { httpOnly: true });
    res.cookie("refresh_token", refresh_token, { httpOnly: true });

    if(account.role === "admin"){
      return res.redirect("/admin/dashboard");
    }
    else{
      return res.redirect("/user/dashboard/shortlink");
    }

  } catch (err) {
    console.error('Error fetching data:', err);
    res.send('Database error');
  }
}

const refreshaccesstoken = async (req, res) => {
  try {

    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(refresh_token,"refresh_key");

    const user = await pool.query(
      "SELECT * FROM registerdetails WHERE id = $1 AND refresh_token = $2",
      [decoded.id, refresh_token]
    );

    if (user.rows.length === 0) {
      return res.redirect("/login");
    }

    const newaccesstoken = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      "access_key",
      { expiresIn: "15m" }
    );

    res.cookie("accesstoken", newaccesstoken, { httpOnly: true });

    const userdata = result.rows[0];

    if(userdata.role === "admin"){
      return res.redirect("/admin/dashboard");
    }
    else{
      return res.redirect("/user/dashboard/shortlink");
    }

  } catch (err) {
    return res.redirect("/login");
  }
};

const geturluser = (req, res, next) => {
    try {
        console.log(req.url, req.method);
        res.render('user_dashboard');
    } catch (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Server Error');
    }
};

const posturluser = async (req, res) => {
  try {

    const { original_url, short_code_option, custom_code, expiry_date } = req.body;
    const user_id = req.user.id;

    let finalCode;

    if (short_code_option === "custom") {

      if (!custom_code || custom_code.trim() === "") {
        return res.status(400).send("Custom code cannot be empty");
      }

      const existing = await pool.query(
        "SELECT * FROM links WHERE short_code = $1",
        [custom_code]
      );

      if (existing.rows.length > 0) {
        return res.status(400).send("Short code already taken");
      }

      finalCode = custom_code;

    } else {
      finalCode = nanoid(6);

      let check = await pool.query(
        "SELECT * FROM links WHERE short_code = $1",
        [finalCode]
      );

      while (check.rows.length > 0) {
        finalCode = nanoid(6);
        check = await pool.query(
          "SELECT * FROM links WHERE short_code = $1",
          [finalCode]
        );
      }
    }

    let short_url;

    short_url =  `http://localhost:3000/${finalCode}`;

    await pool.query(
      "INSERT INTO links (user_id, original_url, short_code, expiry_date, short_url) VALUES ($1, $2, $3, $4, $5)",
      [user_id, original_url, finalCode, expiry_date, short_url]
    );

    res.send(`<a href = ${short_url}>Short_Url generated => ${short_url}</a>`);
   
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).send("Database error");
  }
};

const generate_qr_code = async (req, res) => {
  try {

    const { original_url,short_code_option, custom_code, expiry_date } = req.body;
    const user_id = req.user.id;

    const existing = await pool.query(
      "SELECT * FROM links WHERE original_url = $1 AND user_id = $2",
      [original_url, user_id]
    );

    let short_url;
    let finalCode;

    if (existing.rows.length > 0) {

      short_url = existing.rows[0].short_url;
      finalCode = existing.rows[0].short_code;

      if (existing.rows[0].qrcode_path) {
      return res.send({
      message: "QR already exists",
      short_url,
      qr_path: existing.rows[0].qrcode_path
    });
  }

    const options = {
      type: "png",
      quality: 1.5,
      width: 2000,
      margin: 3,
      color: {
      dark: "#000000",   
      light: "#ffffff"  
    }
    };

    const fileName = `qr_${finalCode}.png`;
    const filePath = path.join(__dirname, "../uploads/qrcodes", fileName);

    await qrcode.toFile(filePath, short_url, options);
    
    const img_path = `/uploads/qrcodes/${fileName}`;
    console.log(img_path);

    await pool.query(
      "UPDATE links SET qrcode_path = $1 WHERE short_code = $2",
      [img_path, finalCode]
    );

    } else {

    if (short_code_option === "custom") {

      if (!custom_code || custom_code.trim() === "") {
        return res.status(400).send("Custom code cannot be empty");
      }

      const existing_custom = await pool.query(
        "SELECT * FROM links WHERE short_code = $1",
        [custom_code]
      );

      if (existing_custom.rows.length > 0) {
        return res.status(400).send("Short code already taken");
      }

      finalCode = custom_code;

    } else {
      finalCode = nanoid(6);

      let check = await pool.query(
        "SELECT * FROM links WHERE short_code = $1",
        [finalCode]
      );

      while (check.rows.length > 0) {
        finalCode = nanoid(6);
        check = await pool.query(
          "SELECT * FROM links WHERE short_code = $1",
          [finalCode]
        );
      }
    }

    short_url =  `http://localhost:3000/${finalCode}`;

    await pool.query(
      "INSERT INTO links (user_id, original_url, short_code, expiry_date, short_url) VALUES ($1, $2, $3, $4, $5)",
      [user_id, original_url, finalCode, expiry_date, short_url]
    );

    const options = {
      type: "png",
      quality: 1.5,
      width: 2000,
      margin: 3,
      color: {
      dark: "#000000",   
      light: "#ffffff"  
    }
    };

    const fileName = `qr_${finalCode}.png`;
    const filePath = path.join(__dirname, "../uploads/qrcodes", fileName);

    await qrcode.toFile(filePath, short_url, options);
    
    const img_path = `/uploads/qrcodes/${fileName}`;

    await pool.query(
      "UPDATE links SET qrcode_path = $1 WHERE short_code = $2",
      [img_path, finalCode]
    );
   
  }
    res.send({
      message: "QR code generated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("QR code generation failed");
  }
};

const redirect_original_url = async (req, res) => {
  try {
    const { short_code } = req.params;

    const result = await pool.query(
      "SELECT id, user_id, original_url, expiry_date FROM links WHERE short_code = $1",
      [short_code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Short URL not found");
    }

    const link = result.rows[0];

    if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
      return res.send("Link expired");
    }

    const useragent = req.headers['user-agent'] || "";
    const ip = req.ip;
    const time = new Date();

    const device = "Desktop";

    let browser = "Unknown";
    if (useragent.includes("Edg")) browser = "Edge";
    else if (useragent.includes("Brave")) browser = "Brave";
    else if (useragent.includes("Chrome")) browser = "Chrome";
    else if (useragent.includes("Firefox")) browser = "Firefox";

    await pool.query(
      `INSERT INTO link_details (link_id, user_id, ip, device, browser, accessed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [link.id, link.user_id, ip, device, browser, time]
    );

    await pool.query(
      "UPDATE links SET count = count + 1 WHERE short_code = $1",
      [short_code]
    );

    return res.redirect(link.original_url);

  } catch (err) {
    console.error("REDIRECT ERROR:", err);
    res.status(500).send("Server error");
  }
};

const getlinks = async (req, res) => {
  try {

    const user_id = req.user.id;
    console.log(user_id);

    const links = await pool.query("SELECT id, original_url, short_code, short_url, expiry_date, count, qrcode_path FROM links where user_id = $1 ORDER BY id ASC",[user_id]);

    res.render("user_links", { links: links.rows });

  } catch (err) {
    console.error(err);
    res.send("Error loading all links");
  }
};

const view_analytics =  async (req, res) => {
    try {
        const link_id = req.params.id;

        console.log(link_id);

        const user_id = req.user.id;

        console.log(user_id);

        const linkResult = await pool.query(
            "SELECT * FROM links WHERE id = $1 AND user_id = $2",
            [link_id, user_id]
        );

        if (linkResult.rows.length === 0) {
            return res.status(403).send("Unauthorized access");
        }

        const analyticsResult = await pool.query(
            "SELECT * FROM link_details WHERE link_id = $1 ORDER BY accessed_at DESC",
            [link_id]
        );

        res.render("user_link_analytics", {
            link: linkResult.rows[0],
            analytics: analyticsResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}

const logoutuser = async (req, res) => {

  const refresh_token = req.cookies.refresh_token;

  console.log("Refresh token:", refresh_token);

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

module.exports = {getregisteruser, postregisteruser, 
  getloginuser, postloginuser, geturluser, posturluser,
  refreshaccesstoken, logoutuser, redirect_original_url,
  getlinks,generate_qr_code,view_analytics};
