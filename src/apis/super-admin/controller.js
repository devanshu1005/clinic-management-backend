const jwt = require("jsonwebtoken");


exports.loginSuperAdmin = async ({ body }) => {
  const { email, password } = body;

  if (
    email !== process.env.SUPER_ADMIN_EMAIL ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid credentials",
    };
  }

  const token = jwt.sign(
    {
      role: "SUPER_ADMIN",
      email: process.env.SUPER_ADMIN_EMAIL,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    statusCode: 200,
    success: true,
    message: "Super Admin login successful",
    data: {
      token,
      superAdmin: {
        name: process.env.SUPER_ADMIN_NAME || "Super Admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
      },
    },
  };
};