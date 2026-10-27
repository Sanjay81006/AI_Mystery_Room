import 'dotenv/config';

const counts = {
  Easy: [3, 5, 2],
  Medium: [4, 7, 3],
  Hard: [5, 9, 3]
};

const demo = {
  title: 'The Last Light at Bellwether',
  story: 'At 9:17 PM, during a rain-lashed gathering at Bellwether House, antiquarian Elias Vane was found unconscious in the locked map room. The priceless Starling compass has vanished. The storm has cut the estate off from the road. Someone knows the old service passages.',
  suspects: [
    ['Mara Voss', 'Restoration artist', 'Elias planned to sell her family paintings.', 'In the conservatory cataloguing frames.'],
    ['Dr. Ivo Saye', 'Historian', 'The compass would validate his disputed research.', 'On a call in the east gallery.'],
    ['June Bell', 'House manager', 'Elias found missing funds in the estate accounts.', 'In the kitchen with the staff.'],
    ['Theo Rusk', 'Travel writer', 'He owed Elias a large sum.', 'Outside on the covered terrace.'],
    ['Nell Armitage', 'Caretaker', 'Elias planned to close the house.', 'Checking the generator in the cellar.']
  ].map((x, i) => ({ id: 's' + (i + 1), name: x[0], role: x[1], motive: x[2], alibi: x[3] })),
  clues: [
    ['The clockwork moth', 'A brass moth lies beside the map cabinet, its wings set to 9:05.'],
    ['Wet footprints', 'A trail crosses the hall, but each print has a clean, dry centre.'],
    ['The call log', 'The east gallery phone has no outgoing call logged tonight.'],
    ['Ledger ribbon', 'A blue silk thread is caught in a page noting an account discrepancy.'],
    ['Map pin', 'A pin marks a narrow servants’ stair behind the map room.'],
    ['Tea service', 'One cup in the kitchen is untouched and still warm.'],
    ['Terrace latch', 'The terrace latch is rusted shut from the inside.'],
    ['Generator switch', 'The cellar generator was never switched on.'],
    ['Compass case', 'A crescent of blue silk is caught in the empty velvet case.']
  ].map((x, i) => ({ id: 'c' + (i + 1), title: x[0], description: x[1], detail: x[1] })),
  hints: [
    { id: 'h1', title: 'A small inconsistency', description: 'Compare alibis that rely on a device or door with physical traces.' },
    { id: 'h2', title: 'Follow the thread', description: 'Blue silk appears twice. Who had access to both places?' },
    { id: 'h3', title: 'The route matters', description: 'The culprit used the servants’ stair and staged a false trail.' }
  ],
  trueCulprit: 's3',
  explanation: 'June Bell took the compass through the servants’ stair. Blue silk from her work apron was caught in both the ledger and case. The staged prints and false outage distracted from the hidden route; the untouched tea and inactive generator undermine her alibi.'
};

export async function generateMystery(premise, difficulty) {
  const [ns, nc, nh] = counts[difficulty] || [];
  if (!ns) throw new Error('Choose a valid difficulty.');

  let data;
  
  // Pulling securely from .env and stripping hidden Windows characters
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

  try {
    const prompt = `Create a fair, logically solvable fictional crime mystery based on the following premise: ${JSON.stringify(premise)}. Difficulty setting: ${difficulty}. Return ONLY a clean JSON object layout matching: { "title": "string", "story": "string", "suspects": [{"id": "string", "name": "string", "role": "string", "motive": "string", "alibi": "string"}], "clues": [{"id": "string", "title": "string", "description": "string", "detail": "string"}], "hints": [{"id": "string", "title": "string", "description": "string"}], "trueCulprit": "string", "explanation": "string" }. Output exactly ${ns} suspects, ${nc} clues, and ${nh} hints. trueCulprit must match a suspect ID.`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    console.log("🌐 Sending request to:", url.replace(apiKey, "HIDDEN_KEY"));
    
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!r.ok) throw new Error(`API error connection returned: ${r.statusText} (${r.status})`);
    const resJson = await r.json();
    
    if (resJson && resJson.candidates && resJson.candidates[0]?.content?.parts[0]?.text) {
      let rawText = resJson.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      data = JSON.parse(rawText);
    } else {
      throw new Error("Unexpected data structure shape.");
    }
  } catch (apiError) {
    console.error("⚠️ Gemini Engine error, using fallback data:", apiError.message);
    data = { 
      ...demo, 
      suspects: demo.suspects.slice(0, ns), 
      clues: demo.clues.slice(0, nc), 
      hints: demo.hints.slice(0, nh) 
    };
  }

  if (!data || !data.suspects || data.suspects.length !== ns || !data.clues || data.clues.length !== nc || !data.hints || data.hints.length !== nh || !data.suspects.some(s => s.id === data.trueCulprit)) {
    console.warn("⚠️ AI output failed validation, reverting to fallback data.");
    data = {
      ...demo,
      suspects: demo.suspects.slice(0, ns),
      clues: demo.clues.slice(0, nc),
      hints: demo.hints.slice(0, nh)
    };
  }

  return {
    ...data,
    premise,
    difficulty,
    clues: data.clues.map(c => ({ ...c, isDiscovered: false })),
    hints: data.hints.map(h => ({ ...h, isUsed: false }))
  };
}