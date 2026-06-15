import functools
from axon._base import _BaseClient, _BaseSyncClient
from axon.types import ReceiptInfo, ReceiptVerifyResult, StepsLogger, ReasoningStep


class ReceiptsClient(_BaseClient):

    async def create(
        self,
        input: str,
        steps: list,
        output: str,
        parent_receipt_id: str = None,
    ) -> ReceiptInfo:
        """
        Create a tamper-proof reasoning receipt (async).
        """
        steps_data = []
        for s in steps:
            if isinstance(s, ReasoningStep):
                steps_data.append(s.to_dict())
            elif isinstance(s, dict):
                steps_data.append(s)
            else:
                steps_data.append({"thought": str(s)})

        body = {"input": input, "steps": steps_data, "output": output}
        if parent_receipt_id is not None:
            body["parent_receipt_id"] = parent_receipt_id

        data = await self._request("POST", "/v1/receipts/create", json=body)
        return ReceiptInfo(
            receipt_id=data["receipt_id"],
            chain_hash=data["chain_hash"],
            signature=data["signature"],
            created_at=data["created_at"],
        )

    async def get(self, receipt_id: str) -> dict:
        """
        Get a full receipt by ID (async).
        """
        return await self._request("GET", f"/v1/receipts/{receipt_id}")

    async def verify(self, receipt_id: str) -> ReceiptVerifyResult:
        """
        Verify that a receipt has not been tampered with (async).
        """
        data = await self._request(
            "POST",
            "/v1/receipts/verify",
            params={"receipt_id": receipt_id},
        )
        return ReceiptVerifyResult(
            receipt_id=data["receipt_id"],
            valid=data["valid"],
            chain_hash=data["chain_hash"],
            recomputed_hash=data["recomputed_hash"],
            message=data["message"],
        )

    def track(self, input_param: str = None):
        """
        Decorator that automatically creates a reasoning receipt for an async function.
        """
        def decorator(func):
            @functools.wraps(func)
            async def wrapper(*args, **kwargs):
                logger = StepsLogger()
                kwargs["steps_logger"] = logger

                # Determine input value for the receipt
                input_value = "unknown"
                if input_param and input_param in kwargs:
                    input_value = str(kwargs[input_param])
                elif args:
                    input_value = str(args[0]) if len(args) == 1 else str(args)

                result = await func(*args, **kwargs)

                output_value = str(result) if result is not None else ""

                try:
                    steps = logger.get_steps()
                    if not steps:
                        steps = [{"thought": f"Function {func.__name__} executed"}]

                    await self.create(
                        input=input_value,
                        steps=steps,
                        output=output_value,
                    )
                except Exception:
                    pass

                return result
            return wrapper
        return decorator


class SyncReceiptsClient(_BaseSyncClient):

    def create(
        self,
        input: str,
        steps: list,
        output: str,
        parent_receipt_id: str = None,
    ) -> ReceiptInfo:
        """
        Create a tamper-proof reasoning receipt (sync).
        """
        steps_data = []
        for s in steps:
            if isinstance(s, ReasoningStep):
                steps_data.append(s.to_dict())
            elif isinstance(s, dict):
                steps_data.append(s)
            else:
                steps_data.append({"thought": str(s)})

        body = {"input": input, "steps": steps_data, "output": output}
        if parent_receipt_id is not None:
            body["parent_receipt_id"] = parent_receipt_id

        data = self._request("POST", "/v1/receipts/create", json=body)
        return ReceiptInfo(
            receipt_id=data["receipt_id"],
            chain_hash=data["chain_hash"],
            signature=data["signature"],
            created_at=data["created_at"],
        )

    def get(self, receipt_id: str) -> dict:
        """
        Get a full receipt by ID (sync).
        """
        return self._request("GET", f"/v1/receipts/{receipt_id}")

    def verify(self, receipt_id: str) -> ReceiptVerifyResult:
        """
        Verify that a receipt has not been tampered with (sync).
        """
        data = self._request(
            "POST",
            "/v1/receipts/verify",
            params={"receipt_id": receipt_id},
        )
        return ReceiptVerifyResult(
            receipt_id=data["receipt_id"],
            valid=data["valid"],
            chain_hash=data["chain_hash"],
            recomputed_hash=data["recomputed_hash"],
            message=data["message"],
        )

    def track(self, input_param: str = None):
        """
        Decorator that automatically creates a reasoning receipt for a sync function.
        """
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                logger = StepsLogger()
                kwargs["steps_logger"] = logger

                # Determine input value for the receipt
                input_value = "unknown"
                if input_param and input_param in kwargs:
                    input_value = str(kwargs[input_param])
                elif args:
                    input_value = str(args[0]) if len(args) == 1 else str(args)

                result = func(*args, **kwargs)

                output_value = str(result) if result is not None else ""

                try:
                    steps = logger.get_steps()
                    if not steps:
                        steps = [{"thought": f"Function {func.__name__} executed"}]

                    self.create(
                        input=input_value,
                        steps=steps,
                        output=output_value,
                    )
                except Exception:
                    pass

                return result
            return wrapper
        return decorator
