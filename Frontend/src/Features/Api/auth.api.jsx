import axios from "axios";

export const githubLogin = async () => {
  try {
    const res = await axios.post("http://localhost:3000/api/auth/github-login");

    if (res.data.url) {
      window.location.href = res.data.url;
    }

    return res.data;
  } catch (error) {
    console.log("GitHub Login Error:", error);
    throw error;
  }
};
