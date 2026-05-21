import enum


class RoadmapStage(str, enum.Enum):
    fundamentals = "fundamentals"
    basic = "basic"
    advanced = "advanced"


class SubscriptionPlan(str, enum.Enum):
    free = "free"
    premium = "premium"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    canceled = "canceled"
    past_due = "past_due"


class UploadStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class SessionType(str, enum.Enum):
    quiz = "quiz"
    review = "review"
    chat = "chat"
