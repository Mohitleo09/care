---
description: How to activate and verify the Production-Grade Booking Flow
---

# Booking Flow Lifecycle Activation

Follow these steps to ensure the new "Booking First" flow is fully operational in your environment.

### 1. Database Schema Sync
Since we've added `slug` fields and the `ScheduledJob` model, you MUST sync your database:
// turbo
```bash
npx prisma generate
npx prisma db push
```

### 2. Workspace Initialization
Existing workspaces need slugs. You can run this one-time script via a temporary route or console:
```javascript
// Example helper to backfill slugs
const workspaces = await prisma.workspace.findMany({ where: { slug: null } });
for (const ws of workspaces) {
  const slug = ws.name.toLowerCase().replace(/\s+/g, '-');
  await prisma.workspace.update({
    where: { id: ws.id },
    data: { slug: `${slug}-${ws.id.substring(0, 4)}` }
  });
}
```

### 3. Verify Patient URLs
The new routing structure is live at:
- `List Services`: `/workspace/{slug}/book`
- `Direct Service`: `/workspace/{slug}/book/{service-slug}`
- `Form Access`: `/forms/{accessToken}`
- `Patient Portal`: `/portal/{contactId}`

### 4. Background Job Processing
The system now populates the `ScheduledJob` table for 24h reminders. Ensure you have a worker or cronjob calling a "Process Jobs" endpoint every hour:
```javascript
// Suggested logic for your cron worker:
const jobs = await prisma.scheduledJob.findMany({
  where: { status: "PENDING", executeAt: { lt: new Date() } }
});
// ... execute notification logic ...
```

### 5. Staff Dashboard Verification
Check the `Appointments` tab in your dashboard. You should now see:
- **Compliance Column**: Real-time tracking of patient documentation.
- **Immediate Revalidation**: Try booking the same slot twice to verify the atomic race-condition protection.
- **Inventory Alerts**: If a service with consumable resources is booked, check the `Inventory` tab to see the deduction.
