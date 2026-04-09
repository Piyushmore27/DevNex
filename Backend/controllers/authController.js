import axios from 'axios';

export const githubLogin = async (req, res) => {
  try {
    res.json({ message: "GitHub login working" });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
};
