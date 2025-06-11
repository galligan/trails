# Logbooks Terminology Guide

## Core Metaphor: Field Research meets Outdoor Exploration

Drawing from both scientific field research and outdoor exploration traditions, Logbooks uses terminology that feels natural to both contexts.

## Primary Terms

### Entry Types (Current)
Current types: `update`, `decision`, `error`, `handoff`, `observation`, `task`, `checkpoint`

**Suggested field-inspired additions/refinements:**

1. **`waypoint`** - A significant marker or milestone reached
   - Replaces or complements: `checkpoint`
   - Usage: "Reached waypoint: API integration complete"

2. **`bearing`** - Direction or approach decision
   - Complements: `decision`
   - Usage: "New bearing: switching to event-driven architecture"

3. **`hazard`** - Warning or danger encountered
   - Replaces or complements: `error`
   - Usage: "Hazard: memory leak detected in worker process"

4. **`field-note`** - Quick observation while in motion
   - Complements: `update`
   - Usage: "Field note: users requesting dark mode"

5. **`summit`** - Major achievement or goal reached
   - New type
   - Usage: "Summit: v1.0 released to production"

6. **`weather`** - Environmental conditions/context
   - New type
   - Usage: "Weather: high server load, scaling up"

## Action Terminology

### Current Actions
- `add` → Could also support: **`record`**, **`log`**, **`jot`**
- `list` → Could also support: **`review`**, **`recap`**, **`survey`**

### Potential New Actions
- **`scout`** - Search for specific patterns or entries
- **`track`** - Follow entries from a specific author or type
- **`chart`** - Visualize or summarize journey/progress

## Conceptual Language

### The Logbook as Equipment
- "Your logbook is essential gear for the journey"
- "Pack light, but never forget your logbook"
- "A reliable logbook for every expedition"

### Recording Metaphors
- **"Field notes"** instead of "entries" (where appropriate)
- **"Journey log"** for chronological views
- **"Base camp"** for the main/home view
- **"Expedition log"** for a complete record

### Time-based Language
- **"Today's trek"** - Recent entries
- **"Previous expeditions"** - Historical data
- **"Dawn/Dusk entries"** - Start/end of day summaries

## Example Usage in Context

### CLI Examples
```bash
# Recording a waypoint
logbook add "Reached data migration waypoint" --type waypoint

# Logging a hazard
logbook add "Hazard: API rate limit approaching" --type hazard

# Recording weather conditions
logbook add "Weather: System load normal, all services green" --type weather

# Summit celebration
logbook add "Summit! Released v2.0 after 6-month climb" --type summit
```

### In Documentation
"Every explorer needs a reliable logbook. Whether you're charting new territory in your codebase or documenting the hazards you've encountered, Logbooks keeps your expedition notes organized and accessible."

### Error Messages with Personality
- "Can't find the logbook! Check your path and try again."
- "Logbook locked by another explorer. Wait and retry."
- "Entry too long for logbook page. Consider splitting into multiple entries."

## Extended Vocabulary

### Author Types with Field Flavor
- `ranger` - Service/monitoring authors
- `scout` - Agent authors doing reconnaissance
- `guide` - User authors leading the way

### Status/State Terms
- **"On journey"** - Active/in progress
- **"At camp"** - Paused/waiting
- **"Summited"** - Completed successfully
- **"Turned back"** - Cancelled/aborted

### Organization Terms
- **"Expedition"** - A project or major initiative
- **"Route"** - A planned sequence of tasks
- **"Terrain"** - The problem space or domain

## Implementation Ideas

### Future Features with Field Flavor
1. **Journey Maps** - Visualizations of entry patterns
2. **Weather Reports** - System status summaries
3. **Gear Check** - Validation/health checks
4. **Waypoint Markers** - Important entries that others should see
5. **Shelter Logs** - Shared team logbooks

### CLI Personality
```bash
$ logbook add "Starting new feature"
📝 Recorded in logbook at 14:23:07

$ logbook list --type hazard
⚠️  Recent hazards on the journey:
- [14:00] Memory leak in worker process
- [13:45] Database connection timeout

$ logbook summit "Deployed to production!"
🏔️ Summit reached! Entry recorded in logbook.
```

## Brand Voice Guidelines

### Tone
- **Encouraging**: Like an experienced guide
- **Practical**: Focused on the task at hand
- **Observant**: Noticing details worth recording

### Language Principles
1. **Active voice**: "Record your observation" not "Observations should be recorded"
2. **Present tense**: "The logbook tracks..." not "The logbook will track..."
3. **Concrete imagery**: "Mark this waypoint" not "Create a checkpoint entry"

### Avoiding Overuse
- Don't force the metaphor where it doesn't fit
- Technical accuracy trumps thematic consistency
- Use standard terms for technical operations (database, API, etc.)

## Summary

The Logbooks terminology draws from both scientific field research and outdoor exploration, creating a unique voice that:
- Feels professional yet approachable
- Supports the "outfitter" brand theme
- Makes routine logging feel like part of an adventure
- Scales from solo developers to expedition teams

The key is balance: enough personality to be memorable, but not so much that it obscures functionality.