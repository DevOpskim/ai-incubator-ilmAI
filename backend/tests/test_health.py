from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@patch("app.routes.health.check_database_connection", return_value=True)
def test_health_check_when_database_is_available(mock_db_check):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Ilm AI MVP backend is running",
        "database": "connected",
    }
    mock_db_check.assert_called_once()


@patch("app.routes.health.check_database_connection", side_effect=Exception("db down"))
def test_health_check_when_database_is_unavailable(mock_db_check):
    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["detail"]["database"] == "unavailable"
    mock_db_check.assert_called_once()
