document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupHint = document.getElementById("signup-hint");
  const submitButton = signupForm.querySelector("button[type='submit']");
  let activitiesData = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      activitiesData = activities;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const spotsText =
          spotsLeft === 1
            ? "1 spot left"
            : spotsLeft === 0
            ? "No spots left"
            : `${spotsLeft} spots left`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsText}</p>
          ${spotsLeft === 0 ? '<p class="activity-full">This activity is full and sign-ups are closed.</p>' : ""}
        `;

        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsDiv.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const participantLabel = document.createElement("span");
            participantLabel.textContent = participant;
            listItem.appendChild(participantLabel);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.title = "Unregister participant";
            removeButton.textContent = "✕";
            removeButton.addEventListener("click", () => {
              unregisterParticipant(name, participant);
            });
            listItem.appendChild(removeButton);

            participantsList.appendChild(listItem);
          });
          participantsDiv.appendChild(participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty";
          emptyMessage.textContent = "No students have signed up yet.";
          participantsDiv.appendChild(emptyMessage);
        }

        activityCard.appendChild(participantsDiv);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      updateSignupState();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function updateSignupState() {
    const selectedActivity = activitiesData[activitySelect.value];

    if (!selectedActivity) {
      signupHint.textContent = "";
      signupHint.className = "info hidden";
      submitButton.disabled = false;
      return;
    }

    const spotsLeft = selectedActivity.max_participants - selectedActivity.participants.length;
    if (spotsLeft === 0) {
      signupHint.textContent = "This activity is full. Sign-up is closed.";
      signupHint.className = "info";
      submitButton.disabled = true;
    } else {
      signupHint.textContent = "";
      signupHint.className = "info hidden";
      submitButton.disabled = false;
    }
  }

  activitySelect.addEventListener("change", updateSignupState);

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to remove participant";
        messageDiv.className = "error";
      }
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error removing participant:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const selectedActivity = activitiesData[activity];
    const spotsLeft = selectedActivity
      ? selectedActivity.max_participants - selectedActivity.participants.length
      : null;

    if (spotsLeft === 0) {
      messageDiv.textContent = "This activity is full. You cannot sign up.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
