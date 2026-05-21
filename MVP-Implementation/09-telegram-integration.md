# Step 9: Telegram Integration

## Objective
Integrate Telegram for reminders, quick quizzes, and streak notifications.

## Why this matters
Telegram makes the product available where users already spend time, especially in Uzbekistan and Central Asia.

## Deliverables
- Telegram bot registration and webhook setup
- User account linking to Telegram
- Daily learning reminder feature at a user-chosen time
- Quick 5-question quiz on demand
- Streak and habit notifications

## Tasks
1. Register the Telegram bot and get a bot token.
2. Create backend endpoints for Telegram webhook events.
3. Build account linking flow:
   - user adds bot
   - app verifies chat ID
4. Implement reminder scheduling and delivery.
5. Add quick quiz command in the bot.
6. Send streak notifications for consistent usage.

## Onboarding notes
- Start with a simple text-based bot, then add richer buttons if needed.
- Keep the bot flow lightweight and focused on reminders + quizzes.
- Ensure the bot does not require every user to access the web app.
