// Authentication and Cashier Management Service for Sukie Liquid Soap POS

const USERS_STORAGE_KEY = "sukie_users_list_v1";
const SESSION_STORAGE_KEY = "sukie_active_session_v1";

const DEFAULT_USERS = [
  {
    id: "usr-default-1",
    username: "getachew",
    fullName: "Getachew Abebe",
    shopName: "Sukie Liquid Soap",
    phone: "+251 91 100 0000",
    role: "Owner",
    pin: "1234",
    createdAt: new Date().toISOString(),
  },
];

export const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch (err) {
    console.error("Error reading users list:", err);
    return DEFAULT_USERS;
  }
};

export const getActiveSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading session:", err);
    return null;
  }
};

export const loginUser = (identifier, pinOrPassword) => {
  const users = getRegisteredUsers();
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPin = (pinOrPassword || "").trim();

  const user = users.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      (u.phone && u.phone.replace(/\s+/g, "") === cleanId.replace(/\s+/g, ""))
  );

  if (!user) {
    return {
      success: false,
      error: "User not found. Please register or check your username/phone.",
    };
  }

  if (user.pin && user.pin !== cleanPin && user.password !== cleanPin) {
    return {
      success: false,
      error: "Incorrect PIN or password. Try '1234' for demo.",
    };
  }

  // Create session
  const session = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return { success: true, user: session };
};

export const registerUser = ({
  fullName,
  username,
  shopName,
  phone,
  role = "Owner",
  pin,
}) => {
  const users = getRegisteredUsers();
  const cleanUsername = (username || "").trim().toLowerCase();
  const cleanPhone = (phone || "").trim();
  const cleanPin = (pin || "").trim();
  const cleanName = (fullName || "").trim();
  const cleanShop = (shopName || "").trim() || "Sukie Liquid Soap";

  if (!cleanName) {
    return { success: false, error: "Full Name is required." };
  }

  if (!cleanUsername) {
    return { success: false, error: "Username is required." };
  }

  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: "PIN/Password must be at least 4 characters." };
  }

  // Check if username already exists
  const existingUser = users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (cleanPhone && u.phone && u.phone.replace(/\s+/g, "") === cleanPhone.replace(/\s+/g, ""))
  );

  if (existingUser) {
    return {
      success: false,
      error: "A user with this username or phone number already exists.",
    };
  }

  const newUser = {
    id: `usr-${Date.now().toString().slice(-6)}`,
    username: cleanUsername,
    fullName: cleanName,
    shopName: cleanShop,
    phone: cleanPhone || "+251 90 000 0000",
    role,
    pin: cleanPin,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  // Automatically start session
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));

  return { success: true, user: newUser };
};

export const logoutUser = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error("Error logging out:", err);
  }
};

export const updateActiveUserProfile = (userId, updates) => {
  const users = getRegisteredUsers();
  const updatedUsers = users.map((u) => {
    if (u.id === userId) {
      return { ...u, ...updates };
    }
    return u;
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  const currentSession = getActiveSession();
  if (currentSession && currentSession.id === userId) {
    const newSession = { ...currentSession, ...updates };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    return newSession;
  }
  return null;
};
