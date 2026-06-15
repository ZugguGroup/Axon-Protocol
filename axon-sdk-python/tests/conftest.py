import pytest
from axon.client import AxonClient, AxonSyncClient

TEST_API_KEY = "axon-testkey-abc123"
TEST_PROJECT_ID = "test-project"
TEST_BASE_URL = "http://localhost:8000"


@pytest.fixture
def axon():
    """Returns an AxonClient pointed at the test base URL with a test key."""
    return AxonClient(
        api_key=TEST_API_KEY,
        project_id=TEST_PROJECT_ID,
        base_url=TEST_BASE_URL,
    )


@pytest.fixture
def axon_sync():
    """Returns an AxonSyncClient pointed at the test base URL with a test key."""
    return AxonSyncClient(
        api_key=TEST_API_KEY,
        project_id=TEST_PROJECT_ID,
        base_url=TEST_BASE_URL,
    )
