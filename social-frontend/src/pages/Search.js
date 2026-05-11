import React, { useState } from "react";
import axios from "axios";
import "./Search.css";

function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  const searchUser = async () => {
    if (!query) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/search?name=${query}`
      );
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="search-container">

      <div className="search-box">
        <input
          placeholder="Search users..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={searchUser}>Search</button>
      </div>

      <div className="results">
        {users.map(u => (
          <div key={u._id} className="user-card">
            👤 {u.name}
          </div>
        ))}
      </div>

    </div>
  );
}

export default Search;