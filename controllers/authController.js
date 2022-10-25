const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  // do stuff
  const { email, password } = req.body;

  if (!email || !password || (password && password.length < 6)) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  const foundUser = await User.findOne({ email });

  if (!foundUser) {
    return res.status(400).json({
      success: false,
      message: "User not found, Please chek email and password!",
    });
  }

  const matchPwd = await bcrypt.compare(password, foundUser.password);

  if (!matchPwd) {
    return res.status(400).json({
      success: false,
      message: "Wrong password, please enter your password!",
    });
  }

  // token, viene restituito come res.json
  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
  // refresh token restituito come res.cookie (per le future chiamate per avere un nuovo token)
  const refreshToken = jwt.sign(
    { email: foundUser.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessibile sol oda web browser
    secure: true, //https disattivo per test
    sameSite: "None", //cors
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });

  const userResponse = {
    name: foundUser.name,
    surname: foundUser.surname,
    email: foundUser.email,
    username: foundUser.username,
    posts: foundUser.posts,
    isAuthor: foundUser.isAuthor,
    birthDate: foundUser.birthDate,
    id: foundUser._id,
  };

  if (foundUser.profilePicture) {
    userResponse.profilePicture = foundUser.profilePicture;
  }

  res.json({
    success: true,
    accessToken,
    user: userResponse,
  });
});

// @desc Refresh
// @route POST /auth/refresh
// @access Public - because access token expired
const refresh = (req, res) => {
  //mando il cookie con il refresh token in richiesta
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({
      success: false,
      message: "No cookie token given, unauthorized!",
    });
  }

  // token verify, ha terzo parametro handler dopo verifica
  const isValidToken = jwt.verify(
    cookies?.jwt,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid token given, unauthorized!",
        });
      }

      const foundUser = await User.findOne({ email: decoded.email });

      if (!foundUser) {
        return res.status(401).json({
          success: false,
          message: "No user found, unauthorized!",
        });
      }

      const newAccessToken = jwt.sign(
        {
          UserInfo: {
            email: foundUser.email,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      const userResponse = {
        name: foundUser.name,
        surname: foundUser.surname,
        email: foundUser.email,
        username: foundUser.username,
        posts: foundUser.posts,
        isAuthor: foundUser.isAuthor,
        birthDate: foundUser.birthDate,
        id: foundUser._id,
      };

      if (foundUser.profilePicture) {
        userResponse.profilePicture = foundUser.profilePicture;
      }

      res.json({
        success: true,
        accessToken: newAccessToken,
        user: userResponse,
      });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ success: true, message: "Cookie cleared, logout success" });
};

module.exports = { login, refresh, logout };
