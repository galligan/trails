import { setupDatabase, listNotes } from 'trails-lib';

async function runDemo() {
  console.log('🔍 Trails Demo - Listing all notes\n');

  const db = await setupDatabase('./basecamp-demo.sqlite');
  const notes = await listNotes(db, { limit: 10 });

  if (notes.length === 0) {
    console.log('No notes found. Run "node setup.js" first to create demo data.');
    return;
  }
  notes.forEach((note, index) => {
    const date = new Date(note.ts).toLocaleDateString();
    const time = new Date(note.ts).toLocaleTimeString();
    console.log(`📝 Note ${index + 1}`);
    console.log(`👤 Agent: ${note.agentId}`);
    console.log(`📅 Date: ${date} at ${time}`);
    console.log(`📄 Content:`);
    console.log(note.md);
    console.log(`\n${'─'.repeat(50)}\n`);
  });

  console.log(`✨ Found ${notes.length} notes total`);
}

runDemo().catch(console.error);
