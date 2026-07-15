import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Utensils, Activity, Trophy, MessageSquare, Settings, Zap, Heart, Skull, Flame, Star } from 'lucide-react';
import './App.css';

const BADGE_ICONS = {
  first_bite: '🍼', ten_commits: '⚔️', fifty_commits: '🤖', centurion: '👑',
  night_owl: '🦉', early_bird: '🐦', streak_3: '🔥', streak_7: '💥',
  lvl5: '🎖️', lvl8: '⭐',
};

const SPRITES = {
  happy: `  ╱|、\n (˚ˎ 。7\n  |、˜〵\n  じしˍ,)ノ`,
  eating: `  ╱|、\n (˚ˎ 。7  nom nom~\n  |、˜〵\n  じしˍ,)ノ`,
  hungry: `  ╱|、\n (×̩̩ ˎ 。7  ... feed me\n  |、˜〵\n  じしˍ,)ノ`,
  sleeping: `  ╱|、\n (  ̳• ·̫  7  z Z z\n  |、˜〵\n  じしˍ,)ノ`,
  dead: `     ___\n    /RIP\\\\\n   | ~~~ |\n   |     |\n   |     |\n---+-----+---`,
  angry: `  ╱|、\n (╬ ˎ 。7  < not cool\n  |、˜〵\n  じしˍ,)ノ`,
  egg: `     ___\n    /   \\\\\n   | . . |\n   |  u  |\n    \\\\___/`,
  evolved: `     /\\_/\\\\\n    ( o.o )  ★\n     > ^ <\n    /|   |\\\\\n   (_|   |_)`,
};

function getSprite(state) {
  if (!state) return SPRITES.egg;
  if (state.health <= 0) return SPRITES.dead;
  if (state.level <= 1) return SPRITES.egg;
  if (state.hunger >= 90) return SPRITES.hungry;
  if (state.hunger >= 70) return SPRITES.angry;
  if (state.happiness < 20) return SPRITES.sleeping;
  return SPRITES.happy;
}

function Particles() {
  const count = 30;
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 10,
    size: 1 + Math.random() * 2,
    opacity: 0.15 + Math.random() * 0.25,
  })), []);

  return (
    <div className="particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.left}%`,
          width: p.size, height: p.size,
          opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

function PetCard({ state, onMouseMove }) {
  const cardRef = useRef(null);
  const shineRef = useRef(null);

  const handleMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    if (shineRef.current) {
      shineRef.current.style.transform = `translate(${x - rect.width}px, ${y - rect.height}px)`;
    }
  }, []);

  const handleLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'rotateX(0) rotateY(0)';
    }
  }, []);

  const sprite = getSprite(state);

  return (
    <div className="pet-card-wrapper">
      <div ref={cardRef} className="pet-card" onMouseMove={handleMove} onMouseLeave={handleLeave}>
        <div className="holo-overlay" />
        <div ref={shineRef} className="shine" />
        <div className="pet-card-inner">
          <pre className="pet-ascii">{sprite}</pre>
          <div className="pet-name">{state?.name || 'Commitachi'}</div>
          <div className="pet-title-label">{state?.title || 'Egg'}</div>
          <div className="pet-level-badge">LV. {state?.level || 1}</div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, type }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar-track">
        <div className={`stat-bar-fill ${type}`} style={{ width: `${Math.max(2, value)}%` }} />
      </div>
      <span className="stat-value">{value}%</span>
    </div>
  );
}

function App() {
  const [state, setState] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState(false);
  const [feedMsg, setFeedMsg] = useState('');
  const [levelUp, setLevelUp] = useState(null);
  const [apiKey, setApiKey] = useState('');

  const fetchState = useCallback(async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/badges'),
      ]);
      const s = await sRes.json();
      const b = await bRes.json();
      setState(s);
      setBadges(b);
      if (s.config?.geminiKey) setApiKey(s.config.geminiKey);
    } catch (err) {
      console.error('Failed to fetch state', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  // auto-refresh every 30s to pick up decay
  useEffect(() => {
    const t = setInterval(fetchState, 30000);
    return () => clearInterval(t);
  }, [fetchState]);

  const handleFeed = useCallback(async () => {
    setFeeding(true);
    setFeedMsg('');
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedMsg(data.error || 'Something went wrong');
        return;
      }

      if (data.alreadyFed) {
        setFeedMsg('Already ate that commit. Make a new one!');
        return;
      }

      setState(data.state);
      setFeedMsg(data.roast);

      if (data.leveledUp) {
        setLevelUp(data.state);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      if (data.newBadges?.length > 0) {
        confetti({ particleCount: 60, spread: 50 });
      }

      // refresh badges
      const bRes = await fetch('/api/badges');
      const b = await bRes.json();
      setBadges(b);
    } catch {
      setFeedMsg('Failed to connect to server');
    } finally {
      setFeeding(false);
    }
  }, []);

  const handleSaveKey = useCallback(async () => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geminiKey: apiKey }),
    });
    fetchState();
  }, [apiKey, fetchState]);

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <h1>Commitachi</h1>
          <p className="subtitle">Loading your pet...</p>
        </div>
        <div className="grid">
          <div className="card"><div className="skeleton skeleton-card" /></div>
          <div className="card"><div className="skeleton skeleton-card" /></div>
        </div>
      </div>
    );
  }

  const roasts = [...(state?.roastHistory || [])].reverse();

  return (
    <>
      <Particles />
      <div className="app">
        <header className="header">
          <h1>Commitachi</h1>
          <p className="subtitle">your terminal pet that feeds on git commits</p>
        </header>

        {/* Metrics */}
        <div className="card full-width" style={{ marginBottom: '1.5rem' }}>
          <div className="metrics">
            <div className="metric">
              <div className="metric-value">{state?.totalCommits || 0}</div>
              <div className="metric-label">Commits</div>
            </div>
            <div className="metric">
              <div className="metric-value">{state?.streak || 0}</div>
              <div className="metric-label">Streak</div>
            </div>
            <div className="metric">
              <div className="metric-value">{state?.xp || 0}</div>
              <div className="metric-label">XP</div>
            </div>
            <div className="metric">
              <div className="metric-value">{state?.badges?.length || 0}</div>
              <div className="metric-label">Badges</div>
            </div>
          </div>
        </div>

        <div className="grid">
          {/* Pet Card */}
          <div className="card">
            <div className="card-title"><Star size={16} /> Your Pet</div>
            <PetCard state={state} />
          </div>

          {/* Stats */}
          <div className="card">
            <div className="card-title"><Activity size={16} /> Vital Stats</div>
            <StatBar label="Health" value={state?.health || 0} type="health" />
            <StatBar label="Hunger" value={state?.hunger || 0} type="hunger" />
            <StatBar label="Happiness" value={state?.happiness || 0} type="happiness" />
            {state?.nextLevel?.nextTitle && (
              <StatBar
                label={`→ ${state.nextLevel.nextTitle}`}
                value={Math.round(state.nextLevel.progress || 0)}
                type="xp"
              />
            )}

            <div className="feed-section">
              <button className="feed-btn" onClick={handleFeed} disabled={feeding}>
                <Utensils size={16} />
                <span>{feeding ? 'Feeding...' : 'Feed Pet'}</span>
              </button>
              {feedMsg && <p className="feed-msg">{feedMsg}</p>}
            </div>
          </div>

          {/* Badges */}
          <div className="card">
            <div className="card-title"><Trophy size={16} /> Badges</div>
            <div className="badges-grid">
              {badges.map((b) => (
                <div key={b.id} className={`badge-item ${b.earned ? 'earned' : 'locked'}`}>
                  <span className="badge-icon">{BADGE_ICONS[b.id] || '🏅'}</span>
                  <div className="badge-info">
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roast Stream */}
          <div className="card">
            <div className="card-title"><MessageSquare size={16} /> Roast Stream</div>
            {roasts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No roasts yet. Feed your pet to get roasted!
              </p>
            ) : (
              <div className="roast-list">
                {roasts.map((r, i) => (
                  <div key={i} className="roast-item">
                    <div className="roast-text">"{r.text}"</div>
                    <div className="roast-meta">
                      <span className="roast-commit">{r.commit}</span>
                      <span>{new Date(r.date).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config */}
          <div className="card full-width">
            <div className="card-title"><Settings size={16} /> Configuration</div>
            <div className="config-row">
              <input
                className="config-input"
                type="password"
                placeholder="Gemini API Key (optional — offline roasts work without it)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button className="config-btn" onClick={handleSaveKey}>Save Key</button>
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Overlay */}
      {levelUp && (
        <div className="levelup-overlay" onClick={() => setLevelUp(null)}>
          <div className="levelup-box" onClick={(e) => e.stopPropagation()}>
            <h2>★ LEVEL UP ★</h2>
            <div className="lv-title">Lv.{levelUp.level} — {levelUp.title}</div>
            <button onClick={() => setLevelUp(null)}>Nice!</button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
