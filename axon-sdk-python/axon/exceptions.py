class AxonError(Exception):
    """Base exception for all Axon errors"""
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def __repr__(self):
        return f"{self.__class__.__name__}(message={self.message!r}, status_code={self.status_code})"


class AuthError(AxonError):
    """Raised when authentication fails. Wrong or missing API key or token."""
    pass


class LockConflictError(AxonError):
    """Raised when you try to acquire a lock that another agent already holds."""
    def __init__(self, resource_id: str = "", detail: str = None):
        msg = detail or f"Resource '{resource_id}' is already locked by another agent"
        super().__init__(msg, 409)
        self.resource_id = resource_id


class NotFoundError(AxonError):
    """Raised when the requested resource does not exist."""
    pass


class AxonPermissionError(AxonError):
    """Raised when the agent does not have permission to perform the action."""
    pass


class RateLimitError(AxonError):
    """Raised when the rate limit is exceeded."""
    def __init__(self, retry_after: int = 60):
        super().__init__(
            f"Rate limit exceeded. Retry after {retry_after} seconds.", 429
        )
        self.retry_after = retry_after


class ServerError(AxonError):
    """Raised when the Axon server returns a 5xx error."""
    pass


class AxonConnectionError(AxonError):
    """Raised when the SDK cannot connect to the Axon server at all."""
    pass
