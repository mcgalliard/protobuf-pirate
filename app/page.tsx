"use client";

import { useMemo, useState } from "react";

type Chapter = "map" | "schema" | "wire" | "evolve" | "challenge";

const chapters: { id: Chapter; label: string; eyebrow: string }[] = [
  { id: "map", label: "Why Protobuf?", eyebrow: "01 · The problem" },
  { id: "schema", label: "Write a schema", eyebrow: "02 · The contract" },
  { id: "wire", label: "Pack the bytes", eyebrow: "03 · The wire" },
  { id: "evolve", label: "Evolve safely", eyebrow: "04 · The future" },
  { id: "challenge", label: "Captain’s test", eyebrow: "05 · The challenge" },
];

const schemaFields = [
  { type: "string", name: "name", tag: 1, value: '"Mina"', color: "coral" },
  { type: "int32", name: "id", tag: 2, value: "42", color: "gold" },
  { type: "bool", name: "active", tag: 3, value: "true", color: "mint" },
];

function Progress({ active }: { active: Chapter }) {
  const index = chapters.findIndex((item) => item.id === active);
  return (
    <aside className="journey-rail" aria-label="Learning journey">
      <a className="brand" href="#top" aria-label="Proto Pirate home">
        <span className="brand-mark">P</span>
        <span>PROTO<br />PIRATE</span>
      </a>
      <div className="route">
        <div className="route-line" aria-hidden="true"><span style={{ height: `${(index / 4) * 100}%` }} /></div>
        {chapters.map((chapter, i) => (
          <a key={chapter.id} href={`#${chapter.id}`} className={i <= index ? "visited" : ""}>
            <span className="route-dot">{i < index ? "✓" : i + 1}</span>
            <span><small>{chapter.eyebrow}</small>{chapter.label}</span>
          </a>
        ))}
      </div>
      <div className="rail-note">A field guide to<br />Protocol Buffers</div>
    </aside>
  );
}

function CompareDemo() {
  const [format, setFormat] = useState<"json" | "protobuf">("protobuf");
  const data = format === "json"
    ? ['{', '  "name": "Mina",', '  "id": 42,', '  "active": true', '}']
    : ['0A 04 4D 69 6E 61', '10 2A', '18 01'];
  return (
    <div className="compare-card">
      <div className="toggle" role="group" aria-label="Compare message formats">
        <button className={format === "json" ? "selected" : ""} onClick={() => setFormat("json")}>JSON</button>
        <button className={format === "protobuf" ? "selected" : ""} onClick={() => setFormat("protobuf")}>PROTOBUF</button>
      </div>
      <div className="payload">
        <div className="payload-top"><span>CREW MEMBER</span><strong>{format === "json" ? "49 bytes" : "10 bytes"}</strong></div>
        <pre>{data.join("\n")}</pre>
        <div className="byte-meter"><span style={{ width: format === "json" ? "100%" : "20%" }} /></div>
        <p>{format === "json" ? "Readable, but every field name sails along too." : "Same meaning. Less cargo. The schema carries the labels."}</p>
      </div>
    </div>
  );
}

function SchemaBuilder() {
  const [visible, setVisible] = useState([true, true, true]);
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => `message CrewMember {\n${schemaFields.filter((_, i) => visible[i]).map((f) => `  ${f.type} ${f.name} = ${f.tag};`).join("\n")}\n}`, [visible]);
  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className="schema-lab">
      <div className="lab-copy">
        <div className="label">YOUR MESSAGE</div>
        <p>Flip fields on and off. Each one needs a type, a name, and a permanent field number.</p>
        {schemaFields.map((field, i) => (
          <button key={field.name} className={`field-row ${visible[i] ? "on" : ""}`} onClick={() => setVisible(v => v.map((x, j) => j === i ? !x : x))}>
            <span className={`field-gem ${field.color}`}>{field.tag}</span>
            <span><strong>{field.name}</strong><small>{field.type} · example {field.value}</small></span>
            <span className="field-switch">{visible[i] ? "ON" : "OFF"}</span>
          </button>
        ))}
      </div>
      <div className="code-window">
        <div className="window-bar"><span>crew.proto</span><button onClick={copyCode}>{copied ? "COPIED!" : "COPY"}</button></div>
        <pre>{code.split("\n").map((line, i) => <span key={i}>{line}{"\n"}</span>)}</pre>
        <div className="code-tip"><b>KEEP THE TAGS!</b> Field numbers are the coordinates on your map. Never reuse a retired one.</div>
      </div>
    </div>
  );
}

function WireLab() {
  const [field, setField] = useState(0);
  const active = schemaFields[field];
  const bytes = [
    { key: "0A", value: "04 4D 69 6E 61", math: "(1 × 8) + 2 = 10 → 0A", desc: "Tag 1 + length-delimited wire type" },
    { key: "10", value: "2A", math: "(2 × 8) + 0 = 16 → 10", desc: "Tag 2 + varint wire type" },
    { key: "18", value: "01", math: "(3 × 8) + 0 = 24 → 18", desc: "Tag 3 + varint wire type" },
  ][field];
  return (
    <div className="wire-lab">
      <div className="wire-message">
        <div className="label">PICK A FIELD TO X-RAY</div>
        {schemaFields.map((item, i) => (
          <button key={item.name} className={field === i ? "active" : ""} onClick={() => setField(i)}>
            <span>{item.tag}</span><b>{item.name}</b><code>{item.value}</code>
          </button>
        ))}
      </div>
      <div className="xray">
        <div className="xray-title"><span>WIRE VIEW</span><small>FIELD #{active.tag}</small></div>
        <div className="byte-strip"><strong>{bytes.key}</strong><span>{bytes.value}</span></div>
        <div className="byte-labels"><span>KEY</span><span>VALUE</span></div>
        <div className="wire-math"><code>{bytes.math}</code><p>{bytes.desc}</p></div>
        <div className="aha"><b>AHA!</b> Protobuf doesn’t send <em>“{active.name}”</em>. It sends tiny tag <b>{active.tag}</b>, and your schema knows what that means.</div>
      </div>
    </div>
  );
}

function EvolutionDemo() {
  const [version, setVersion] = useState<"v1" | "v2">("v1");
  return (
    <div className="evolve-demo">
      <div className="version-switch">
        <button className={version === "v1" ? "active" : ""} onClick={() => setVersion("v1")}><small>OLD SHIP</small>App v1</button>
        <div className="signal"><i /><i /><i /></div>
        <button className={version === "v2" ? "active" : ""} onClick={() => setVersion("v2")}><small>NEW SHIP</small>App v2</button>
      </div>
      <div className="schema-stack">
        <code><span>1</span> string name = 1;</code>
        <code><span>2</span> int32 id = 2;</code>
        <code className={version === "v2" ? "new-field" : "ghost-field"}><span>3</span> string role = 4; <b>NEW</b></code>
      </div>
      <div className="compat-result">
        <span className="result-icon">{version === "v1" ? "?" : "✓"}</span>
        <div><b>{version === "v1" ? "Unknown field? Skip it." : "New field received!"}</b><p>{version === "v1" ? "Old apps keep sailing. They read the fields they know and safely ignore #4." : "App v2 understands role, while the original fields still work exactly as before."}</p></div>
      </div>
      <p className="golden-rule"><b>THE GOLDEN RULE</b> Add new fields with new numbers. Don’t change what an existing number means.</p>
    </div>
  );
}

function Challenge() {
  const [answer, setAnswer] = useState<number | null>(null);
  const choices = ["Change field #2 to string", "Add email as field #4", "Delete #2 and reuse it", "Rename the message on the wire"];
  return (
    <div className="challenge-card">
      <div className="challenge-head"><span>FINAL CHECKPOINT</span><b>1 / 1</b></div>
      <h3>Your fleet already uses <code>id = 2</code>. How do you add an email safely?</h3>
      <div className="answers">
        {choices.map((choice, i) => (
          <button key={choice} className={answer === i ? (i === 1 ? "correct" : "wrong") : ""} onClick={() => setAnswer(i)}>
            <span>{String.fromCharCode(65 + i)}</span>{choice}<b>{answer === i ? (i === 1 ? "✓" : "×") : ""}</b>
          </button>
        ))}
      </div>
      {answer !== null && <div className={`feedback ${answer === 1 ? "success" : "try"}`}>
        <b>{answer === 1 ? "SHIPSHAPE!" : "NOT QUITE—TRY AGAIN."}</b>
        <span>{answer === 1 ? "A fresh field number keeps old and new clients compatible." : "Existing field numbers are permanent coordinates. Give the new field a new one."}</span>
      </div>}
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<Chapter>("map");
  return (
    <main id="top">
      <Progress active={active} />
      <div className="content">
        <section className="hero" id="map" onMouseEnter={() => setActive("map")}>
          <div className="eyebrow">INTERACTIVE FIELD GUIDE · 12 MINUTES</div>
          <h1>Learn Protobuf.<br /><em>Pack light.</em> Sail fast.</h1>
          <p className="hero-lede">Turn structured data into tiny, speedy messages—and learn how to evolve them without sinking your fleet.</p>
          <a href="#schema" className="cta">BEGIN THE VOYAGE <span>↓</span></a>
          <div className="hero-compass" aria-hidden="true"><i>N</i><span>PB</span><b>⌁</b></div>
          <div className="scroll-note">SCROLL TO EXPLORE <span>↓</span></div>
        </section>

        <section className="chapter why" onMouseEnter={() => setActive("map")}>
          <div className="chapter-copy"><span className="chapter-no">01</span><div className="eyebrow">THE PROBLEM</div><h2>Every byte is<br />cargo.</h2><p>Apps constantly trade structured data. Text formats are friendly, but they repeat labels in every message. Protobuf agrees on those labels once—inside a shared schema.</p><div className="takeaway"><b>IN ONE LINE</b><span>Protocol Buffers is a language-neutral way to serialize structured data.</span></div></div>
          <CompareDemo />
        </section>

        <section className="chapter sand" id="schema" onMouseEnter={() => setActive("schema")}>
          <div className="section-heading"><span className="chapter-no">02</span><div><div className="eyebrow">THE CONTRACT</div><h2>Draw the map.</h2><p>A <code>.proto</code> file describes the shape of your data before any bytes set sail.</p></div></div>
          <SchemaBuilder />
        </section>

        <section className="chapter deep" id="wire" onMouseEnter={() => setActive("wire")}>
          <div className="section-heading light"><span className="chapter-no">03</span><div><div className="eyebrow">THE WIRE FORMAT</div><h2>Open the cargo.</h2><p>Each encoded field is a key-value pair. The key combines a field number with a wire type.</p></div></div>
          <WireLab />
        </section>

        <section className="chapter paper" id="evolve" onMouseEnter={() => setActive("evolve")}>
          <div className="section-heading"><span className="chapter-no">04</span><div><div className="eyebrow">SAFE EVOLUTION</div><h2>Upgrade at sea.</h2><p>Your users won’t update together. Good schemas let old and new code talk during the crossing.</p></div></div>
          <EvolutionDemo />
        </section>

        <section className="chapter finale" id="challenge" onMouseEnter={() => setActive("challenge")}>
          <div className="section-heading light centered"><span className="chapter-no">05</span><div><div className="eyebrow">CAPTAIN’S TEST</div><h2>Claim your flag.</h2><p>One last call before you command the protocol.</p></div></div>
          <Challenge />
          <div className="treasure-list">
            <span>✓ DEFINE</span><span>✓ GENERATE</span><span>✓ SERIALIZE</span><span>✓ EVOLVE</span>
          </div>
          <a className="restart" href="#top" onClick={() => setActive("map")}>↻ SAIL AGAIN</a>
        </section>
      </div>
    </main>
  );
}
