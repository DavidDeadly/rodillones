## Problem

Football matches are hard to organize, even when it's just a football 7 match.
It gets even harder when organizing through messaging apps, like our WhatsApp group Rodillones.

For a player to register, the player would have to copy the previous registration message, enter their name and send it.

### Example.
<img src="https://github.com/user-attachments/assets/fb68b7e8-2608-4b28-9215-21c1d508b632" alt="example-convocatory" height="500">

This worked well for a few years, but since they group is been growing since I joined, the demand to be among the 14 players register to play the next Sunday was rising.
This led to players simultaniously copying and inserting their name, to erase each other.

For instance, **If David and Diego copy the same convocatory message**, and then this **happens parallelly**:

1. **David inserts his name and sends the convocatory updated (without Diego in it)**
1. **Diego inserts his name and sends the convocatory updated (without David in it)**

Whatever updated convocatory message gets sent last would cause one player to be completely discarded.

## Solution

With this in mind, it was clear that the app should: 

1. Be a real time app that handles registration for two teams of seven, and an infinite extra team. This last one is a waiting list in case any player from the two main teams cancels their registration
3. Be as simple and user friendly as possible since the players in our group are from various age groups
4. Provide an easy migration and integration to our existing WhatsApp group, so any change made to the Event in the app, should notify via WhatsApp message to the group members directly, with the exact message structure we've been using for years.

### And that's exactly what I did

| Event Full | Event Starting/Active |
| ------- | ------- |
| ![event-full](https://github.com/user-attachments/assets/918f0601-c090-4a8e-91ed-f90c39a035ad) | ![event-starting](https://github.com/user-attachments/assets/d22e4b6a-3366-4b26-978c-9e71ddc200af) |

### Tools used:

1. Real time interaction via WebSocket with [Pusher](https://pusher.com)
2. WhatsApp group interaction with [Whapi](https://whapi.cloud)
3. [MongoDB](https://mongodb.com) for data storage
4. [Supabase](https://supabase.com) for authentication and twiliio integration for phone verification
5. [NextJS](https://nextjs.org) full stack framework
6. UI components with [ShadCN](https://ui.shadcn.com)
7. [Vercel](https://vercel.com) deployment

# Notes

- Yep, those are a lot of tools, but this project was expected to be finished in one week, in order to be used right away for our next football event. So I leveraged all I could.
- At the end, I couldn't convince the group members to use the application, not even trying it, so I abandoned it.
- Due to time constraints and lack of adoption, the project was discontinued, however, the idea remains solid.
