const friends = await res.json();


async function addFriend() {
  const friend = document.getElementById('friendUsername').value;
  const token = localStorage.getItem("token");

  const res = await fetch(`${apiUrl}/add_friend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ friend })
  });

  const data = await res.json();
  if (res.ok) {
    alert("Friend added!");
  } else {
    alert("Error: " + data.msg);
  }
}

async function getFriends() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${apiUrl}/get_friends`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const data = await res.json();
  if (res.ok) {
    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';
    data.friends.forEach(friend => {
      const li = document.createElement('li');
      li.textContent = friend;
      friendList.appendChild(li);
    });
  } else {
    alert("Error: " + data.msg);
  }
}
const res = await fetch('/get_friends', {
    headers: { Authorization: `Bearer ${token}` }
});



