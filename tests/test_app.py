import copy

from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)
INITIAL_ACTIVITIES = copy.deepcopy(activities)


def setup_function():
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))


def test_get_activities_returns_valid_activity_data():
    # Arrange
    activity_name = "Chess Club"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert activity_name in data
    assert data[activity_name]["description"] == "Learn strategies and compete in chess tournaments"
    assert data[activity_name]["max_participants"] == 12
    assert isinstance(data[activity_name]["participants"], list)


def test_signup_for_activity_success_when_spots_available():
    # Arrange
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    assert email not in activities[activity_name]["participants"]

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities[activity_name]["participants"]


def test_signup_returns_400_for_duplicate_participant():
    # Arrange
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    assert email in activities[activity_name]["participants"]

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_returns_400_when_activity_is_full():
    # Arrange
    activity_name = "Chess Club"
    max_participants = activities[activity_name]["max_participants"]
    activities[activity_name]["participants"] = [f"user{i}@example.com" for i in range(max_participants)]
    email = "waitlist@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"
    assert email not in activities[activity_name]["participants"]


def test_unregister_participant_success():
    # Arrange
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    assert email in activities[activity_name]["participants"]

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    assert email not in activities[activity_name]["participants"]


def test_unregister_participant_returns_404_for_missing_participant():
    # Arrange
    activity_name = "Chess Club"
    email = "missing@mergington.edu"
    assert email not in activities[activity_name]["participants"]

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found for this activity"
