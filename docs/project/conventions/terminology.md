# Fieldbooks Terminology Guide

## Core Metaphor: Field Research meets Outdoor Exploration

Drawing from both scientific field research and outdoor exploration traditions, Fieldbooks uses terminology that feels natural to both contexts.

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

4. **`trail-note`** - Quick observation while in motion
   - Complements: `update`
   - Usage: "Trail note: users requesting dark mode"

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

### The Fieldbook as Equipment
- "Your fieldbook is essential gear for the journey"
- "Pack light, but never forget your fieldbook"
- "A reliable fieldbook for every expedition"

### Recording Metaphors
- **"Field notes"** instead of "entries" (where appropriate)
- **"Trail log"** for chronological views
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
fieldbooks add "Reached data migration waypoint" --type waypoint

# Logging a hazard
fieldbooks add "Hazard: API rate limit approaching" --type hazard

# Recording weather conditions
fieldbooks add "Weather: System load normal, all services green" --type weather

# Summit celebration
fieldbooks add "Summit! Released v2.0 after 6-month climb" --type summit
```

### In Documentation
"Every explorer needs a reliable fieldbook. Whether you're charting new territory in your codebase or documenting the hazards you've encountered, Fieldbooks keeps your expedition notes organized and accessible."

### Error Messages with Personality
- "Can't find the fieldbook! Check your path and try again."
- "Fieldbook locked by another explorer. Wait and retry."
- "Entry too long for fieldbook page. Consider splitting into multiple entries."

## Extended Vocabulary

### Author Types with Field Flavor
- `ranger` - Service/monitoring authors
- `scout` - Agent authors doing reconnaissance
- `guide` - User authors leading the way

### Status/State Terms
- **"On trail"** - Active/in progress
- **"At camp"** - Paused/waiting
- **"Summited"** - Completed successfully
- **"Turned back"** - Cancelled/aborted

### Organization Terms
- **"Expedition"** - A project or major initiative
- **"Route"** - A planned sequence of tasks
- **"Terrain"** - The problem space or domain

## Implementation Ideas

### Future Features with Field Flavor
1. **Trail Maps** - Visualizations of entry patterns
2. **Weather Reports** - System status summaries
3. **Gear Check** - Validation/health checks
4. **Trail Markers** - Important entries that others should see
5. **Shelter Logs** - Shared team fieldbooks

### CLI Personality
```bash
$ fieldbooks add "Starting new feature"
📝 Recorded in fieldbook at 14:23:07

$ fieldbooks list --type hazard
⚠️  Recent hazards on the trail:
- [14:00] Memory leak in worker process
- [13:45] Database connection timeout

$ fieldbooks summit "Deployed to production!"
🏔️ Summit reached! Entry recorded in fieldbook.
```

## Brand Voice Guidelines

### Tone
- **Encouraging**: Like an experienced guide
- **Practical**: Focused on the task at hand
- **Observant**: Noticing details worth recording

### Language Principles
1. **Active voice**: "Record your observation" not "Observations should be recorded"
2. **Present tense**: "The fieldbook tracks..." not "The fieldbook will track..."
3. **Concrete imagery**: "Mark this waypoint" not "Create a checkpoint entry"

### Avoiding Overuse
- Don't force the metaphor where it doesn't fit
- Technical accuracy trumps thematic consistency
- Use standard terms for technical operations (database, API, etc.)

## Summary

The Fieldbooks terminology draws from both scientific field research and outdoor exploration, creating a unique voice that:
- Feels professional yet approachable
- Supports the "outfitter" brand theme
- Makes routine logging feel like part of an adventure
- Scales from solo developers to expedition teams

The key is balance: enough personality to be memorable, but not so much that it obscures functionality.